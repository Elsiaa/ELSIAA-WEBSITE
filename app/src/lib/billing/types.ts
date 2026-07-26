/** Simplified Bills model (from main unified billing) — no legacy fees tree. */

export type BillSchedule = "one_time" | "recurring";
export type BillInterval = "weekly" | "monthly" | "yearly";
export type CollectionMode = "invoice_link" | "auto_charge";
export type BillStatus = "draft" | "active" | "paused" | "completed" | "cancelled";
export type ChargeStatus = "pending" | "paid" | "failed" | "processing";

export type BillLineItem = {
  description: string;
  amountCents: number;
};

export type Bill = {
  id: string;
  description: string;
  recipientName: string;
  recipientEmail: string;
  amountCents: number;
  currency: "usd";
  schedule: BillSchedule;
  interval?: BillInterval;
  collectionMode: CollectionMode;
  status: BillStatus;
  publicToken: string;
  nextBillingDate: string | null;
  dueDate: string | null;
  lineItems: BillLineItem[];
};

export type BillCharge = {
  id: string;
  billId: string;
  description: string;
  amountCents: number;
  status: ChargeStatus;
  paidAt: string | null;
  createdAt: string;
};

export type SavedPaymentMethod = {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

export type BillingAccountStatus = {
  allUpToDate: boolean;
  overdueBills: number;
  maxDaysOverdue: number;
};

export const BILLING_GRACE_DAYS = 3;

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
