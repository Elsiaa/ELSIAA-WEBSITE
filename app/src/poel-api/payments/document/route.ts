import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { resolveCheckoutByToken } from "@/lib/bill-checkout";
import { getLatestPaidBillCharge, getBillDisplayInfo } from "@/lib/bills";
import { getRequestDisplayInfo } from "@/lib/payments";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { generatePaymentReceiptPdfBuffer } from "@/lib/payment-receipt-pdf";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import { resolvePaymentIntentRail } from "@/lib/stripe-payment-rail";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function formatLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatReceiptDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "pending":
    case "draft":
    case "active":
      return "Pending";
    case "invoiced":
      return "Invoiced";
    case "completed":
      return "Paid";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

/**
 * Public invoice / receipt PDF download by checkout token.
 * GET /api/payments/document?token=...&kind=invoice|receipt
 * kind defaults to receipt when paid, otherwise invoice.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const checkout = await resolveCheckoutByToken(token);
    if (!checkout) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    const paid = checkout.completed || checkout.status === "completed";
    const requestedKind = searchParams.get("kind");
    let kind: "invoice" | "receipt" =
      requestedKind === "receipt" || requestedKind === "invoice"
        ? requestedKind
        : paid
          ? "receipt"
          : "invoice";

    if (kind === "receipt" && !paid) {
      return NextResponse.json({ error: "Payment is not completed yet" }, { status: 400 });
    }

    const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const payUrl = `${publicBase}/payments?token=${encodeURIComponent(token)}`;

    if (checkout.source === "bill" && checkout.bill) {
      const bill = checkout.bill;
      const { name: recipientName, email: recipientEmail } = getBillDisplayInfo(bill);

      if (kind === "invoice") {
        const charge = checkout.billCharge;
        const lineItems: InvoiceLineItem[] = charge?.lineItemsSnapshot?.length
          ? charge.lineItemsSnapshot
          : bill.lineItems;
        const amount = charge?.amount ?? bill.amount;
        const invoiceNumber =
          charge?.invoiceNumber?.toString() ?? `INV-${bill.id.slice(0, 8).toUpperCase()}`;
        const invoiceDate = formatLongDate(charge?.createdAt || bill.createdAt);

        const pdfBuffer = await generateInvoicePdfBuffer({
          invoiceNumber,
          invoiceDate,
          recipientName,
          recipientEmail,
          amount,
          lineItems,
          payUrl,
          statusLabel: invoiceStatusLabel(charge?.status || bill.status),
        });
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="Invoice_${invoiceNumber}.pdf"`,
          },
        });
      }

      const paidCharge = await getLatestPaidBillCharge(bill.id);
      if (!paidCharge) {
        return NextResponse.json({ error: "Receipt not available" }, { status: 404 });
      }
      const invoiceNumber =
        paidCharge.invoiceNumber?.toString() ?? paidCharge.id.slice(0, 8).toUpperCase();
      const invoiceDate = paidCharge.paidAt
        ? formatLongDate(paidCharge.paidAt)
        : formatLongDate(paidCharge.updatedAt);

      const pdfBuffer = await generateInvoicePdfBuffer({
        invoiceNumber,
        invoiceDate,
        recipientName,
        recipientEmail,
        amount: paidCharge.amount,
        lineItems: paidCharge.lineItemsSnapshot,
        payUrl: `${publicBase}/payments?token=${encodeURIComponent(token)}`,
        statusLabel: "Paid",
      });
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Receipt_${invoiceNumber}.pdf"`,
        },
      });
    }

    const paymentRequest = checkout.paymentRequest;
    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    const { name: recipientName, email: recipientEmail } = getRequestDisplayInfo(paymentRequest);
    const lineItems: InvoiceLineItem[] =
      paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
        ? paymentRequest.invoice_line_items
        : [];

    if (kind === "invoice") {
      const invoiceNumber =
        paymentRequest.invoice_number?.toString() ??
        `INV-${paymentRequest.id.slice(0, 8).toUpperCase()}`;
      const invoiceDate = formatLongDate(paymentRequest.updated_at || paymentRequest.created_at);

      const pdfBuffer = await generateInvoicePdfBuffer({
        invoiceNumber,
        invoiceDate,
        recipientName,
        recipientEmail,
        amount: paymentRequest.amount,
        lineItems,
        payUrl,
        statusLabel: invoiceStatusLabel(paymentRequest.status),
      });
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Invoice_${invoiceNumber}.pdf"`,
        },
      });
    }

    // Receipt for legacy payment request
    let receiptDetails = {
      invoiceNumber: paymentRequest.invoice_number as string | number | null,
      amount: paymentRequest.amount,
      fee: 0,
      total: paymentRequest.amount,
      paymentMethod: "unknown",
      date: paymentRequest.updated_at || paymentRequest.created_at,
    };

    if (paymentRequest.stripe_customer_id) {
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

        if (matchingIntent?.status === "succeeded") {
          const originalAmount = parseFloat(matchingIntent.metadata?.originalAmount || "0");
          const fee = parseFloat(matchingIntent.metadata?.fee || "0");
          const total = matchingIntent.amount / 100;
          const method = await resolvePaymentIntentRail(stripe, matchingIntent);
          receiptDetails = {
            invoiceNumber: matchingIntent.metadata?.invoice_number
              ? parseInt(matchingIntent.metadata.invoice_number, 10)
              : (paymentRequest.invoice_number ?? null),
            amount: originalAmount || paymentRequest.amount,
            fee,
            total,
            paymentMethod: method,
            date: new Date(matchingIntent.created * 1000).toISOString(),
          };
        }
      } catch (err) {
        console.error("[payments document] Stripe receipt lookup failed", err);
      }
    }

    const invoiceNum =
      receiptDetails.invoiceNumber ?? `REC-${paymentRequest.id.slice(0, 8).toUpperCase()}`;
    const pdfBuffer = await generatePaymentReceiptPdfBuffer({
      invoiceNumber: invoiceNum,
      receiptDate: formatReceiptDate(receiptDetails.date),
      recipientName,
      recipientEmail,
      amount: Number(receiptDetails.amount) || 0,
      fee: Number(receiptDetails.fee) || 0,
      total: Number(receiptDetails.total) || Number(receiptDetails.amount) || 0,
      paymentMethod: receiptDetails.paymentMethod,
      lineItems,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Receipt_${invoiceNum}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[payments document] GET", error);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
