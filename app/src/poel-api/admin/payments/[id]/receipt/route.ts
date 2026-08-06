import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/permissions";
import { getPaymentRequestById, getRequestDisplayInfo } from "@/lib/payments";
import {
  getPaymentCompanyName,
  getPaymentContactEmail,
  getPaymentContactPhone,
} from "@/lib/payment-branding";
import { getOperationalLogoUrl } from "@/lib/operational-brand";
import { poelLightInvoiceEmailStyles } from "@/lib/poel-theme";
import { sendTransactionalMail } from "@/lib/transactional-mail";
import { emailSvgCheckWhite16 } from "@/lib/transactional-visuals";
import { generatePaymentReceiptPdfBuffer } from "@/lib/payment-receipt-pdf";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import Stripe from "stripe";
import { paymentRailDisplayLabel } from "@/lib/payment-method-labels";
import { resolvePaymentIntentRail } from "@/lib/stripe-payment-rail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Log that module is loaded
console.log("[RECEIPT ROUTE] Module loaded at:", new Date().toISOString());

// Explicitly export route config to ensure POST is recognized
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET - Get receipt details for a payment request
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && !(dbUser && dbUser.role === "admin")) {
      return NextResponse.json({ error: "Only admins can view receipts" }, { status: 403 });
    }

    const { id } = await context.params;
    const paymentRequest = await getPaymentRequestById(id);

    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    // Get paymentIntentId from query params if provided (for interval billing)
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get("paymentIntentId");

    // For interval billing, check if the specific billing is completed instead of payment request status
    // For other payment types, check payment request status
    if (paymentIntentId) {
      // For interval billing with specific paymentIntentId, verify the payment intent exists and succeeded
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== "succeeded") {
          return NextResponse.json({ error: "Billing not completed" }, { status: 400 });
        }
        // Verify it matches this payment request (by public_token or payment_request_id for one-time/fee intents)
        const matchesByToken = paymentIntent.metadata?.public_token === paymentRequest.public_token;
        const matchesByRequestId = paymentIntent.metadata?.payment_request_id === paymentRequest.id;
        if (!matchesByToken && !matchesByRequestId) {
          return NextResponse.json(
            { error: "Payment intent does not match payment request" },
            { status: 400 },
          );
        }
      } catch (err) {
        console.error("Error fetching payment intent:", err);
        return NextResponse.json({ error: "Billing not found or not completed" }, { status: 400 });
      }
    } else {
      // For non-interval billing, check payment request status
      if (paymentRequest.status !== "completed") {
        return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
      }
    }

    const { name: recipientName, email: recipientEmail } = getRequestDisplayInfo(paymentRequest);
    const lineItems: InvoiceLineItem[] =
      paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
        ? paymentRequest.invoice_line_items
        : [];

    // Try to get payment intent details from Stripe if we have a customer
    let receiptDetails: any = {
      invoiceNumber: paymentRequest.invoice_number,
      amount: paymentRequest.amount,
      fee: 0,
      total: paymentRequest.amount,
      paymentMethod: "unknown",
      date: paymentRequest.updated_at || paymentRequest.created_at,
    };

    // If we have a specific paymentIntentId, use that; otherwise try to find matching payment intent
    if (paymentIntentId && paymentRequest.stripe_customer_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === "succeeded") {
          const originalAmount = parseFloat(paymentIntent.metadata?.originalAmount || "0");
          const fee = parseFloat(paymentIntent.metadata?.fee || "0");
          const total = paymentIntent.amount / 100;
          const method = await resolvePaymentIntentRail(stripe, paymentIntent);

          receiptDetails = {
            invoiceNumber: paymentIntent.metadata?.invoice_number
              ? parseInt(paymentIntent.metadata.invoice_number)
              : paymentRequest.invoice_number,
            amount: originalAmount || total,
            fee: fee,
            total: total,
            paymentMethod: method,
            date: new Date(paymentIntent.created * 1000).toISOString(),
            paymentIntentId: paymentIntent.id,
          };
        }
      } catch (err) {
        console.error("Error fetching payment intent details:", err);
        // Continue with basic details
      }
    } else if (paymentRequest.stripe_customer_id) {
      // If no specific paymentIntentId, try to find the most recent payment intent
      try {
        const paymentIntents = await stripe.paymentIntents.list({
          customer: paymentRequest.stripe_customer_id,
          limit: 10,
        });

        // Find payment intent that matches this payment request (by metadata or most recent)
        const matchingIntent =
          paymentIntents.data.find(
            (pi) =>
              pi.metadata?.public_token === paymentRequest.public_token &&
              pi.status === "succeeded",
          ) || paymentIntents.data.find((pi) => pi.status === "succeeded");

        if (matchingIntent && matchingIntent.status === "succeeded") {
          const originalAmount = parseFloat(matchingIntent.metadata?.originalAmount || "0");
          const fee = parseFloat(matchingIntent.metadata?.fee || "0");
          const total = matchingIntent.amount / 100;
          const method = await resolvePaymentIntentRail(stripe, matchingIntent);

          receiptDetails = {
            invoiceNumber: matchingIntent.metadata?.invoice_number
              ? parseInt(matchingIntent.metadata.invoice_number)
              : paymentRequest.invoice_number,
            amount: originalAmount || paymentRequest.amount,
            fee: fee,
            total: total,
            paymentMethod: method,
            date: new Date(matchingIntent.created * 1000).toISOString(),
            paymentIntentId: matchingIntent.id,
          };
        }
      } catch (err) {
        console.error("Error fetching payment intent details:", err);
        // Continue with basic details
      }
    }

    const format = searchParams.get("format");
    if (format === "pdf") {
      const invoiceNum =
        receiptDetails.invoiceNumber ??
        receiptDetails.paymentIntentId?.slice(-12).toUpperCase() ??
        "REC";
      const receiptDate = new Date(receiptDetails.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const amount = Number(receiptDetails.amount) || 0;
      const fee = Number(receiptDetails.fee) || 0;
      const total = Number(receiptDetails.total) || amount;

      const pdfBuffer = await generatePaymentReceiptPdfBuffer({
        invoiceNumber: invoiceNum,
        receiptDate,
        recipientName,
        recipientEmail,
        amount,
        fee,
        total,
        paymentMethod: receiptDetails.paymentMethod,
        lineItems,
      });
      const filename = `Receipt_${invoiceNum}.pdf`;
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      receipt: {
        ...receiptDetails,
        lineItems,
        recipientName,
        recipientEmail,
        publicToken: paymentRequest.public_token,
        paymentType: paymentRequest.payment_type,
      },
    });
  } catch (error: any) {
    console.error("Error fetching receipt details:", error);
    return NextResponse.json(
      { error: "Failed to fetch receipt details", details: error.message },
      { status: 500 },
    );
  }
}

