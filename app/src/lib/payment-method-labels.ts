/**
 * User-visible copy for payment rails. Backend / Stripe still use `ach` and `us_bank_account`.
 */
export const PAYMENT_METHOD_LABEL_ACH = "Direct deposit (ACH)";

export const PAYMENT_METHOD_LABEL_CARD = "Credit/Debit Card";

/** For midsentence copy (fee notes, helper text). */
export const PAYMENT_METHOD_PHRASE_ACH = "direct deposit (ACH)";

/** Success screen when ACH / US bank debit is processing. */
export const PAYMENT_METHOD_ACH_PENDING_MESSAGE =
  "Your direct deposit (ACH) payment has been initiated and will be processed within 2-3 business days.";

export function paymentRailDisplayLabel(rail: string | undefined | null): string {
  if (rail === "ach") return PAYMENT_METHOD_LABEL_ACH;
  if (rail === "card") return PAYMENT_METHOD_LABEL_CARD;
  const s = rail?.trim();
  return s || "Payment";
}
