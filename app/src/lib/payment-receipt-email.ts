import { getPaymentRequestByToken, getRequestDisplayInfo } from '@/lib/payments';
import { getPaymentCompanyName, getPaymentContactEmail, getPaymentContactPhone } from '@/lib/payment-branding';
import { getPaymentOperationsBcc, getPaymentTransactionalFrom } from '@/lib/payment-mail';
import { getOperationalLogoUrl } from '@/lib/operational-brand';
import { poelLightInvoiceEmailStyles, poelPaidReceiptEmailStyles } from '@/lib/poel-theme';
import { sendTransactionalMail } from '@/lib/transactional-mail';
import { emailSvgCheckWhite16 } from '@/lib/transactional-visuals';
import { paymentRailDisplayLabel } from '@/lib/payment-method-labels';

export interface SendPaymentReceiptEmailParams {
  publicToken?: string | null;
  paymentIntentId?: string | null;
  amount: number;
  fee?: number;
  total: number;
  paymentMethod: string;
  recipientEmail: string;
  recipientName: string;
  invoiceNumber?: number | null;
  chargeName?: string | null;
}

/** Send paid receipt to customer (bills and legacy payment requests). */
export async function sendPaymentReceiptEmail(
  params: SendPaymentReceiptEmailParams
): Promise<boolean> {
  const displayChargeName =
    params.chargeName && String(params.chargeName).trim() ? String(params.chargeName).trim() : 'Payment';

  if (!params.recipientEmail?.trim()) {
    console.error('[sendPaymentReceiptEmail] missing recipientEmail');
    return false;
  }

  let displayName = params.recipientName;
  let displayEmail = params.recipientEmail.trim();

  if (params.publicToken) {
    try {
      const paymentRequest = await getPaymentRequestByToken(params.publicToken);
      if (paymentRequest) {
        const info = getRequestDisplayInfo(paymentRequest);
        displayName = info.name;
        displayEmail = info.email || displayEmail;
      }
    } catch (err) {
      console.error('[sendPaymentReceiptEmail] token lookup', err);
    }
  }

  const fee = params.fee ?? 0;
  const paymentIntentId = params.paymentIntentId ?? '';
  const invoiceNum =
    params.invoiceNumber ??
    (paymentIntentId ? `REC-${paymentIntentId.slice(-12).toUpperCase()}` : `REC-${Date.now().toString().slice(-10)}`);
  const receiptDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const methodDisplay = paymentRailDisplayLabel(params.paymentMethod);
  const publicBase = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
  const logoFullUrl = getOperationalLogoUrl(publicBase, 'full');

  const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          ${poelLightInvoiceEmailStyles()}
          ${poelPaidReceiptEmailStyles()}
          .company-info { margin: 20px 0; }
          .success-badge { background: #22c55e; color: white; padding: 8px 16px; border-radius: 20px; display: inline-flex; align-items: center; gap: 8px; margin: 10px 0; font-weight: 700; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="receipt-paid-banner">
            <p class="receipt-paid-banner-title">Payment received — paid in full</p>
            <p class="receipt-paid-banner-sub">This email is your official receipt. It is not a bill and no further payment is due for this charge.</p>
          </div>
          <div class="receipt-watermark" aria-hidden="true">PAID</div>

          <div class="header">
            <img src="${logoFullUrl}" alt="${getPaymentCompanyName()} Logo" />
            <h1 style="margin-bottom:8px;">Receipt for your payment</h1>
            <div class="success-badge">${emailSvgCheckWhite16}<span>Payment successful</span></div>
          </div>

          <p class="receipt-lead">
            <strong>Your payment has been received and processed.</strong>
            Keep this email for your records. The amount below reflects what was charged${fee > 0 ? ', including any card processing fee' : ''}.
          </p>

          <div class="company-info">
            <h2 style="margin-bottom:8px;">${getPaymentCompanyName()}</h2>
            <p style="margin:4px 0;">Email: ${getPaymentContactEmail()}</p>
            <p style="margin:4px 0;">Phone: ${getPaymentContactPhone()}</p>
          </div>

          <div style="display: flex; justify-content: space-between; margin: 20px 0; flex-wrap: wrap; gap: 16px;">
            <div>
              <p class="receipt-meta-label">Paid by</p>
              <p style="margin:4px 0 0 0;"><strong>${displayName}</strong></p>
              <p style="margin:4px 0 0 0;">${displayEmail}</p>
            </div>
            <div style="text-align: right;">
              <p><strong>Receipt #:</strong> ${invoiceNum}</p>
              <p class="receipt-ref-note">Use this number if you contact us about this payment.</p>
              <p><strong>Payment date:</strong> ${receiptDate}</p>
              <p><strong>Payment method:</strong> ${methodDisplay}</p>
              <p><strong>Stripe payment ID:</strong> ${paymentIntentId || '—'}</p>
            </div>
          </div>

          <div class="breakdown">
            <h3>Amount paid — ${displayChargeName}</h3>
            <table>
              <tr>
                <th>Service / subtotal</th>
                <td>$${params.amount.toFixed(2)}</td>
              </tr>
              ${
                fee > 0
                  ? `<tr><th>Processing fee (3%)</th><td>$${fee.toFixed(2)}</td></tr>`
                  : ''
              }
              <tr class="total">
                <th>Total paid</th>
                <td>$${params.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="footer">
            <p><strong>Thank you.</strong> This message confirms payment only — not a request for payment.</p>
            <p>This charge may appear as ELSIAA on your card or bank statement.</p>
            <p>Questions? ${getPaymentContactEmail()} · ${getPaymentContactPhone()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

  const textBody = `
${getPaymentCompanyName()} — PAYMENT RECEIVED (RECEIPT)

Paid by: ${displayName} (${displayEmail})
Charge: ${displayChargeName}
Receipt #: ${invoiceNum}
Total paid: $${params.total.toFixed(2)}
  `.trim();

  return sendTransactionalMail({
    from: getPaymentTransactionalFrom(),
    to: displayEmail,
    bcc: getPaymentOperationsBcc(),
    subject: `Receipt — Paid in full · ${displayChargeName} (#${invoiceNum})`,
    html: htmlBody,
    text: textBody,
  });
}
