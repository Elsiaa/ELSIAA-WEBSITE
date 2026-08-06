/**
 * Shared invoice PDF generation (pdfmake) for bills and payment requests.
 */

import type { InvoiceLineItem } from "@/lib/invoice-line-items";
import {
  getPaymentCompanyName,
  getPaymentContactEmail,
  getPaymentContactPhone,
} from "@/lib/payment-branding";
import { readOperationalLogoBase64ForPdf } from "@/lib/operational-brand";

function initializePdfMake() {
  const pdfMake = require("pdfmake/build/pdfmake");
  const pdfFonts = require("pdfmake/build/vfs_fonts");

  if (pdfFonts?.pdfMake?.vfs) pdfMake.vfs = pdfFonts.pdfMake.vfs;
  else if (pdfFonts?.vfs) pdfMake.vfs = pdfFonts.vfs;
  else if (pdfFonts) pdfMake.vfs = pdfFonts;

  return pdfMake;
}

function lineAmount(row: InvoiceLineItem): number {
  return row.quantity * row.unit_amount;
}

export interface InvoicePdfParams {
  invoiceNumber: string;
  invoiceDate: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  lineItems: InvoiceLineItem[];
  payUrl: string;
  statusLabel?: string;
}

export async function generateInvoicePdfBuffer(params: InvoicePdfParams): Promise<Buffer> {
  const pdfMake = initializePdfMake();
  const logoImage = readOperationalLogoBase64ForPdf();
  if (logoImage) {
    pdfMake.vfs = pdfMake.vfs || {};
    pdfMake.vfs["logo.png"] = logoImage;
  }

  const formatMoney = (n: number) => n.toFixed(2);
  const items = params.lineItems.length
    ? params.lineItems
    : [
        {
          description: "Service",
          quantity: 1,
          unit_amount: params.amount,
        },
      ];

  const docDefinition: Record<string, unknown> = {
    content: [
      ...(logoImage
        ? [
            {
              image: "logo.png",
              width: 150,
              alignment: "center",
              margin: [0, 0, 0, 10],
              fit: [150, 75],
            },
          ]
        : [{ text: getPaymentCompanyName(), style: "header", alignment: "center" }]),
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
              { text: params.recipientName },
              { text: params.recipientEmail },
            ],
          },
          {
            stack: [
              { text: "Invoice Details:", bold: true, alignment: "right", margin: [0, 0, 0, 5] },
              { text: `Invoice #: ${params.invoiceNumber}`, alignment: "right" },
              { text: `Date: ${params.invoiceDate}`, alignment: "right" },
              ...(params.statusLabel
                ? [{ text: `Status: ${params.statusLabel}`, alignment: "right" }]
                : []),
            ],
            alignment: "right",
          },
        ],
        margin: [0, 20, 0, 20],
      },
      {
        table: {
          headerRows: 1,
          widths: ["*", "auto", "auto", "auto"],
          body: [
            [
              { text: "Description", bold: true, fillColor: "#f9f9f9" },
              { text: "Qty", bold: true, alignment: "right", fillColor: "#f9f9f9" },
              { text: "Unit", bold: true, alignment: "right", fillColor: "#f9f9f9" },
              { text: "Amount", bold: true, alignment: "right", fillColor: "#f9f9f9" },
            ],
            ...items.map((row) => [
              row.description,
              { text: String(row.quantity), alignment: "right" },
              { text: `$${formatMoney(row.unit_amount)}`, alignment: "right" },
              { text: `$${formatMoney(lineAmount(row))}`, alignment: "right" },
            ]),
            [
              { text: "Total due", bold: true, colSpan: 3, fillColor: "#f0f0f0" },
              {},
              {},
              {
                text: `$${formatMoney(params.amount)}`,
                bold: true,
                alignment: "right",
                fillColor: "#f0f0f0",
              },
            ],
          ],
        },
        layout: "lightHorizontalLines",
        margin: [0, 0, 0, 10],
      },
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
        text: `Payment Link: ${params.payUrl}`,
        style: "link",
        alignment: "center",
        margin: [0, 20, 0, 0],
        link: params.payUrl,
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
  return new Promise<Buffer>((resolve, reject) => {
    pdfDoc.getBuffer((buffer: Buffer) => {
      try {
        resolve(Buffer.from(buffer));
      } catch (e) {
        reject(e);
      }
    });
  });
}
