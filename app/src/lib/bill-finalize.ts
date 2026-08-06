import Stripe from "stripe";
import { stripeProxy as stripe } from "@/lib/stripe-client";
import { completeBillAfterSuccessfulPayment } from "@/lib/bill-billing-engine";
import {
  getBillByToken,
  getBillChargeById,
  getOpenBillCharge,
  updateBillStripeInfo,
  type Bill,
  type BillCharge,
} from "@/lib/bills";

// stripe provided by stripeProxy import

export interface FinalizeBillPaymentResult {
  invoiceNumber: number | null;
  alreadyPaid: boolean;
  publicToken: string;
}

export async function finalizeBillCheckoutPaymentIntent(
  paymentIntentId: string,
  options: { publicToken?: string | null; sendEmails?: boolean } = {},
): Promise<FinalizeBillPaymentResult> {
  const sendEmails = options.sendEmails !== false;

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });

  if (pi.status !== "succeeded" && pi.status !== "processing") {
    throw new Error(`Payment not successful (status: ${pi.status})`);
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
    throw new Error("Payment is not linked to a bill (missing public_token metadata)");
  }

  const bill = await getBillByToken(publicToken);
  if (!bill) {
    throw new Error("Bill not found");
  }

  const chargeId = pi.metadata?.bill_charge_id;
  let charge = chargeId ? await getBillChargeById(chargeId) : await getOpenBillCharge(bill.id);

  if (!charge) {
    throw new Error("No open charge for this bill");
  }

  if (charge.status === "paid") {
    return {
      invoiceNumber: charge.invoiceNumber,
      alreadyPaid: true,
      publicToken,
    };
  }

  if (pi.customer && typeof pi.customer === "string" && pi.payment_method) {
    const pmId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method.id;
    await updateBillStripeInfo(bill.id, pi.customer as string, pmId);
  }

  const paidCharge = await completeBillAfterSuccessfulPayment(bill, charge, pi, { sendEmails });

  return { invoiceNumber: paidCharge.invoiceNumber, alreadyPaid: false, publicToken };
}

/** True when checkout is only to save a PM (auto-charge bill with no card on file). */
export function isBillCheckoutSetupOnly(bill: Bill): boolean {
  return bill.collectionMode === "auto_charge" && !bill.stripePaymentMethodId;
}

export function billToCheckoutPayload(
  bill: Bill,
  openCharge?: BillCharge | null,
  /** When there is no open charge (e.g. paid), use this for display/receipt context. */
  paidCharge?: BillCharge | null,
) {
  const displayCharge = openCharge ?? paidCharge ?? null;
  const amount = displayCharge?.amount ?? bill.amount;
  const setupOnly = isBillCheckoutSetupOnly(bill);
  const lineItems = displayCharge?.lineItemsSnapshot?.length
    ? displayCharge.lineItemsSnapshot
    : bill.lineItems;

  return {
    id: bill.id,
    amount,
    status: bill.status,
    recipient_email: bill.recipientEmail,
    recipient_name: bill.recipientName,
    /** interval_billing = setup intent only; one_time = pay the invoice amount */
    payment_type: setupOnly ? "interval_billing" : "one_time",
    invoice_line_items: lineItems,
    invoice_number: displayCharge?.invoiceNumber ?? null,
    description: bill.description,
    created_at: bill.createdAt,
    updated_at: bill.updatedAt,
    public_token: bill.publicToken,
    stripe_customer_id: bill.stripeCustomerId,
    stripe_payment_method_id: bill.stripePaymentMethodId,
    source: "bill" as const,
    collection_mode: bill.collectionMode,
    schedule_type: bill.scheduleType,
  };
}