// POST - Send receipt email to recipient
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log("[RECEIPT ROUTE POST] Handler called - START");
  console.log("[RECEIPT ROUTE POST] Request method:", request.method);
  console.log("[RECEIPT ROUTE POST] Request URL:", request.url);

  try {
    // TEMPORARY TEST: Uncomment to test if handler returns properly
    // return NextResponse.json({ test: 'POST handler works', timestamp: Date.now() }, { status: 200 });

    // Authentication and authorization
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      console.log("[RECEIPT ROUTE POST] No userId, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && !(dbUser && dbUser.role === "admin")) {
      console.log("[RECEIPT ROUTE POST] Not admin, returning 403");
      return NextResponse.json({ error: "Only admins can send receipts" }, { status: 403 });
    }

    const { id } = await context.params;
    console.log("[RECEIPT ROUTE POST] Payment request ID:", id);

    let paymentRequest;
    try {
      paymentRequest = await getPaymentRequestById(id);
      console.log("[RECEIPT ROUTE POST] Payment request found:", !!paymentRequest);
    } catch (err) {
      console.error("[RECEIPT ROUTE POST] Error fetching payment request:", err);
      return NextResponse.json(
        { error: "Error fetching payment request", details: String(err) },
        { status: 500 },
      );
    }

    if (!paymentRequest) {
      console.log("[RECEIPT ROUTE POST] Payment request not found, returning 404");
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    // Get paymentIntentId from query params if provided (for interval billing)
    console.log("[RECEIPT ROUTE POST] About to parse URL:", request.url);
    let paymentIntentIdParam;
    try {
      const { searchParams } = new URL(request.url);
      paymentIntentIdParam = searchParams.get("paymentIntentId");
      console.log("[RECEIPT ROUTE POST] PaymentIntentId from query:", paymentIntentIdParam);
    } catch (err) {
      console.error("[RECEIPT ROUTE POST] Error parsing URL:", err);
      return NextResponse.json({ error: "Invalid URL", details: String(err) }, { status: 400 });
    }

    // For interval billing, check if the specific billing is completed instead of payment request status
    // For other payment types, check payment request status
    console.log("[RECEIPT ROUTE POST] Checking payment status...");
    if (paymentIntentIdParam) {
      console.log("[RECEIPT ROUTE POST] Validating payment intent:", paymentIntentIdParam);
      // For interval billing with specific paymentIntentId, verify the payment intent exists and succeeded
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdParam);
        console.log("[RECEIPT ROUTE POST] Payment intent status:", paymentIntent.status);
        if (paymentIntent.status !== "succeeded") {
          console.log("[RECEIPT ROUTE POST] Payment intent not succeeded, returning 400");
          return NextResponse.json({ error: "Billing not completed" }, { status: 400 });
        }
        // Verify it matches this payment request (by public_token or payment_request_id for one-time/fee intents)
        const matchesByToken = paymentIntent.metadata?.public_token === paymentRequest.public_token;
        const matchesByRequestId = paymentIntent.metadata?.payment_request_id === paymentRequest.id;
        if (!matchesByToken && !matchesByRequestId) {
          console.log("[RECEIPT ROUTE POST] Payment intent does not match, returning 400");
          return NextResponse.json(
            { error: "Payment intent does not match payment request" },
            { status: 400 },
          );
        }
        console.log("[RECEIPT ROUTE POST] Payment intent validated successfully");
      } catch (err) {
        console.error("[RECEIPT ROUTE POST] Error fetching payment intent:", err);
        return NextResponse.json({ error: "Billing not found or not completed" }, { status: 400 });
      }
    } else {
      // For non-interval billing, check payment request status
      console.log("[RECEIPT ROUTE POST] Checking payment request status:", paymentRequest.status);
      if (paymentRequest.status !== "completed") {
        console.log("[RECEIPT ROUTE POST] Payment request not completed, returning 400");
        return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
      }
      console.log("[RECEIPT ROUTE POST] Payment request status validated");
    }

    const { name: recipientName, email: recipientEmail } = getRequestDisplayInfo(paymentRequest);
    const lineItems: InvoiceLineItem[] =
      paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
        ? paymentRequest.invoice_line_items
        : [];

    // Get payment intent details
    let amount = paymentRequest.amount;
    let fee = 0;
    let total = paymentRequest.amount;
    let paymentMethod = "card";
    let paymentIntentId: string | undefined;
    let invoiceNumber = paymentRequest.invoice_number;

    // If we have a specific paymentIntentId, use that; otherwise try to find matching payment intent
    if (paymentIntentIdParam && paymentRequest.stripe_customer_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdParam);

        if (paymentIntent.status === "succeeded") {
          amount = parseFloat(
            paymentIntent.metadata?.originalAmount || paymentRequest.amount.toString(),
          );
          fee = parseFloat(paymentIntent.metadata?.fee || "0");
          total = paymentIntent.amount / 100;
          paymentMethod = await resolvePaymentIntentRail(stripe, paymentIntent);
          paymentIntentId = paymentIntent.id;
          invoiceNumber = paymentIntent.metadata?.invoice_number
            ? parseInt(paymentIntent.metadata.invoice_number)
            : paymentRequest.invoice_number;
        }
      } catch (err) {
        console.error("Error fetching payment intent:", err);
      }
    } else if (paymentRequest.stripe_customer_id) {
      try {
        const paymentIntents = await stripe.paymentIntents.list({
          customer: paymentRequest.stripe_customer_id,
          limit: 10,
        });

        const matchingIntent =
          paymentIntents.data.find(
            (pi) =>
              pi.metadata?.public_token === paymentRequest.public_token &&
              pi.status === "succeeded",
          ) || paymentIntents.data.find((pi) => pi.status === "succeeded");

        if (matchingIntent) {
          amount = parseFloat(
            matchingIntent.metadata?.originalAmount || paymentRequest.amount.toString(),
          );
          fee = parseFloat(matchingIntent.metadata?.fee || "0");
          total = matchingIntent.amount / 100;
          paymentMethod = await resolvePaymentIntentRail(stripe, matchingIntent);
          paymentIntentId = matchingIntent.id;
          invoiceNumber = matchingIntent.metadata?.invoice_number
            ? parseInt(matchingIntent.metadata.invoice_number)
            : paymentRequest.invoice_number;
        }
      } catch (err) {
        console.error("Error fetching payment intent:", err);
      }
    }

    // Send receipt email directly instead of using fetch
    console.log("[RECEIPT ROUTE POST] Preparing to send receipt email directly...");
    console.log("[RECEIPT ROUTE POST] Generating PDF receipt...");

    const invoiceNum =
      invoiceNumber ||
      (paymentIntentId
        ? `REC-${paymentIntentId.slice(-12).toUpperCase()}`
        : `REC-${Date.now().toString().slice(-10)}`);
    const receiptDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const methodDisplay = paymentRailDisplayLabel(paymentMethod);

    const pdfBuffer = await generatePaymentReceiptPdfBuffer({
      invoiceNumber: invoiceNum,
      receiptDate,
      recipientName,
      recipientEmail,
      amount,
      fee,
      total,
      paymentMethod,
      lineItems,
    });

    console.log("[RECEIPT ROUTE POST] PDF generated, size:", pdfBuffer.length, "bytes");

    const htmlLineRows = lineItems.length
      ? lineItems
          .map(
            (row) => `
              <tr>
                <td>${row.description}</td>
                <td style="text-align:right">${row.quantity}</td>
                <td style="text-align:right">$${row.unit_amount.toFixed(2)}</td>
                <td style="text-align:right">$${(row.quantity * row.unit_amount).toFixed(2)}</td>
              </tr>`,
          )
          .join("")
      : "";

    const lineItemsHtmlBlock = lineItems.length
      ? `
          <div class="breakdown" style="margin-top:16px">
            <h3>Line items</h3>
            <table>
              <tr>
                <th>Description</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Unit</th>
                <th style="text-align:right">Amount</th>
              </tr>
              ${htmlLineRows}
            </table>
          </div>`
      : "";

    // Generate HTML email body
    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const logoFullUrl = getOperationalLogoUrl(baseUrl, "full");
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${poelLightInvoiceEmailStyles()}
          .company-info { margin: 20px 0; }
          .success-badge { background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
            <h1>Payment Receipt</h1>
            <div class="success-badge">${emailSvgCheckWhite16}<span>Payment successful</span></div>
          </div>

          <div class="company-info">
            <h2>${getPaymentCompanyName()}</h2>
            <p>Email: ${getPaymentContactEmail()}</p>
            <p>Phone: ${getPaymentContactPhone()}</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div>
              <p><strong>Bill To:</strong></p>
              <p>${recipientName}</p>
              <p>${recipientEmail}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Invoice #:</strong> ${invoiceNum}</p>
              <p><strong>Date:</strong> ${receiptDate}</p>
              <p><strong>Payment Method:</strong> ${methodDisplay}</p>
            </div>
          </div>

          <div class="breakdown">
            <h3>Payment Details</h3>
            <table>
              <tr>
                <th>Service Amount</th>
                <td>$${amount.toFixed(2)}</td>
              </tr>
              ${
                fee > 0
                  ? `
              <tr>
                <th>Processing Fee (3%)</th>
                <td>$${fee.toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
              <tr class="total">
                <th>Total Paid</th>
                <td>$${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          ${lineItemsHtmlBlock}

          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is your receipt for the payment made on ${receiptDate}.</p>
            <p>If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
${getPaymentCompanyName()} Payment Receipt

Bill To: ${recipientName}
Email: ${recipientEmail}

Invoice #: ${invoiceNum}
Date: ${receiptDate}
Payment Method: ${methodDisplay}

Payment Details:
Service Amount: $${amount.toFixed(2)}
${fee > 0 ? `Processing Fee (3%): $${fee.toFixed(2)}\n` : ""}Total Paid: $${total.toFixed(2)}

Thank you for your payment!

This is your receipt for the payment made on ${receiptDate}.

If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.
    `;

    const smtpUser = process.env.ZOHO_EMAIL || getPaymentContactEmail();
    console.log("[RECEIPT ROUTE POST] Sending email to:", recipientEmail);
    const sent = await sendTransactionalMail({
      from: `"${getPaymentCompanyName()}" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Payment Receipt - Invoice #${invoiceNum}`,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: `Receipt_${invoiceNum}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send receipt email" }, { status: 500 });
    }

    console.log("[RECEIPT ROUTE POST] Email sent successfully");
    return NextResponse.json({ success: true, invoiceNumber: invoiceNum });
  } catch (error: any) {
    console.error("[RECEIPT ROUTE POST] Error sending receipt:", error);
    console.error("[RECEIPT ROUTE POST] Error stack:", error?.stack);
    console.error("[RECEIPT ROUTE POST] Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to send receipt", details: error?.message || String(error) },
      { status: 500 },
    );
  } finally {
    console.log("[RECEIPT ROUTE POST] Handler execution complete");
  }
}
