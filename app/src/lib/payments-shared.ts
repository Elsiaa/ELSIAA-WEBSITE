import type { User } from "@/types/company";
import type { InvoiceLineItem } from "@/lib/invoice-line-items";

export interface PaymentRequest {
  id: string;
  user_id: string | null;
  amount: number;
  status: "pending" | "invoiced" | "completed" | "cancelled";
  public_token: string;
  created_by_clerk_user_id: string;
  created_at: string;
  updated_at: string;
  recipient_email: string;
  recipient_name: string;
  payment_type: "one_time" | "monthly" | "interval_billing";
  monthly_amounts?: number[] | null;
  next_billing_date?: string | null;
  stripe_customer_id?: string | null;
  stripe_payment_method_id?: string | null;
  invoice_number?: number | null;
  /** Line-item breakdown for one-time invoices (USD dollars per unit). */
  invoice_line_items?: InvoiceLineItem[] | null;
  users?: Pick<User, "email" | "first_name" | "last_name"> | null;
}

/** Display name/email for a payment request (safe for client components). */
export function getRequestDisplayInfo(request: PaymentRequest): {
  name: string;
  email: string;
} {
  if (request.users) {
    return {
      name:
        `${request.users.first_name || ""} ${request.users.last_name || ""}`.trim() ||
        request.users.email,
      email: request.users.email,
    };
  }
  return {
    name: request.recipient_name || "Unknown",
    email: request.recipient_email || "Unknown",
  };
}
