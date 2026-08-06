import type Stripe from "stripe";

/**
 * Card vs ACH rail for a PaymentIntent using expanded payment_method when present,
 * else payment_method_types and metadata (matches Stripe-backed receipts).
 */
export function paymentIntentRail(pi: Stripe.PaymentIntent): "ach" | "card" {
  const pm = pi.payment_method;
  if (pm && typeof pm === "object" && "type" in pm) {
    const t = (pm as Stripe.PaymentMethod).type;
    return t === "us_bank_account" ? "ach" : "card";
  }
  const types = pi.payment_method_types || [];
  if (types.length > 0 && types.every((x) => x === "us_bank_account")) {
    return "ach";
  }
  if (pi.metadata?.method === "ach") return "ach";
  return "card";
}

/** Resolves rail when payment_method may be an ID string (loads PM from Stripe). */
export async function resolvePaymentIntentRail(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent,
): Promise<"ach" | "card"> {
  const pmId = paymentIntent.payment_method;
  if (pmId && typeof pmId === "string") {
    try {
      const pm = await stripe.paymentMethods.retrieve(pmId);
      return pm.type === "us_bank_account" ? "ach" : "card";
    } catch {
      return paymentIntentRail(paymentIntent);
    }
  }
  return paymentIntentRail(paymentIntent);
}
