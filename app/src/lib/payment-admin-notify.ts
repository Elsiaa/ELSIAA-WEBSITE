import { PAYMENT_METHOD_LABEL_ACH, PAYMENT_METHOD_LABEL_CARD } from "@/lib/payment-method-labels";
import { getCurrentDateTimeInTimezone } from "@/lib/timezone";
import {
  getOperationalBrandName,
  getOperationalLogoUrl,
  getSmtpFromDisplayName,
} from "@/lib/operational-brand";
import { getPaymentAdminNotifyEmail, getPaymentTransactionalFrom } from "@/lib/payment-mail";
import { poelLightNotificationEmailStyles } from "@/lib/poel-theme";
import { sendTransactionalMail } from "@/lib/transactional-mail";

export interface SendPaymentAdminNotifyParams {
  customerName: string;
  amount: number;
  paymentMethod: string;
  publicToken?: string | null;
  invoiceNumber?: number | null;
}

/** Notify management that a payment was received. */
export async function sendPaymentAdminNotifyEmail(
  params: SendPaymentAdminNotifyParams,
): Promise<boolean> {
  const amountNum = params.amount;
  if (!Number.isFinite(amountNum)) {
    console.error("[sendPaymentAdminNotifyEmail] invalid amount");
    return false;
  }

  const baseUrl = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const brand = getOperationalBrandName();
  const logoUrl = getOperationalLogoUrl(baseUrl, "full");
  const methodLabel =
    params.paymentMethod === "card"
      ? PAYMENT_METHOD_LABEL_CARD
      : params.paymentMethod === "ach"
        ? PAYMENT_METHOD_LABEL_ACH
        : params.paymentMethod;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${poelLightNotificationEmailStyles()}
    .amount-box { margin: 20px 0; padding: 20px; background: #f5f6f8; border: 1px solid #b8c8d8; border-left: 4px solid #1e6b3c; border-radius: 8px; text-align: center; }
    .amount-value { font-size: 32px; font-weight: bold; color: #1c2d3f; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="${brand} Logo" />
      <h1>New Payment Received</h1>
    </div>
    <div class="content">
      <p>A new payment has been processed on the ${brand} website.</p>
      <div class="info-row">
        <div class="info-label">Customer Name:</div>
        <div class="info-value">${params.customerName}</div>
      </div>
      ${
        params.publicToken
          ? `
      <div class="info-row">
        <div class="info-label">Invoice link:</div>
        <div class="info-value">Bill / payment (token …${String(params.publicToken).slice(-8)})</div>
      </div>`
          : ""
      }
      ${
        params.invoiceNumber != null
          ? `
      <div class="info-row">
        <div class="info-label">Invoice #:</div>
        <div class="info-value">${params.invoiceNumber}</div>
      </div>`
          : ""
      }
      <div class="amount-box">
        <div class="info-label" style="margin-bottom: 10px;">Amount Paid:</div>
        <div class="amount-value">$${amountNum.toFixed(2)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Payment Method:</div>
        <div class="info-value">${methodLabel}</div>
      </div>
      <div class="footer">
        <p>Payment processed at ${getCurrentDateTimeInTimezone()}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textBody = `
New Payment Received - ${brand}

Customer: ${params.customerName}
${params.publicToken ? `Token: …${String(params.publicToken).slice(-8)}\n` : ""}${params.invoiceNumber != null ? `Invoice #: ${params.invoiceNumber}\n` : ""}Amount: $${amountNum.toFixed(2)}
Method: ${methodLabel}

${getCurrentDateTimeInTimezone()}
  `.trim();

  return sendTransactionalMail({
    from: getPaymentTransactionalFrom(),
    to: getPaymentAdminNotifyEmail(),
    subject: `New Payment Received: $${amountNum.toFixed(2)} from ${params.customerName}`,
    html: htmlBody,
    text: textBody,
  });
}
