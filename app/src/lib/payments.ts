import { getServerSupabaseClient } from "@/lib/supabase";
import { generatePublicToken } from "@/lib/public-token";
import {
  type InvoiceLineItem,
  normalizeInvoiceLineItems,
  totalFromLineItems,
} from "@/lib/invoice-line-items";
import type { PaymentRequest } from "@/lib/payments-shared";

export type { InvoiceLineItem } from "@/lib/invoice-line-items";
export type { PaymentRequest } from "@/lib/payments-shared";
export { getRequestDisplayInfo } from "@/lib/payments-shared";

function parseInvoiceLineItemsOnRow(row: Record<string, unknown>): PaymentRequest {
  const copy = { ...row } as Record<string, unknown>;
  if (copy.invoice_line_items != null) {
    copy.invoice_line_items = normalizeInvoiceLineItems(copy.invoice_line_items) as unknown;
  }
  return copy as unknown as PaymentRequest;
}

export async function createPaymentRequest(params: {
  userId?: string;
  recipientEmail: string;
  recipientName: string;
  amount: number;
  createdByClerkUserId: string;
  paymentType?: "one_time" | "monthly" | "interval_billing";
  monthlyAmounts?: number[];
  nextBillingDate?: string;
  /** When set, amount is derived as sum of line totals (USD). */
  lineItems?: InvoiceLineItem[];
}): Promise<PaymentRequest> {
  const supabase = getServerSupabaseClient();
  const publicToken = generatePublicToken(16);

  const paymentType = params.paymentType || "one_time";
  let amountForRow = params.amount;
  let lineItemsForDb: InvoiceLineItem[] | null = null;
  if (params.lineItems && params.lineItems.length > 0) {
    lineItemsForDb = params.lineItems;
    amountForRow = totalFromLineItems(params.lineItems);
  }

  // Calculate next billing date for monthly payments (default to next month)
  let calculatedNextBillingDate = params.nextBillingDate;
  if (
    !calculatedNextBillingDate &&
    (paymentType === "monthly" || paymentType === "interval_billing")
  ) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    calculatedNextBillingDate = nextMonth.toISOString().split("T")[0];
  }

  const insertData: any = {
    amount: amountForRow,
    public_token: publicToken,
    created_by_clerk_user_id: params.createdByClerkUserId,
    status: "pending",
    recipient_email: params.recipientEmail,
    recipient_name: params.recipientName,
    payment_type: paymentType,
    next_billing_date: calculatedNextBillingDate || null,
  };

  if (lineItemsForDb && lineItemsForDb.length > 0) {
    insertData.invoice_line_items = lineItemsForDb;
  }

  // Note: monthly_amounts column removed - we're not using it anymore for interval_billing
  // If you need to add it back, you'll need to add the column to the database first

  if (params.userId) {
    insertData.user_id = params.userId;
  }

  let { data, error } = await supabase
    .from("payments_requests")
    .insert(insertData)
    .select("*, users (email, first_name, last_name)")
    .single();

  // DB may not have invoice_line_items yet — retry without it so amount/recipient still save (run migration for line-item storage).
  if (error && insertData.invoice_line_items != null) {
    const { invoice_line_items: _lineItems, ...insertWithoutLines } = insertData;
    const retry = await supabase
      .from("payments_requests")
      .insert(insertWithoutLines)
      .select("*, users (email, first_name, last_name)")
      .single();
    if (!retry.error) {
      console.warn(
        "[createPaymentRequest] Insert succeeded without invoice_line_items — apply migration supabase/migrations/add_payments_requests_invoice_line_items.sql to persist line items.",
      );
      data = retry.data;
      error = retry.error;
    }
  }

  if (error) {
    console.error("Error creating payment request:", error);
    const e = error as { message?: string; hint?: string; details?: string; code?: string };
    throw new Error(
      `Failed to create payment request: ${e.message || "unknown error"}${e.hint ? ` — ${e.hint}` : ""}${e.details ? ` (${e.details})` : ""}${e.code ? ` [${e.code}]` : ""}`,
    );
  }

  // Auto-attach company or user default payment method when none was set
  if (params.userId && !insertData.stripe_customer_id) {
    try {
      const { data: userRow } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", params.userId)
        .single();
      const companyId = userRow?.company_id;
      const method = companyId
        ? await getPaymentMethodForBilling(
            companyId,
            (data.payment_type || "one_time") as BillingTypeForMethod,
          )
        : await getDefaultPaymentMethod({ userId: params.userId });
      if (!method) {
        const userDefault = await getDefaultPaymentMethod({ userId: params.userId });
        if (userDefault) {
          await updatePaymentRequestStripeInfo(
            data.id,
            userDefault.stripeCustomerId,
            userDefault.stripePaymentMethodId,
          );
          data.stripe_customer_id = userDefault.stripeCustomerId;
          data.stripe_payment_method_id = userDefault.stripePaymentMethodId;
        }
      } else {
        await updatePaymentRequestStripeInfo(
          data.id,
          method.stripeCustomerId,
          method.stripePaymentMethodId,
        );
        data.stripe_customer_id = method.stripeCustomerId;
        data.stripe_payment_method_id = method.stripePaymentMethodId;
      }
    } catch (e) {
      console.error("Auto-attach default payment method failed:", e);
    }
  }

  // Parse monthly_amounts if it's a string
  if (data.monthly_amounts && typeof data.monthly_amounts === "string") {
    data.monthly_amounts = JSON.parse(data.monthly_amounts);
  }

  return parseInvoiceLineItemsOnRow(data as Record<string, unknown>);
}

