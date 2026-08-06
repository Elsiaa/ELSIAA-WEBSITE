import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/permissions";
import {
  getPaymentRequestById,
  updatePaymentRequestStatus,
  getRequestDisplayInfo,
} from "@/lib/payments";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import {
  getPaymentCompanyName,
  getPaymentContactEmail,
  getPaymentContactPhone,
} from "@/lib/payment-branding";
import { readOperationalLogoBase64ForPdf, getOperationalLogoUrl } from "@/lib/operational-brand";
import { poelLightInvoiceEmailStyles } from "@/lib/poel-theme";
import { sendTransactionalMail } from "@/lib/transactional-mail";

function initializePdfMake() {
  try {
    const pdfMake = require("pdfmake/build/pdfmake");
    const pdfFonts = require("pdfmake/build/vfs_fonts");

    if (pdfFonts?.pdfMake?.vfs) {
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts?.vfs) {
      pdfMake.vfs = pdfFonts.vfs;
    } else if (pdfFonts) {
      pdfMake.vfs = pdfFonts;
    }

    return pdfMake;
  } catch (error) {
    console.error("Error loading pdfMake fonts:", error);
    throw new Error("Failed to initialize PDF library");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && !(dbUser && dbUser.role === "admin")) {
      return NextResponse.json({ error: "Only admins can send invoices" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Payment request ID is required" }, { status: 400 });
    }

    // Get payment request
    const paymentRequest = await getPaymentRequestById(id);
    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    const { name: recipientName, email: recipientEmail } = getRequestDisplayInfo(paymentRequest);
    const amount = paymentRequest.amount;
    const lineItems: InvoiceLineItem[] | null =
      paymentRequest.invoice_line_items && paymentRequest.invoice_line_items.length > 0
        ? paymentRequest.invoice_line_items
        : null;

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email not found" }, { status: 400 });
    }

    const invoiceNumber = `INV-${paymentRequest.id.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const publicBase = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const logoFullUrl = getOperationalLogoUrl(publicBase, "full");

    const formatMoney = (n: number) => n.toFixed(2);
    const lineAmount = (row: InvoiceLineItem) => row.quantity * row.unit_amount;
    const escapeHtml = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const htmlLineRows =
      lineItems
        ?.map(
          (row) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(row.description)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${row.quantity}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(row.unit_amount)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(lineAmount(row))}</td>
              </tr>`,
        )
        .join("") ||
      `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #eee;">Service</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">1</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(amount)}</td>
                <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${formatMoney(amount)}</td>
              </tr>`;

    const textLineBlock = lineItems
      ? lineItems
          .map(
            (row) =>
              `  ${row.description}  x${row.quantity} @ $${formatMoney(row.unit_amount)} = $${formatMoney(lineAmount(row))}`,
          )
          .join("\n")
      : `  Service amount: $${formatMoney(amount)}`;

    // Generate HTML email body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${poelLightInvoiceEmailStyles()}
          .pay-button { padding: 20px 40px; font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
            <h1>Invoice</h1>
          </div>

          <div style="display: flex; justify-content: space-between; margin: 20px 0;">
            <div>
              <p><strong>Bill To:</strong></p>
              <p>${recipientName}</p>
              <p>${recipientEmail}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoiceDate}</p>
            </div>
          </div>

          <div class="breakdown">
            <h3>Invoice details</h3>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th align="left" style="padding:8px;border-bottom:1px solid #ddd;">Description</th>
                  <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Qty</th>
                  <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Unit</th>
                  <th align="right" style="padding:8px;border-bottom:1px solid #ddd;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${htmlLineRows}
              </tbody>
              <tr class="total">
                <th colspan="3" align="right" style="padding:8px;">Total due</th>
                <td style="padding:8px;text-align:right;"><strong>$${amount.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          <div class="button-container">
            <a href="${publicBase}/payments?public_token=${paymentRequest.public_token}" class="pay-button">Pay Now - $${amount.toFixed(2)}</a>
          </div>

          <div class="footer">
            <p>If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textBody = `
${getPaymentCompanyName()} Invoice

Bill To: ${recipientName}
Email: ${recipientEmail}

Invoice #: ${invoiceNumber}
Date: ${invoiceDate}

Invoice lines:
${textLineBlock}

Total due: $${amount.toFixed(2)}

PAY NOW: ${publicBase}/payments?public_token=${paymentRequest.public_token}

If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.
    `;

    const logoImage = readOperationalLogoBase64ForPdf();

    const pdfMake = initializePdfMake();

    // Add logo to vfs if available
    if (logoImage) {
      pdfMake.vfs = pdfMake.vfs || {};
      pdfMake.vfs["logo.png"] = logoImage;
      console.log("[SEND INVOICE] Logo added to pdfmake vfs");
    }

    // Generate PDF using pdfmake
    const docDefinition: any = {
      content: [
        // Header with Logo
        ...(logoImage
          ? [
              {
                image: "logo.png", // Reference from vfs
                width: 150,
                alignment: "center",
                margin: [0, 0, 0, 10],
                fit: [150, 75], // Maintain aspect ratio
              },
            ]
          : [
              {
                text: getPaymentCompanyName(),
                style: "header",
                alignment: "center",
              },
            ]),
        {
          text: `${getPaymentContactEmail()} | ${getPaymentContactPhone()}`,
          style: "subheader",
          alignment: "center",
        },
        { text: "INVOICE", style: "title", alignment: "center", margin: [0, 20, 0, 20] },
        {
          columns: [
            {
              stack: [
                { text: "Bill To:", bold: true, margin: [0, 0, 0, 5] },
                { text: recipientName },
                { text: recipientEmail },
              ],
            },
            {
              stack: [
                { text: "Invoice Details:", bold: true, alignment: "right", margin: [0, 0, 0, 5] },
                { text: `Invoice #: ${invoiceNumber}`, alignment: "right" },
                { text: `Date: ${invoiceDate}`, alignment: "right" },
                { text: `Status: ${paymentRequest.status}`, alignment: "right" },
              ],
              alignment: "right",
            },
          ],
          margin: [0, 20, 0, 20],
        },
        (() => {
          const headerRow = [
            { text: "Description", bold: true, fillColor: "#f9f9f9" },
            { text: "Qty", bold: true, alignment: "right", fillColor: "#f9f9f9" },
            { text: "Unit", bold: true, alignment: "right", fillColor: "#f9f9f9" },
            { text: "Amount", bold: true, alignment: "right", fillColor: "#f9f9f9" },
          ];
          const dataRows = lineItems
            ? lineItems.map((row) => [
                row.description,
                { text: String(row.quantity), alignment: "right" },
                { text: `$${formatMoney(row.unit_amount)}`, alignment: "right" },
                { text: `$${formatMoney(lineAmount(row))}`, alignment: "right" },
              ])
            : [
                [
                  "Service",
                  { text: "1", alignment: "right" },
                  { text: `$${formatMoney(amount)}`, alignment: "right" },
                  { text: `$${formatMoney(amount)}`, alignment: "right" },
                ],
              ];
          const totalRow = [
            { text: "Total due", bold: true, colSpan: 3, fillColor: "#f0f0f0" },
            {},
            {},
            {
              text: `$${formatMoney(amount)}`,
              bold: true,
              alignment: "right",
              fillColor: "#f0f0f0",
            },
          ];
          return {
            table: {
              headerRows: 1,
              widths: ["*", "auto", "auto", "auto"],
              body: [headerRow, ...dataRows, totalRow],
            },
            layout: "lightHorizontalLines",
            margin: [0, 0, 0, 10],
          };
        })(),
        {
          text: [
            "Please complete your payment to settle this invoice.",
            `\nIf you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.`,
          ],
          style: "footer",
          alignment: "center",
          margin: [0, 40, 0, 0],
        },
        {
          text: `Payment Link: ${publicBase}/payments?public_token=${paymentRequest.public_token}`,
          style: "link",
          alignment: "center",
          margin: [0, 20, 0, 0],
          link: `${publicBase}/payments?public_token=${paymentRequest.public_token}`,
        },
      ],
      styles: {
        header: { fontSize: 24, bold: true, color: "#1e6b3c", margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, color: "#666" },
        title: { fontSize: 18, bold: true },
        footer: { fontSize: 10, color: "#666", italics: true },
        link: { fontSize: 10, color: "#1e6b3c", decoration: "underline" },
      },
      defaultStyle: { fontSize: 12 },
    };

    const pdfDoc = pdfMake.createPdf(docDefinition);
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(Buffer.from(buffer));
      });
    });

    const smtpUser = process.env.ZOHO_EMAIL || getPaymentContactEmail();
    const sent = await sendTransactionalMail({
      from: `"${getPaymentCompanyName()}" <${smtpUser}>`,
      to: recipientEmail,
      subject: `Invoice for Your Payment - ${invoiceNumber} (PDF Attached)`,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    if (!sent) {
      return NextResponse.json({ error: "Failed to send invoice email" }, { status: 500 });
    }

    // Update status to 'invoiced' if it's still pending
    if (paymentRequest.status === "pending") {
      try {
        await updatePaymentRequestStatus(paymentRequest.public_token, "invoiced");
      } catch (updateError) {
        console.error("Failed to update payment request status:", updateError);
        // Don't fail the whole operation, just log
      }
    }

    return NextResponse.json({ success: true, invoiceNumber });
  } catch (error) {
    console.error("Error sending invoice:", error);
    return NextResponse.json(
      {
        error: "Failed to send invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
