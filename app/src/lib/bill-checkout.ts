/**
 * Public checkout adapter — resolve legacy payment request vs new bill by token.
 */

import { getPaymentRequestByToken, type PaymentRequest } from "@/lib/payments";
import { getBillByToken, getOpenBillCharge, type Bill, type BillCharge } from "@/lib/bills";

export type CheckoutSource = "payment_request" | "bill";

export interface CheckoutContext {
  source: CheckoutSource;
  publicToken: string;
  amount: number;
  recipientEmail: string;
  recipientName: string;
  lineItems?: Array<{ description: string; quantity: number; unit_amount: number }>;
  isRecurring: boolean;
  stripeCustomerId?: string | null;
  stripePaymentMethodId?: string | null;
  /** Legacy */
  paymentRequest?: PaymentRequest;
  /** New billing */
  bill?: Bill;
  billCharge?: BillCharge | null;
  status: string;
  completed: boolean;
}

export async function resolveCheckoutByToken(token: string): Promise<CheckoutContext | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const legacy = await getPaymentRequestByToken(trimmed);
  if (legacy) {
    const isRecurring =
      legacy.payment_type === "monthly" || legacy.payment_type === "interval_billing";
    return {
      source: "payment_request",
      publicToken: trimmed,
      amount: legacy.amount,
      recipientEmail: legacy.recipient_email,
      recipientName: legacy.recipient_name,
      lineItems: legacy.invoice_line_items ?? undefined,
      isRecurring,
      stripeCustomerId: legacy.stripe_customer_id,
      stripePaymentMethodId: legacy.stripe_payment_method_id,
      paymentRequest: legacy,
      status: legacy.status,
      completed: legacy.status === "completed",
    };
  }

  const bill = await getBillByToken(trimmed);
  if (!bill) return null;

  const openCharge = await getOpenBillCharge(bill.id);
  const completed = bill.status === "completed" || bill.status === "cancelled";

  return {
    source: "bill",
    publicToken: trimmed,
    amount: openCharge?.amount ?? bill.amount,
    recipientEmail: bill.recipientEmail,
    recipientName: bill.recipientName,
    lineItems: bill.lineItems,
    isRecurring: bill.scheduleType === "recurring",
    stripeCustomerId: bill.stripeCustomerId,
    stripePaymentMethodId: bill.stripePaymentMethodId,
    bill,
    billCharge: openCharge,
    status: bill.status,
    completed,
  };
}