export async function getPaymentRequestById(id: string): Promise<PaymentRequest | null> {
  const supabase = getServerSupabaseClient();

  const { data, error } = await supabase
    .from("payments_requests")
    .select(
      `
      *,
      users (email, first_name, last_name)
    `,
    )
    .eq("id", id)
    .single();

  if (error && error.code !== "PGRST116") {
    // No rows
    console.error("Error fetching payment request:", error);
    throw new Error("Failed to fetch payment request");
  }

  if (data && !data.users && data.recipient_email) {
    // No linked user, use recipient info
    data.users = null; // Ensure it's null for consistency
  }

  // Parse monthly_amounts if it's a string
  if (data && data.monthly_amounts && typeof data.monthly_amounts === "string") {
    data.monthly_amounts = JSON.parse(data.monthly_amounts);
  }

  return data ? parseInvoiceLineItemsOnRow(data as Record<string, unknown>) : null;
}

export async function getPaymentRequestByToken(token: string): Promise<PaymentRequest | null> {
  const supabase = getServerSupabaseClient();

  const { data, error } = await supabase
    .from("payments_requests")
    .select(
      `
      *,
      users (email, first_name, last_name)
    `,
    )
    .eq("public_token", token)
    .single();

  if (error && error.code !== "PGRST116") {
    // No rows
    console.error("Error fetching payment request:", error);
    throw new Error("Failed to fetch payment request");
  }

  if (data && !data.users && data.recipient_email) {
    // No linked user, use recipient info
    data.users = null; // Ensure it's null for consistency
  }

  // Parse monthly_amounts if it's a string
  if (data && data.monthly_amounts && typeof data.monthly_amounts === "string") {
    data.monthly_amounts = JSON.parse(data.monthly_amounts);
  }

  return data ? parseInvoiceLineItemsOnRow(data as Record<string, unknown>) : null;
}

