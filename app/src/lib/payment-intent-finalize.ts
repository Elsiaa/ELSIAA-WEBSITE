import Stripe from "stripe";
import { stripeProxy as stripe } from "@/lib/stripe-client";
import {
  getPaymentRequestByToken,
  getRequestDisplayInfo,
  updatePaymentRequestStatus,
} from "@/lib/payments";
import { resolvePaymentIntentRail } from "@/lib/stripe-payment-rail";
import { sendPaymentReceiptEmail } from "@/lib/payment-receipt-email";
import { sendPaymentAdminNotifyEmail } from "@/lib/payment-admin-notify";

// stripe provided by stripeProxy import

export interface FinalizePaymentIntentResult {
  invoiceNumber: number | null;
  alreadyCompleted: boolean;
  publicToken: string | null;
}

/**
 * Single pipeline for invoice-link payments after Stripe confirms the charge:
 * 1) Verify the PaymentIntent (succeeded or processing for ACH)
 * 2) Mark `payments_requests` as completed (this always runs before email)
 * 3) Email receipt + admin notify (same ELSIAA mail path as invoices; BCC payments@elsiaa.com)
 *
 * There is no separate “send receipt” path for these payments without going through here first,
 * so “customer got the receipt email” and “row marked completed” are the same successful run.
 * Idempotent: if already completed, skips DB update and duplicate emails.
 */
export async function finalizeCheckoutPaymentIntent(
  paymentIntentId: string,
  options: { publicToken?: string | null; sendEmails?: boolean } = {},
): Promise<FinalizePaymentIntentResult> {
  const sendEmails = options.sendEmails !== false;

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });

  if (pi.status !== "succeeded" && pi.status !== "processing") {
    throw new Error(`Payment not successful (status: ${pi.status})`);
  }

  if (pi.metadata?.billing_source === "bill" || pi.metadata?.bill_id) {
    const { finalizeBillCheckoutPaymentIntent } = await import("@/lib/bill-finalize");
    const billResult = await finalizeBillCheckoutPaymentIntent(paymentIntentId, {
      publicToken: options.publicToken,
      sendEmails,
    });
    return {
      invoiceNumber: billResult.invoiceNumber,
      alreadyCompleted: billResult.alreadyPaid,
      publicToken: billResult.publicToken,
    };
  }

  let publicToken = String(pi.metadata?.public_token || "").trim();
  const override = options.publicToken?.trim();
  if (override) {
    if (publicToken && publicToken !== override) {
      throw new Error("Payment intent does not match this invoice link");
    }
    publicToken = override;
  }

  if (!publicToken) {
    throw new Error("Payment is not linked to an invoice (missing public_token metadata)");
  }

  let pr = await getPaymentRequestByToken(publicToken);
  if (!pr) {
    const { getBillByToken } = await import("@/lib/bills");
    const bill = await getBillByToken(publicToken);
    if (bill) {
      const { finalizeBillCheckoutPaymentIntent } = await import("@/lib/bill-finalize");
      const billResult = await finalizeBillCheckoutPaymentIntent(paymentIntentId, {
        publicToken,
        sendEmails,
      });
      return {
        invoiceNumber: billResult.invoiceNumber,
        alreadyCompleted: billResult.alreadyPaid,
        publicToken: billResult.publicToken,
      };
    }
    throw new Error("Payment request not found");
  }

  if (pr.status === "completed") {
    return {
      invoiceNumber: pr.invoice_number ?? null,
      alreadyCompleted: true,
      publicToken,
    };
  }

  const invoiceNumber = await updatePaymentRequestStatus(publicToken, "completed", paymentIntentId);

  if (!sendEmails) {
    return { invoiceNumber, alreadyCompleted: false, publicToken };
  }

  const info = getRequestDisplayInfo(pr);
  const total = pi.amount / 100;
  let originalAmount = parseFloat(pi.metadata?.originalAmount || "0");
  let fee = parseFloat(pi.metadata?.fee || "0");
  if (originalAmount === 0 && fee === 0 && total > 0) {
    originalAmount = Math.round((total / 1.03) * 100) / 100;
    fee = Math.round((total - originalAmount) * 100) / 100;
  }

  const rail = await resolvePaymentIntentRail(stripe, pi);

  if (info.email) {
    const receiptSent = await sendPaymentReceiptEmail({
      publicToken,
      paymentIntentId,
      amount: originalAmount,
      fee: fee > 0 ? fee : 0,
      total,
      paymentMethod: rail,
      recipientEmail: info.email,
      recipientName: info.name,
      invoiceNumber: invoiceNumber ?? undefined,
    });
    if (!receiptSent) {
      console.error("[finalizeCheckoutPaymentIntent] customer receipt email failed");
    }
  }

  const notifySent = await sendPaymentAdminNotifyEmail({
    customerName: info.name,
    amount: total,
    paymentMethod: rail,
    publicToken,
    invoiceNumber: invoiceNumber ?? pr.invoice_number,
  });
  if (!notifySent) {
    console.error("[finalizeCheckoutPaymentIntent] management notify email failed");
  }

  return { invoiceNumber, alreadyCompleted: false, publicToken };
}
