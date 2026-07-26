/**
 * Payment receipt PDF (legacy payments_requests) with optional line-item breakdown.
 */

import type { InvoiceLineItem } from '@/lib/invoice-line-items';
import { getPaymentCompanyName, getPaymentContactEmail, getPaymentContactPhone } from '@/lib/payment-branding';
import { readOperationalLogoBase64ForPdf } from '@/lib/operational-brand';
import { pdfMakePaymentSuccessRow } from '@/lib/transactional-visuals';
import { paymentRailDisplayLabel } from '@/lib/payment-method-labels';

function initializePdfMake() {
  const pdfMake = require('pdfmake/build/pdfmake');
  const pdfFonts = require('pdfmake/build/vfs_fonts');

  if (pdfFonts?.pdfMake?.vfs) pdfMake.vfs = pdfFonts.pdfMake.vfs;
  else if (pdfFonts?.vfs) pdfMake.vfs = pdfFonts.vfs;
  else if (pdfFonts) pdfMake.vfs = pdfFonts;

  return pdfMake;
}

function lineAmount(row: InvoiceLineItem): number {
  return row.quantity * row.unit_amount;
}

export interface PaymentReceiptPdfParams {
  invoiceNumber: string | number;
  receiptDate: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  fee?: number;
  total: number;
  paymentMethod: string;
  lineItems?: InvoiceLineItem[] | null;
}

export async function generatePaymentReceiptPdfBuffer(params: PaymentReceiptPdfParams): Promise<Buffer> {
  const pdfMake = initializePdfMake();
  const logoImage = readOperationalLogoBase64ForPdf();
  if (logoImage) {
    pdfMake.vfs = pdfMake.vfs || {};
    pdfMake.vfs['logo.png'] = logoImage;
  }

  const formatMoney = (n: number) => n.toFixed(2);
  const fee = params.fee ?? 0;
  const methodDisplay = paymentRailDisplayLabel(params.paymentMethod);
  const items =
    params.lineItems && params.lineItems.length > 0
      ? params.lineItems
      : [{ description: 'Service', quantity: 1, unit_amount: params.amount }];

  const lineItemsTable = {
    table: {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: [
        [
          { text: 'Description', bold: true, fillColor: '#f9f9f9' },
          { text: 'Qty', bold: true, alignment: 'right', fillColor: '#f9f9f9' },
          { text: 'Unit', bold: true, alignment: 'right', fillColor: '#f9f9f9' },
          { text: 'Amount', bold: true, alignment: 'right', fillColor: '#f9f9f9' },
        ],
        ...items.map((row) => [
          row.description,
          { text: String(row.quantity), alignment: 'right' },
          { text: `$${formatMoney(row.unit_amount)}`, alignment: 'right' },
          { text: `$${formatMoney(lineAmount(row))}`, alignment: 'right' },
        ]),
      ],
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 10] as [number, number, number, number],
  };

  const totalsTable = {
    table: {
      widths: ['*', 'auto'],
      body: [
        [
          { text: 'Service Amount', style: 'tableHeader' },
          { text: `$${formatMoney(params.amount)}`, style: 'tableCell', alignment: 'right' },
        ],
        ...(fee > 0
          ? [
              [
                { text: 'Processing Fee (3%)', style: 'tableHeader' },
                { text: `$${formatMoney(fee)}`, style: 'tableCell', alignment: 'right' },
              ],
            ]
          : []),
        [
          { text: 'Total Paid', style: 'tableTotal' },
          { text: `$${formatMoney(params.total)}`, style: 'tableTotal', alignment: 'right' },
        ],
      ],
    },
    layout: {
      hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 1 : 0,
      vLineWidth: () => 0,
      paddingLeft: () => 10,
      paddingRight: () => 10,
      paddingTop: () => 10,
      paddingBottom: () => 10,
    },
    margin: [0, 0, 0, 30] as [number, number, number, number],
  };

  const pdfDocDefinition: Record<string, unknown> = {
    content: [
      ...(logoImage
        ? [
            {
              image: 'logo.png',
              width: 150,
              alignment: 'center',
              margin: [0, 0, 0, 20],
              fit: [150, 75],
            },
          ]
        : [
            {
              text: getPaymentCompanyName().toUpperCase(),
              style: 'header',
              alignment: 'center',
              margin: [0, 0, 0, 20],
            },
          ]),
      { text: 'PAYMENT RECEIPT', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 30] },
      pdfMakePaymentSuccessRow('successBadge'),
      {
        columns: [
          {
            text: [
              { text: `${getPaymentCompanyName()}\n`, bold: true },
              { text: `Email: ${getPaymentContactEmail()}\n` },
              { text: `Phone: ${getPaymentContactPhone()}` },
            ],
            width: '*',
          },
          {
            text: [
              { text: `Invoice #: ${params.invoiceNumber}\n`, bold: true },
              { text: `Date: ${params.receiptDate}\n` },
              { text: `Payment Method: ${methodDisplay}` },
            ],
            alignment: 'right',
            width: '*',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: 'Bill To:', style: 'label', margin: [0, 20, 0, 5] },
      {
        text: [{ text: `${params.recipientName}\n`, bold: true }, { text: params.recipientEmail }],
        margin: [0, 0, 0, 20],
      },
      lineItemsTable,
      totalsTable,
      { text: 'Thank you for your payment!', alignment: 'center', margin: [0, 20, 0, 10] },
      {
        text: `This is your receipt for the payment made on ${params.receiptDate}.`,
        alignment: 'center',
        fontSize: 9,
        color: '#666666',
        margin: [0, 0, 0, 10],
      },
      {
        text: `If you have any questions, please contact us at ${getPaymentContactEmail()} or ${getPaymentContactPhone()}.`,
        alignment: 'center',
        fontSize: 9,
        color: '#666666',
      },
    ],
    styles: {
      header: { fontSize: 24, bold: true, color: '#1e6b3c' },
      subheader: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      successBadge: { fontSize: 12, bold: true, color: '#4CAF50' },
      label: { fontSize: 12, bold: true },
      tableHeader: { fontSize: 11, bold: true, color: '#333333' },
      tableCell: { fontSize: 11, color: '#333333' },
      tableTotal: { fontSize: 12, bold: true, color: '#333333' },
    },
    pageMargins: [40, 60, 40, 60],
  };

  const pdfDoc = pdfMake.createPdf(pdfDocDefinition);
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