export async function getPaymentRequestsByUser(userId: string): Promise<PaymentRequest[]> {
  const supabase = getServerSupabaseClient();

  const { data, error } = await supabase
    .from("payments_requests")
    .select(
      `
      *,
      users (email, first_name, last_name)
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user payment requests:", error);
    throw new Error("Failed to fetch user payment requests");
  }

  // Parse monthly_amounts for each request
  if (data) {
    data.forEach((req: any) => {
      if (req.monthly_amounts && typeof req.monthly_amounts === "string") {
        req.monthly_amounts = JSON.parse(req.monthly_amounts);
      }
    });
    return data.map((req: Record<string, unknown>) => parseInvoiceLineItemsOnRow(req));
  }

  return data as PaymentRequest[];
}

export async function updatePaymentRequestStatus(
  token: string,
  status: "invoiced" | "completed" | "cancelled",
  stripePaymentIntentId?: string | null,
): Promise<number | null> {
  const supabase = getServerSupabaseClient();

  // Get the payment request first to check for linked fees/subscriptions
  const { data: paymentRequest } = await supabase
    .from("payments_requests")
    .select("id, invoice_number")
    .eq("public_token", token)
    .single();

  if (!paymentRequest) {
    throw new Error("Payment request not found");
  }

  // For completed payments, generate invoice number if not already set
  let invoiceNumber: number | null = null;
  if (status === "completed") {
    if (!paymentRequest.invoice_number) {
      invoiceNumber = await getNextInvoiceNumber();
    } else {
      invoiceNumber = paymentRequest.invoice_number;
    }
  }

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (invoiceNumber !== null) {
    updateData.invoice_number = invoiceNumber;
  }

  const { data: updatedRows, error } = await supabase
    .from("payments_requests")
    .update(updateData)
    .eq("public_token", token)
    .select("id");

  if (error) {
    console.error("Error updating payment request status:", error);
    throw new Error("Failed to update payment request status");
  }
  if (!updatedRows?.length) {
    console.error("updatePaymentRequestStatus: no row matched public_token", {
      tokenPreview: token.slice(0, 8),
    });
    throw new Error("Payment request not updated — no row matched this invoice link");
  }

  // If payment completed, check for linked fees/subscriptions and update them
  if (status === "completed" && paymentRequest.id) {
    try {
      // Dynamically import to avoid circular dependencies
      const {
        getFeeByPaymentRequestId,
        getSubscriptionByPaymentRequestId,
        linkPaymentToFee,
        linkPaymentToSubscription,
      } = await import("./project-payments");

      // Check for linked fee
      const fee = await getFeeByPaymentRequestId(paymentRequest.id);
      if (fee) {
        await linkPaymentToFee(
          fee.id,
          paymentRequest.id,
          invoiceNumber,
          stripePaymentIntentId || null,
        );
        console.log(`Linked payment to fee ${fee.id}`);
      }

      // Check for linked subscription
      const subscription = await getSubscriptionByPaymentRequestId(paymentRequest.id);
      if (subscription) {
        console.log(
          `[PAYMENT STATUS] Found linked subscription ${subscription.id} for payment request ${paymentRequest.id}`,
        );
        try {
          await linkPaymentToSubscription(
            subscription.id,
            paymentRequest.id,
            invoiceNumber,
            stripePaymentIntentId || null,
          );
          console.log(
            `[PAYMENT STATUS] Successfully linked payment to subscription ${subscription.id}`,
          );
        } catch (err) {
          console.error(
            `[PAYMENT STATUS] Error linking payment to subscription ${subscription.id}:`,
            err,
          );
          // Re-throw so it's caught by outer catch block
          throw err;
        }
      } else {
        console.log(
          `[PAYMENT STATUS] No linked subscription found for payment request ${paymentRequest.id}`,
        );
      }
    } catch (err) {
      // Log error but don't fail the payment status update
      console.error("Error linking payment to fee/subscription:", err);
    }
  }

  return invoiceNumber;
}

export async function getAllPaymentRequests(): Promise<PaymentRequest[]> {
  const supabase = getServerSupabaseClient();

  let query = supabase
    .from("payments_requests")
    .select(
      `
      *,
      users (
        email,
        first_name,
        last_name,
        company_id
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all payment requests:", error);
    throw new Error("Failed to fetch all payment requests");
  }

  // Parse monthly_amounts for each request
  if (data) {
    data.forEach((req: any) => {
      if (req.monthly_amounts && typeof req.monthly_amounts === "string") {
        req.monthly_amounts = JSON.parse(req.monthly_amounts);
      }
    });
    return data.map((req: Record<string, unknown>) => parseInvoiceLineItemsOnRow(req));
  }

  return data as PaymentRequest[];
}

export async function getCompanyPaymentRequests(companyId: string): Promise<PaymentRequest[]> {
  const supabase = getServerSupabaseClient();

  // First, get all user IDs for this company
  const { data: companyUsers, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("company_id", companyId);

  if (usersError) {
    console.error("Error fetching company users:", usersError);
    throw new Error("Failed to fetch company users");
  }

  const userIds = companyUsers?.map((u) => u.id) || [];

  // If no users in company, return empty array
  if (userIds.length === 0) {
    return [];
  }

  // Get payment requests for these users
  const { data, error } = await supabase
    .from("payments_requests")
    .select(
      `
      *,
      users (
        email,
        first_name,
        last_name,
        company_id
      )
    `,
    )
    .in("user_id", userIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company payment requests:", error);
    throw new Error("Failed to fetch company payment requests");
  }

  // Parse monthly_amounts for each request
  if (data) {
    data.forEach((req: any) => {
      if (req.monthly_amounts && typeof req.monthly_amounts === "string") {
        req.monthly_amounts = JSON.parse(req.monthly_amounts);
      }
    });
    return data.map((req: Record<string, unknown>) => parseInvoiceLineItemsOnRow(req));
  }

  return data as PaymentRequest[];
}

export async function deletePaymentRequest(id: string): Promise<void> {
  const supabase = getServerSupabaseClient();

  const { error } = await supabase.from("payments_requests").delete().eq("id", id);

  if (error) {
    console.error("Error deleting payment request:", error);
    throw new Error("Failed to delete payment request");
  }
}

export async function updatePaymentRequestStripeInfo(
  id: string,
  stripeCustomerId?: string | null,
  stripePaymentMethodId?: string | null,
): Promise<void> {
  const supabase = getServerSupabaseClient();

  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (stripeCustomerId !== undefined) {
    updateData.stripe_customer_id = stripeCustomerId;
  }

  if (stripePaymentMethodId !== undefined) {
    updateData.stripe_payment_method_id = stripePaymentMethodId;
  }

  console.log("Updating payment request Stripe info:", { id, updateData });

  const { data, error } = await supabase
    .from("payments_requests")
    .update(updateData)
    .eq("id", id)
    .select();

  if (error) {
    console.error("Error updating payment request Stripe info:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to update payment request Stripe info: ${error.message}`);
  }

  console.log("Payment request updated successfully:", data);
}

/**
 * Get company IDs that have at least one payment request due for billing on or before asOfDate.
 * Used by billing cron to run attachCompanyDefaultToPaymentRequests only for relevant companies.
 * Includes companies from: (1) user_id of due PRs, (2) project_fees linking due PRs, (3) project_subscriptions linking due PRs.
 */
export async function getCompanyIdsWithDuePaymentRequests(asOfDate: Date): Promise<string[]> {
  const supabase = getServerSupabaseClient();
  const asOfTime = asOfDate.getTime();

  const { data: rows, error } = await supabase
    .from("payments_requests")
    .select("id, user_id, next_billing_date, payment_type")
    .in("payment_type", ["one_time", "interval_billing", "monthly"])
    .in("status", ["pending", "invoiced"]);

  if (error || !rows?.length) return [];

  type Row = {
    id: string;
    user_id: string | null;
    next_billing_date: string | null;
    payment_type: string;
  };
  const duePrIds = new Set<string>();
  const dueUserIds = new Set<string>();
  for (const pr of rows as Row[]) {
    const isDue =
      pr.payment_type === "one_time"
        ? !pr.next_billing_date || new Date(pr.next_billing_date).getTime() <= asOfTime
        : !pr.next_billing_date || new Date(pr.next_billing_date).getTime() <= asOfTime;
    if (!isDue) continue;
    duePrIds.add(pr.id);
    if (pr.user_id) dueUserIds.add(pr.user_id);
  }
  if (duePrIds.size === 0) return [];

  const companyIds = new Set<string>();

  if (dueUserIds.size > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("company_id")
      .in("id", Array.from(dueUserIds))
      .not("company_id", "is", null);
    (users || []).forEach((u: { company_id: string }) => companyIds.add(u.company_id));
  }

  const { data: feeRows } = await supabase
    .from("project_fees")
    .select("company_id")
    .in("payment_request_id", Array.from(duePrIds))
    .not("company_id", "is", null);
  (feeRows || []).forEach((f: { company_id: string }) => companyIds.add(f.company_id));

  const { data: subRows } = await supabase
    .from("project_subscriptions")
    .select("company_id")
    .in("payment_request_id", Array.from(duePrIds))
    .not("company_id", "is", null);
  (subRows || []).forEach((s: { company_id: string }) => companyIds.add(s.company_id));

  return [...companyIds];
}

/**
 * Get payment requests that are due for billing on or before asOfDate (for cron).
 * Includes one_time (pending), interval_billing and monthly with saved payment method and (no next_billing_date or next_billing_date <= asOfDate).
 * Payment requests linked to a project_subscription are only due when that subscription's next_billing_date is due (so we don't charge "monthly" before the subscription is due).
 */
export async function getDuePaymentRequests(asOfDate: Date): Promise<PaymentRequest[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("payments_requests")
    .select("*")
    .in("payment_type", ["one_time", "interval_billing", "monthly"])
    .in("status", ["pending", "invoiced"])
    .not("stripe_payment_method_id", "is", null)
    .not("stripe_customer_id", "is", null);

  if (error) {
    console.error("Error fetching due payment requests:", error);
    return [];
  }
  const asOfTime = asOfDate.getTime();
  let due = ((data || []) as PaymentRequest[]).filter((pr) => {
    if (pr.payment_type === "one_time") {
      if (!pr.next_billing_date) return true;
      return new Date(pr.next_billing_date).getTime() <= asOfTime;
    }
    if (!pr.next_billing_date) return true;
    const next = new Date(pr.next_billing_date).getTime();
    return next <= asOfTime;
  });

  // Exclude PRs that are linked to a subscription whose next_billing_date is still in the future (subscription drives the due date)
  const duePrIds = new Set(due.map((pr) => pr.id));
  if (duePrIds.size > 0) {
    const { data: subRows } = await supabase
      .from("project_subscriptions")
      .select("payment_request_id, next_billing_date")
      .in("payment_request_id", Array.from(duePrIds))
      .eq("status", "active")
      .not("next_billing_date", "is", null);
    const prIdsTiedToFutureSub = new Set(
      (subRows || [])
        .filter(
          (r: { next_billing_date: string }) => new Date(r.next_billing_date).getTime() > asOfTime,
        )
        .map((r: { payment_request_id: string }) => r.payment_request_id),
    );
    if (prIdsTiedToFutureSub.size > 0) {
      due = due.filter((pr) => !prIdsTiedToFutureSub.has(pr.id));
    }
  }

  // Fallback: monthly PRs – if the company has an active subscription with next_billing_date in the future (linked or not), don't charge the monthly PR yet (subscription drives the schedule)
  const monthlyDue = due.filter((pr) => pr.payment_type === "monthly");
  if (monthlyDue.length > 0) {
    const userIds = [...new Set(monthlyDue.map((pr) => pr.user_id).filter(Boolean))] as string[];
    const { data: users } = await supabase.from("users").select("id, company_id").in("id", userIds);
    const userToCompany = new Map(
      (users || []).map((u: { id: string; company_id: string | null }) => [u.id, u.company_id]),
    );
    const asOfDateStr = asOfDate.toISOString().slice(0, 10);
    const { data: futureSubs } = await supabase
      .from("project_subscriptions")
      .select("company_id")
      .eq("status", "active")
      .not("next_billing_date", "is", null)
      .gt("next_billing_date", asOfDateStr);
    const companyIdsWithFutureSub = new Set(
      (futureSubs || []).map((r: { company_id: string }) => r.company_id),
    );
    due = due.filter((pr) => {
      if (pr.payment_type !== "monthly") return true;
      const companyId = pr.user_id ? userToCompany.get(pr.user_id) : null;
      return !companyId || !companyIdsWithFutureSub.has(companyId);
    });
  }
  return due;
}

export async function updatePaymentRequestNextBillingDate(
  id: string,
  nextBillingDate: string,
): Promise<void> {
  const supabase = getServerSupabaseClient();

  const { error } = await supabase
    .from("payments_requests")
    .update({
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating payment request next billing date:", error);
    throw new Error("Failed to update payment request next billing date");
  }
}

/**
 * Update payment request fields (super admin only). All fields optional.
 */
export async function updatePaymentRequest(
  id: string,
  updates: {
    amount?: number;
    next_billing_date?: string | null;
    recipient_email?: string;
    recipient_name?: string;
    invoice_line_items?: InvoiceLineItem[] | null;
  },
): Promise<PaymentRequest | null> {
  const supabase = getServerSupabaseClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.invoice_line_items !== undefined) {
    if (updates.invoice_line_items === null || updates.invoice_line_items.length === 0) {
      payload.invoice_line_items = null;
      if (updates.amount !== undefined) payload.amount = updates.amount;
    } else {
      payload.invoice_line_items = updates.invoice_line_items;
      payload.amount = totalFromLineItems(updates.invoice_line_items);
    }
  } else if (updates.amount !== undefined) {
    payload.amount = updates.amount;
    payload.invoice_line_items = null;
  }
  if (updates.next_billing_date !== undefined)
    payload.next_billing_date = updates.next_billing_date;
  if (updates.recipient_email !== undefined) payload.recipient_email = updates.recipient_email;
  if (updates.recipient_name !== undefined) payload.recipient_name = updates.recipient_name;

  const { data, error } = await supabase
    .from("payments_requests")
    .update(payload)
    .eq("id", id)
    .select("*, users (email, first_name, last_name)")
    .single();

  if (error) {
    console.error("Error updating payment request:", error);
    return null;
  }
  return parseInvoiceLineItemsOnRow(data as Record<string, unknown>);
}

/** Record payment received outside Stripe for a legacy payment request. */
export async function markPaymentRequestPaidManually(
  paymentRequestId: string,
): Promise<{ invoiceNumber: number }> {
  const pr = await getPaymentRequestById(paymentRequestId);
  if (!pr) throw new Error("Payment request not found");
  if (pr.status === "completed") throw new Error("Payment request is already paid");
  if (pr.status === "cancelled") throw new Error("Payment request is cancelled");

  const {
    getFeeByPaymentRequestId,
    getSubscriptionByPaymentRequestId,
    updateProjectFeeStatus,
    createProjectFeeTransaction,
    updateSubscriptionBillingDates,
    createProjectSubscriptionTransaction,
    calculateNextBillingDate,
    syncProjectSubscriptionFromPaymentRequestUpdate,
  } = await import("./project-payments");

  const invoiceNumber = pr.invoice_number ?? (await getNextInvoiceNumber());
  const now = new Date();

  const fee = await getFeeByPaymentRequestId(paymentRequestId);
  if (fee && fee.status === "pending") {
    await updateProjectFeeStatus(fee.id, "completed", paymentRequestId);
    await createProjectFeeTransaction({
      projectFeeId: fee.id,
      paymentRequestId,
      stripePaymentIntentId: null,
      amount: fee.amount,
      invoiceNumber,
    });
  }

  const subscription = await getSubscriptionByPaymentRequestId(paymentRequestId);
  if (subscription && subscription.status === "active") {
    const nextBillingDate = calculateNextBillingDate(
      subscription.billingInterval || "monthly",
      now,
      {
        dayOfMonth: subscription.billingDayOfMonth ?? undefined,
        dayOfWeek: subscription.billingDayOfWeek ?? undefined,
      },
    );
    await updateSubscriptionBillingDates(
      subscription.id,
      now.toISOString(),
      nextBillingDate.toISOString(),
    );
    await createProjectSubscriptionTransaction({
      projectSubscriptionId: subscription.id,
      paymentRequestId,
      stripePaymentIntentId: null,
      amount: subscription.amount,
      invoiceNumber,
      billingPeriodStart: now.toISOString(),
      billingPeriodEnd: nextBillingDate.toISOString(),
    });
  }

  if (pr.payment_type === "interval_billing") {
    const nextDate = calculateNextBillingDate("monthly", now);
    const nextDateStr = nextDate.toISOString().split("T")[0];
    await updatePaymentRequestInvoiceAndStatus(paymentRequestId, invoiceNumber, "invoiced");
    await updatePaymentRequestNextBillingDate(paymentRequestId, nextDateStr);
    await syncProjectSubscriptionFromPaymentRequestUpdate(paymentRequestId, {
      next_billing_date: nextDateStr,
    });
  } else {
    await updatePaymentRequestInvoiceAndStatus(paymentRequestId, invoiceNumber, "completed");
  }

  return { invoiceNumber };
}

export async function getNextInvoiceNumber(): Promise<number> {
  const supabase = getServerSupabaseClient();

  const { data, error } = await supabase.rpc("get_next_invoice_number");

  if (error) {
    console.error("Error getting next invoice number:", error);
    // Fallback: max across all tables that store invoice_number
    const tables = [
      "payments_requests",
      "bill_charges",
      "project_subscription_transactions",
    ] as const;
    let maxNum = 1653;
    for (const table of tables) {
      const { data: maxData } = await supabase
        .from(table)
        .select("invoice_number")
        .not("invoice_number", "is", null)
        .order("invoice_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (maxData?.invoice_number != null && maxData.invoice_number > maxNum) {
        maxNum = maxData.invoice_number;
      }
    }
    return maxNum + 1;
  }

  return data || 1654;
}

export async function updatePaymentRequestInvoiceAndStatus(
  id: string,
  invoiceNumber: number,
  status: "completed" | "invoiced" | "pending" | "cancelled",
): Promise<void> {
  const supabase = getServerSupabaseClient();

  const { error } = await supabase
    .from("payments_requests")
    .update({
      invoice_number: invoiceNumber,
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating payment request invoice and status:", error);
    throw new Error("Failed to update payment request invoice and status");
  }
}

// Helper to get display name/email for a request — see payments-shared.ts

// Billing type for secondary payment method targeting
export type BillingTypeForMethod = "subscription" | "one_time" | "interval_billing" | "monthly";

// Saved Payment Methods
export interface SavedPaymentMethod {
  id: string;
  userId: string | null;
  companyId: string | null;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  paymentMethodType: "card" | "us_bank_account";
  displayName: string | null;
  isDefault: boolean;
  useForBillingType: BillingTypeForMethod | null;
  createdAt: string;
  updatedAt: string;
}

export async function savePaymentMethod(params: {
  userId?: string;
  companyId?: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  paymentMethodType: "card" | "us_bank_account";
  displayName?: string;
  isDefault?: boolean;
  useForBillingType?: BillingTypeForMethod | null;
}): Promise<SavedPaymentMethod> {
  const supabase = getServerSupabaseClient();
  const useType = params.useForBillingType ?? null;

  // If setting as default, unset other defaults for this user/company and same use_for_billing_type
  if (params.isDefault) {
    if (params.userId) {
      let q = supabase
        .from("saved_payment_methods")
        .update({ is_default: false })
        .eq("user_id", params.userId)
        .eq("is_default", true);
      if (useType === null) {
        q = q.is("use_for_billing_type", null);
      } else {
        q = q.eq("use_for_billing_type", useType);
      }
      await q;
    } else if (params.companyId) {
      let q = supabase
        .from("saved_payment_methods")
        .update({ is_default: false })
        .eq("company_id", params.companyId)
        .eq("is_default", true);
      if (useType === null) {
        q = q.is("use_for_billing_type", null);
      } else {
        q = q.eq("use_for_billing_type", useType);
      }
      await q;
    }
  }

  const insertData: any = {
    stripe_customer_id: params.stripeCustomerId,
    stripe_payment_method_id: params.stripePaymentMethodId,
    payment_method_type: params.paymentMethodType,
    display_name: params.displayName || null,
    is_default: params.isDefault || false,
    use_for_billing_type: useType,
  };

  if (params.userId) {
    insertData.user_id = params.userId;
  }
  if (params.companyId) {
    insertData.company_id = params.companyId;
  }

  const { data, error } = await supabase
    .from("saved_payment_methods")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Error saving payment method:", error);
    throw new Error("Failed to save payment method");
  }

  return {
    id: data.id,
    userId: data.user_id,
    companyId: data.company_id,
    stripeCustomerId: data.stripe_customer_id,
    stripePaymentMethodId: data.stripe_payment_method_id,
    paymentMethodType: data.payment_method_type,
    displayName: data.display_name,
    isDefault: data.is_default,
    useForBillingType: data.use_for_billing_type ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getSavedPaymentMethods(params: {
  userId?: string;
  companyId?: string;
}): Promise<SavedPaymentMethod[]> {
  const supabase = getServerSupabaseClient();

  let query = supabase
    .from("saved_payment_methods")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else if (params.companyId) {
    query = query.eq("company_id", params.companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching saved payment methods:", error);
    throw new Error("Failed to fetch saved payment methods");
  }

  return (data || []).map((row: any) => rowToSavedMethod(row));
}

function rowToSavedMethod(row: any): SavedPaymentMethod {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id,
    stripeCustomerId: row.stripe_customer_id,
    stripePaymentMethodId: row.stripe_payment_method_id,
    paymentMethodType: row.payment_method_type,
    displayName: row.display_name,
    isDefault: row.is_default,
    useForBillingType: row.use_for_billing_type ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getDefaultPaymentMethod(params: {
  userId?: string;
  companyId?: string;
}): Promise<SavedPaymentMethod | null> {
  const supabase = getServerSupabaseClient();

  let query = supabase
    .from("saved_payment_methods")
    .select("*")
    .eq("is_default", true)
    .is("use_for_billing_type", null)
    .limit(1);

  if (params.userId) {
    query = query.eq("user_id", params.userId);
  } else if (params.companyId) {
    query = query.eq("company_id", params.companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching default payment method:", error);
    throw new Error("Failed to fetch default payment method");
  }

  if (!data || data.length === 0) {
    return null;
  }

  return rowToSavedMethod(data[0]);
}

/**
 * Get payment method to use for a given company and billing type.
 * Prefers a method with use_for_billing_type matching the type, then falls back to default.
 */
export async function getPaymentMethodForBilling(
  companyId: string,
  billingType: BillingTypeForMethod | "subscription" | "one_time" | "interval_billing" | "monthly",
): Promise<SavedPaymentMethod | null> {
  const supabase = getServerSupabaseClient();

  // First try method explicitly for this billing type
  const { data: forType } = await supabase
    .from("saved_payment_methods")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_default", true)
    .eq("use_for_billing_type", billingType)
    .limit(1)
    .maybeSingle();

  if (forType) return rowToSavedMethod(forType);

  // Fall back to company default (no specific type)
  const defaultMethod = await getDefaultPaymentMethod({ companyId });
  return defaultMethod;
}

/**
 * Get payment method for a user and billing type (e.g. subscription).
 * Used when the method is saved under user_id only (no company_id) so company lookups miss it.
 */
export async function getPaymentMethodForUserBilling(
  userId: string,
  billingType: BillingTypeForMethod | "subscription" | "one_time" | "interval_billing" | "monthly",
): Promise<SavedPaymentMethod | null> {
  const supabase = getServerSupabaseClient();
  const { data: forType } = await supabase
    .from("saved_payment_methods")
    .select("*")
    .eq("user_id", userId)
    .eq("is_default", true)
    .eq("use_for_billing_type", billingType)
    .limit(1)
    .maybeSingle();
  if (forType) return rowToSavedMethod(forType);
  return getDefaultPaymentMethod({ userId });
}

/**
 * Last resort: get any saved payment method for a company (company-level or any company user).
 * Used when no default is set so billing can still use the only method the admin sees.
 */
export async function getAnySavedMethodForCompany(
  companyId: string,
): Promise<SavedPaymentMethod | null> {
  const supabase = getServerSupabaseClient();
  const { data: companyMethods } = await supabase
    .from("saved_payment_methods")
    .select("*")
    .eq("company_id", companyId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (companyMethods?.[0]) return rowToSavedMethod(companyMethods[0]);
  const { data: userIds } = await supabase.from("users").select("id").eq("company_id", companyId);
  if (!userIds?.length) return null;
  const { data: userMethods } = await supabase
    .from("saved_payment_methods")
    .select("*")
    .in(
      "user_id",
      userIds.map((u) => u.id),
    )
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1);
  if (userMethods?.[0]) return rowToSavedMethod(userMethods[0]);
  return null;
}

/**
 * Attach company default payment method to all payment requests in the company that are missing Stripe info.
 * Uses company default first; then subscription-type; then any method for the company or its users (so user-level methods count).
 * Also attaches to payment requests linked to this company via project_subscriptions or project_fees (by payment_request_id), even if user is elsewhere.
 */
export async function attachCompanyDefaultToPaymentRequests(
  companyId: string,
): Promise<{ updated: number; methodFound: boolean }> {
  const defaultMethod =
    (await getDefaultPaymentMethod({ companyId })) ||
    (await getPaymentMethodForBilling(companyId, "subscription")) ||
    (await getAnySavedMethodForCompany(companyId));
  if (!defaultMethod) return { updated: 0, methodFound: false };

  const supabase = getServerSupabaseClient();
  const requestIdsToUpdate = new Set<string>();

  // 1) Payment requests for users in this company that are missing Stripe info
  const { data: userIds } = await supabase.from("users").select("id").eq("company_id", companyId);
  if (userIds?.length) {
    const ids = userIds.map((u) => u.id);
    const { data: requests, error: fetchErr } = await supabase
      .from("payments_requests")
      .select("id")
      .in("user_id", ids)
      .or("stripe_customer_id.is.null,stripe_payment_method_id.is.null");
    if (!fetchErr && requests?.length) {
      requests.forEach((r) => requestIdsToUpdate.add(r.id));
    }
  }

  // 2) Payment requests linked to this company's project_subscriptions (so subscription billings get a method even if user_id is null/different)
  const { data: subRows } = await supabase
    .from("project_subscriptions")
    .select("payment_request_id")
    .eq("company_id", companyId)
    .not("payment_request_id", "is", null);
  if (subRows?.length) {
    const prIds = [
      ...new Set(subRows.map((s) => s.payment_request_id).filter(Boolean)),
    ] as string[];
    if (prIds.length) {
      const { data: prs } = await supabase
        .from("payments_requests")
        .select("id")
        .in("id", prIds)
        .or("stripe_customer_id.is.null,stripe_payment_method_id.is.null");
      if (prs?.length) prs.forEach((r) => requestIdsToUpdate.add(r.id));
    }
  }

  // 3) Payment requests linked to this company's project_fees (one-time charges attached to a fee for the company)
  const { data: feeRows } = await supabase
    .from("project_fees")
    .select("payment_request_id")
    .eq("company_id", companyId)
    .not("payment_request_id", "is", null);
  if (feeRows?.length) {
    const prIds = [
      ...new Set(feeRows.map((f) => f.payment_request_id).filter(Boolean)),
    ] as string[];
    if (prIds.length) {
      const { data: prs } = await supabase
        .from("payments_requests")
        .select("id")
        .in("id", prIds)
        .or("stripe_customer_id.is.null,stripe_payment_method_id.is.null");
      if (prs?.length) prs.forEach((r) => requestIdsToUpdate.add(r.id));
    }
  }

  if (requestIdsToUpdate.size === 0) return { updated: 0, methodFound: true };

  const { error: updateErr } = await supabase
    .from("payments_requests")
    .update({
      stripe_customer_id: defaultMethod.stripeCustomerId,
      stripe_payment_method_id: defaultMethod.stripePaymentMethodId,
      updated_at: new Date().toISOString(),
    })
    .in("id", Array.from(requestIdsToUpdate));

  if (updateErr) {
    console.error("Error attaching default to payment requests:", updateErr);
    return { updated: 0, methodFound: true };
  }
  return { updated: requestIdsToUpdate.size, methodFound: true };
}

export async function deleteSavedPaymentMethod(id: string): Promise<void> {
  const supabase = getServerSupabaseClient();

  const { error } = await supabase.from("saved_payment_methods").delete().eq("id", id);

  if (error) {
    console.error("Error deleting saved payment method:", error);
    throw new Error("Failed to delete saved payment method");
  }
}

/**
 * Remove saved payment method(s) that reference an invalid Stripe PaymentMethod ID
 * (e.g. after "No such PaymentMethod" from Stripe so we don't re-attach or retry).
 * Returns the number of rows deleted.
 */
export async function deleteSavedPaymentMethodByStripePmId(
  stripePaymentMethodId: string,
): Promise<number> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_payment_methods")
    .delete()
    .eq("stripe_payment_method_id", stripePaymentMethodId)
    .select("id");
  if (error) {
    console.error("Error deleting saved payment method by Stripe PM id:", error);
    return 0;
  }
  return data?.length ?? 0;
}
