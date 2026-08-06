/**
 * Project payments management - fees and subscriptions
 */

import { getServerSupabaseClient } from "./supabase";
import { getPaymentRequestById, getCompanyPaymentRequests } from "./payments";

export interface ProjectFee {
  id: string;
  projectId: string;
  companyId: string;
  name: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  paymentRequestId: string | null;
  createdByClerkUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSubscription {
  id: string;
  projectId: string;
  companyId: string;
  name: string;
  amount: number;
  status: "active" | "cancelled" | "stopped";
  paymentRequestId: string | null;
  stripeSubscriptionId: string | null;
  lastBilledDate: string | null;
  nextBillingDate: string | null;
  billingInterval: "daily" | "weekly" | "monthly";
  /** Day of month for monthly billing (1-31). Null = use from-date day. */
  billingDayOfMonth: number | null;
  /** Day of week for weekly billing (0=Sunday .. 6=Saturday). Null = use from-date day. */
  billingDayOfWeek: number | null;
  createdByClerkUserId: string;
  stoppedByClerkUserId: string | null;
  stoppedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFeeTransaction {
  id: string;
  projectFeeId: string;
  paymentRequestId: string | null;
  stripePaymentIntentId: string | null;
  amount: number;
  invoiceNumber: number | null;
  transactionDate: string;
  createdAt: string;
}

export interface ProjectSubscriptionTransaction {
  id: string;
  projectSubscriptionId: string;
  paymentRequestId: string | null;
  stripePaymentIntentId: string | null;
  amount: number;
  invoiceNumber: number | null;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  transactionDate: string;
  createdAt: string;
}

// Database row types (snake_case from Supabase)
type ProjectFeeRow = {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  amount: number;
  status: "pending" | "completed" | "cancelled";
  payment_request_id: string | null;
  created_by_clerk_user_id: string;
  created_at: string;
  updated_at: string;
};

type ProjectSubscriptionRow = {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  amount: number;
  status: "active" | "cancelled" | "stopped";
  payment_request_id: string | null;
  stripe_subscription_id: string | null;
  last_billed_date: string | null;
  next_billing_date: string | null;
  billing_interval: "daily" | "weekly" | "monthly";
  billing_day_of_month: number | null;
  billing_day_of_week: number | null;
  created_by_clerk_user_id: string;
  stopped_by_clerk_user_id: string | null;
  stopped_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProjectFeeTransactionRow = {
  id: string;
  project_fee_id: string;
  payment_request_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  invoice_number: number | null;
  transaction_date: string;
  created_at: string;
};

type ProjectSubscriptionTransactionRow = {
  id: string;
  project_subscription_id: string;
  payment_request_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  invoice_number: number | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  transaction_date: string;
  created_at: string;
};

// Converters
function rowToProjectFee(row: ProjectFeeRow): ProjectFee {
  return {
    id: row.id,
    projectId: row.project_id,
    companyId: row.company_id,
    name: row.name,
    amount: parseFloat(row.amount.toString()),
    status: row.status,
    paymentRequestId: row.payment_request_id,
    createdByClerkUserId: row.created_by_clerk_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProjectSubscription(row: ProjectSubscriptionRow): ProjectSubscription {
  return {
    id: row.id,
    projectId: row.project_id,
    companyId: row.company_id,
    name: row.name,
    amount: parseFloat(row.amount.toString()),
    status: row.status,
    paymentRequestId: row.payment_request_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    lastBilledDate: row.last_billed_date,
    nextBillingDate: row.next_billing_date,
    billingInterval: row.billing_interval || "monthly",
    billingDayOfMonth: row.billing_day_of_month ?? null,
    billingDayOfWeek: row.billing_day_of_week ?? null,
    createdByClerkUserId: row.created_by_clerk_user_id,
    stoppedByClerkUserId: row.stopped_by_clerk_user_id,
    stoppedAt: row.stopped_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProjectFeeTransaction(row: ProjectFeeTransactionRow): ProjectFeeTransaction {
  return {
    id: row.id,
    projectFeeId: row.project_fee_id,
    paymentRequestId: row.payment_request_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amount: parseFloat(row.amount.toString()),
    invoiceNumber: row.invoice_number,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
  };
}

function rowToProjectSubscriptionTransaction(
  row: ProjectSubscriptionTransactionRow,
): ProjectSubscriptionTransaction {
  return {
    id: row.id,
    projectSubscriptionId: row.project_subscription_id,
    paymentRequestId: row.payment_request_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    amount: parseFloat(row.amount.toString()),
    invoiceNumber: row.invoice_number,
    billingPeriodStart: row.billing_period_start,
    billingPeriodEnd: row.billing_period_end,
    transactionDate: row.transaction_date,
    createdAt: row.created_at,
  };
}

/**
 * Get all fees for a project
 */
export async function getProjectFees(projectId: string): Promise<ProjectFee[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fees")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project fees:", error);
    throw new Error("Failed to fetch project fees");
  }

  return (data || []).map(rowToProjectFee);
}

/**
 * Get all subscriptions for a project
 */
export async function getProjectSubscriptions(projectId: string): Promise<ProjectSubscription[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching project subscriptions:", error);
    throw new Error("Failed to fetch project subscriptions");
  }

  return (data || []).map(rowToProjectSubscription);
}

/**
 * Get all fees for a company
 */
export async function getCompanyFees(companyId: string): Promise<ProjectFee[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fees")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company fees:", error);
    throw new Error("Failed to fetch company fees");
  }

  return (data || []).map(rowToProjectFee);
}

/**
 * Get a single project subscription by ID
 */
export async function getProjectSubscriptionById(
  subscriptionId: string,
): Promise<ProjectSubscription | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching project subscription:", error);
    throw new Error("Failed to fetch project subscription");
  }

  return data ? rowToProjectSubscription(data as ProjectSubscriptionRow) : null;
}

/**
 * Get all subscriptions for a company
 */
export async function getCompanySubscriptions(companyId: string): Promise<ProjectSubscription[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching company subscriptions:", error);
    throw new Error("Failed to fetch company subscriptions");
  }

  return (data || []).map(rowToProjectSubscription);
}

/**
 * Create a project fee
 */
export async function createProjectFee(params: {
  projectId: string;
  companyId: string;
  name: string;
  amount: number;
  createdByClerkUserId: string;
}): Promise<ProjectFee> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fees")
    .insert({
      project_id: params.projectId,
      company_id: params.companyId,
      name: params.name,
      amount: params.amount,
      status: "pending",
      created_by_clerk_user_id: params.createdByClerkUserId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating project fee:", error);
    throw new Error("Failed to create project fee");
  }

  return rowToProjectFee(data as ProjectFeeRow);
}

export interface NextBillingDateOptions {
  /** Day of month for monthly (1-31). */
  dayOfMonth?: number | null;
  /** Day of week for weekly (0=Sunday .. 6=Saturday). */
  dayOfWeek?: number | null;
}

/**
 * Calculate next billing date based on interval and optional schedule (e.g. monthly on 16th, weekly on Tuesday).
 */
export function calculateNextBillingDate(
  interval: "daily" | "weekly" | "monthly",
  fromDate?: Date,
  options?: NextBillingDateOptions,
): Date {
  const from = fromDate || new Date();
  const next = new Date(from);

  switch (interval) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly": {
      if (options?.dayOfWeek != null && options.dayOfWeek >= 0 && options.dayOfWeek <= 6) {
        // Next occurrence of this weekday (if today is that day, go to next week)
        const currentDay = next.getDay();
        let daysToAdd = options.dayOfWeek - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7;
        next.setDate(next.getDate() + daysToAdd);
      } else {
        next.setDate(next.getDate() + 7);
      }
      break;
    }
    case "monthly": {
      const month = from.getMonth();
      const year = from.getFullYear();
      const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
      const targetDay =
        options?.dayOfMonth != null && options.dayOfMonth >= 1 && options.dayOfMonth <= 31
          ? Math.min(options.dayOfMonth, daysInCurrentMonth)
          : Math.min(from.getDate(), daysInCurrentMonth);
      // First try same day in current month (for new subscriptions: first billing hasn't occurred yet)
      next.setFullYear(year, month, 1);
      next.setDate(Math.min(targetDay, daysInCurrentMonth));
      next.setHours(0, 0, 0, 0);
      if (next.getTime() > from.getTime()) {
        // This month's occurrence is still in the future — use it
        break;
      }
      // Already past (or today was the billing day) — use same day next month
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 11) {
        nextMonth = 0;
        nextYear = year + 1;
      }
      const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
      next.setFullYear(nextYear, nextMonth, 1);
      next.setDate(Math.min(targetDay, daysInNextMonth));
      break;
    }
  }

  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Create a project subscription
 */
export async function createProjectSubscription(params: {
  projectId: string;
  companyId: string;
  name: string;
  amount: number;
  billingInterval?: "daily" | "weekly" | "monthly";
  billingDayOfMonth?: number | null;
  billingDayOfWeek?: number | null;
  createdByClerkUserId: string;
}): Promise<ProjectSubscription> {
  const supabase = getServerSupabaseClient();

  const billingInterval = params.billingInterval || "monthly";
  const nextBillingDate = calculateNextBillingDate(billingInterval, undefined, {
    dayOfMonth: params.billingDayOfMonth ?? undefined,
    dayOfWeek: params.billingDayOfWeek ?? undefined,
  });

  const insertRow: Record<string, unknown> = {
    project_id: params.projectId,
    company_id: params.companyId,
    name: params.name,
    amount: params.amount,
    status: "active",
    billing_interval: billingInterval,
    next_billing_date: nextBillingDate.toISOString(),
    created_by_clerk_user_id: params.createdByClerkUserId,
  };
  if (params.billingDayOfMonth != null) insertRow.billing_day_of_month = params.billingDayOfMonth;
  if (params.billingDayOfWeek != null) insertRow.billing_day_of_week = params.billingDayOfWeek;

  const { data, error } = await supabase
    .from("project_subscriptions")
    .insert(insertRow)
    .select()
    .single();

  if (error) {
    console.error("Error creating project subscription:", error);
    throw new Error("Failed to create project subscription");
  }

  return rowToProjectSubscription(data as ProjectSubscriptionRow);
}

/**
 * Get a single project fee by ID
 */
export async function getProjectFeeById(feeId: string): Promise<ProjectFee | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.from("project_fees").select("*").eq("id", feeId).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null; // Not found
    }
    console.error("Error fetching project fee:", error);
    throw new Error("Failed to fetch project fee");
  }

  return data ? rowToProjectFee(data as ProjectFeeRow) : null;
}

/**
 * Update project fee status
 */
export async function updateProjectFeeStatus(
  feeId: string,
  status: "pending" | "completed" | "cancelled",
  paymentRequestId?: string | null,
): Promise<void> {
  const supabase = getServerSupabaseClient();
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (paymentRequestId !== undefined) {
    updateData.payment_request_id = paymentRequestId;
  }

  const { error } = await supabase.from("project_fees").update(updateData).eq("id", feeId);

  if (error) {
    console.error("Error updating project fee status:", error);
    throw new Error("Failed to update project fee status");
  }
}

/**
 * Link a completed payment to a fee and create transaction record
 */
export async function linkPaymentToFee(
  feeId: string,
  paymentRequestId: string,
  invoiceNumber: number | null,
  stripePaymentIntentId?: string | null,
): Promise<void> {
  const fee = await getProjectFeeById(feeId);
  if (!fee) {
    throw new Error("Fee not found");
  }

  // Update fee status to completed
  await updateProjectFeeStatus(feeId, "completed", paymentRequestId);

  // Create transaction record
  await createProjectFeeTransaction({
    projectFeeId: feeId,
    paymentRequestId,
    stripePaymentIntentId: stripePaymentIntentId || null,
    amount: fee.amount,
    invoiceNumber,
  });
}

/**
 * Stop a project subscription (only superadmin)
 * Cancels the Stripe subscription if it exists
 * Checks if there's a pending payment request first
 */
export async function stopProjectSubscription(
  subscriptionId: string,
  stoppedByClerkUserId: string,
): Promise<void> {
  const supabase = getServerSupabaseClient();

  // Get subscription to check for Stripe subscription ID and payment status
  const subscription = await getProjectSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Check if there's a pending payment request (payment in progress)
  if (subscription.paymentRequestId) {
    const { getPaymentRequestById } = await import("./payments");
    const paymentRequest = await getPaymentRequestById(subscription.paymentRequestId);

    // If payment request exists and is still pending/invoiced, payment hasn't completed yet
    if (
      paymentRequest &&
      (paymentRequest.status === "pending" || paymentRequest.status === "invoiced")
    ) {
      throw new Error(
        "Cannot stop subscription while payment is in progress. Please wait for payment to complete or cancel the payment first.",
      );
    }
  }

  // Cancel Stripe subscription if it exists
  if (subscription.stripeSubscriptionId) {
    try {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      // Cancel the subscription at period end (don't cancel immediately to avoid refunding)
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch (stripeError: any) {
      console.error("Error cancelling Stripe subscription:", stripeError);
      // Continue with database update even if Stripe cancellation fails
    }
  }

  // Update database
  const { error } = await supabase
    .from("project_subscriptions")
    .update({
      status: "stopped",
      stopped_by_clerk_user_id: stoppedByClerkUserId,
      stopped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error stopping project subscription:", error);
    throw new Error("Failed to stop project subscription");
  }
}

/**
 * Get fee transactions (billing history)
 */
export async function getProjectFeeTransactions(feeId: string): Promise<ProjectFeeTransaction[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fee_transactions")
    .select("*")
    .eq("project_fee_id", feeId)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching fee transactions:", error);
    throw new Error("Failed to fetch fee transactions");
  }

  return (data || []).map(rowToProjectFeeTransaction);
}

/**
 * Get subscription transactions (billing history)
 */
export async function getProjectSubscriptionTransactions(
  subscriptionId: string,
): Promise<ProjectSubscriptionTransaction[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscription_transactions")
    .select("*")
    .eq("project_subscription_id", subscriptionId)
    .order("transaction_date", { ascending: false });

  if (error) {
    console.error("Error fetching subscription transactions:", error);
    throw new Error("Failed to fetch subscription transactions");
  }

  return (data || []).map(rowToProjectSubscriptionTransaction);
}

/**
 * Create a fee transaction record
 */
export async function createProjectFeeTransaction(params: {
  projectFeeId: string;
  paymentRequestId?: string | null;
  stripePaymentIntentId?: string | null;
  amount: number;
  invoiceNumber?: number | null;
}): Promise<ProjectFeeTransaction> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fee_transactions")
    .insert({
      project_fee_id: params.projectFeeId,
      payment_request_id: params.paymentRequestId || null,
      stripe_payment_intent_id: params.stripePaymentIntentId || null,
      amount: params.amount,
      invoice_number: params.invoiceNumber || null,
      transaction_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating fee transaction:", error);
    throw new Error("Failed to create fee transaction");
  }

  return rowToProjectFeeTransaction(data as ProjectFeeTransactionRow);
}

/**
 * Create a subscription transaction record
 */
export async function createProjectSubscriptionTransaction(params: {
  projectSubscriptionId: string;
  paymentRequestId?: string | null;
  stripePaymentIntentId?: string | null;
  amount: number;
  invoiceNumber?: number | null;
  billingPeriodStart?: string | null;
  billingPeriodEnd?: string | null;
}): Promise<ProjectSubscriptionTransaction> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscription_transactions")
    .insert({
      project_subscription_id: params.projectSubscriptionId,
      payment_request_id: params.paymentRequestId || null,
      stripe_payment_intent_id: params.stripePaymentIntentId || null,
      amount: params.amount,
      invoice_number: params.invoiceNumber || null,
      billing_period_start: params.billingPeriodStart || null,
      billing_period_end: params.billingPeriodEnd || null,
      transaction_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating subscription transaction:", error);
    throw new Error("Failed to create subscription transaction");
  }

  return rowToProjectSubscriptionTransaction(data as ProjectSubscriptionTransactionRow);
}

/**
 * Update subscription billing dates after successful payment
 */
export async function updateSubscriptionBillingDates(
  subscriptionId: string,
  lastBilledDate: string,
  nextBillingDate?: string,
): Promise<void> {
  const supabase = getServerSupabaseClient();

  // If nextBillingDate not provided, calculate it based on subscription's billing interval
  let calculatedNextBillingDate = nextBillingDate;
  if (!calculatedNextBillingDate) {
    const subscription = await getProjectSubscriptionById(subscriptionId);
    if (subscription) {
      const nextDate = calculateNextBillingDate(
        subscription.billingInterval,
        new Date(lastBilledDate),
        {
          dayOfMonth: subscription.billingDayOfMonth ?? undefined,
          dayOfWeek: subscription.billingDayOfWeek ?? undefined,
        },
      );
      calculatedNextBillingDate = nextDate.toISOString();
    } else {
      const nextDate = calculateNextBillingDate("monthly", new Date(lastBilledDate));
      calculatedNextBillingDate = nextDate.toISOString();
    }
  }

  const { error } = await supabase
    .from("project_subscriptions")
    .update({
      last_billed_date: lastBilledDate,
      next_billing_date: calculatedNextBillingDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    console.error("Error updating subscription billing dates:", error);
    throw new Error("Failed to update subscription billing dates");
  }
}

/**
 * Link a completed payment to a subscription and create transaction record
 * Also creates a Stripe Subscription for automatic monthly billing
 * Only proceeds if payment is actually completed (has invoice number)
 */
export async function linkPaymentToSubscription(
  subscriptionId: string,
  paymentRequestId: string,
  invoiceNumber: number | null,
  stripePaymentIntentId?: string | null,
): Promise<void> {
  const subscription = await getProjectSubscriptionById(subscriptionId);
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Verify payment actually completed - must have invoice number and payment request must be completed
  const { getPaymentRequestById } = await import("./payments");
  const paymentRequest = await getPaymentRequestById(paymentRequestId);

  if (!paymentRequest) {
    throw new Error("Payment request not found");
  }

  // Only proceed if payment is actually completed with an invoice
  if (paymentRequest.status !== "completed" || !invoiceNumber) {
    return; // Don't throw error, just skip - payment might be in progress
  }

  // Check if subscription already has a Stripe subscription (don't create duplicate)
  if (subscription.stripeSubscriptionId) {
    // Check if transaction already exists for this payment request
    const supabase = getServerSupabaseClient();
    const { data: existingTransaction } = await supabase
      .from("project_subscription_transactions")
      .select("id")
      .eq("project_subscription_id", subscriptionId)
      .eq("payment_request_id", paymentRequestId)
      .maybeSingle();

    // Only create transaction if it doesn't already exist
    if (!existingTransaction) {
      const now = new Date();
      // Set billing start to start of today (midnight UTC) for consistency with Stripe
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
      );
      const nextBillingDate = calculateNextBillingDate(
        subscription.billingInterval || "monthly",
        todayStart,
        {
          dayOfMonth: subscription.billingDayOfMonth ?? undefined,
          dayOfWeek: subscription.billingDayOfWeek ?? undefined,
        },
      );

      await updateSubscriptionBillingDates(
        subscriptionId,
        todayStart.toISOString(),
        nextBillingDate.toISOString(),
      );

      await createProjectSubscriptionTransaction({
        projectSubscriptionId: subscriptionId,
        paymentRequestId,
        stripePaymentIntentId: stripePaymentIntentId || null,
        amount: subscription.amount,
        invoiceNumber,
        billingPeriodStart: todayStart.toISOString(),
        billingPeriodEnd: nextBillingDate.toISOString(),
      });
    }
    return;
  }

  // Verify payment request has Stripe customer and payment method
  // If missing, try to get from payment intent or saved payment methods
  let customerId = paymentRequest.stripe_customer_id;
  let paymentMethodId = paymentRequest.stripe_payment_method_id;

  // If missing and this is an account-based payment, try saved payment methods
  if ((!customerId || !paymentMethodId) && paymentRequest.user_id) {
    const { getDefaultPaymentMethod } = await import("./payments");
    const defaultMethod = await getDefaultPaymentMethod({ userId: paymentRequest.user_id });
    if (defaultMethod) {
      customerId = defaultMethod.stripeCustomerId;
      paymentMethodId = defaultMethod.stripePaymentMethodId;
    }
  }

  if (!customerId || !paymentMethodId) {
    // First, try refreshing the payment request in case it was just updated
    const refreshedPaymentRequest = await getPaymentRequestById(paymentRequestId);
    if (refreshedPaymentRequest) {
      customerId = refreshedPaymentRequest.stripe_customer_id || customerId;
      paymentMethodId = refreshedPaymentRequest.stripe_payment_method_id || paymentMethodId;
    }

    // If still missing, try to get from payment intent
    if ((!customerId || !paymentMethodId) && stripePaymentIntentId) {
      try {
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

        if (!customerId && paymentIntent.customer) {
          customerId = paymentIntent.customer as string;
        }
        if (!paymentMethodId && paymentIntent.payment_method) {
          paymentMethodId = paymentIntent.payment_method as string;
        }

        // Update the payment request with the Stripe info if we found it
        if (customerId && paymentMethodId) {
          const { updatePaymentRequestStripeInfo } = await import("./payments");
          await updatePaymentRequestStripeInfo(paymentRequest.id, customerId, paymentMethodId);
        }
      } catch (err) {
        console.error("Error retrieving payment intent:", err);
      }
    }

    if (!customerId || !paymentMethodId) {
      throw new Error(
        "Payment request missing Stripe customer or payment method - payment may not be complete",
      );
    }
  }

  // Create Stripe Subscription for automatic monthly billing
  // Set billing_cycle_anchor to today so subscription starts immediately
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Calculate next billing date based on subscription's billing interval
  const now = new Date();
  // Set billing cycle anchor to start of today (midnight UTC) for consistency with Stripe
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const nextBillingDate = calculateNextBillingDate(
    subscription.billingInterval || "monthly",
    todayStart,
    {
      dayOfMonth: subscription.billingDayOfMonth ?? undefined,
      dayOfWeek: subscription.billingDayOfWeek ?? undefined,
    },
  );

  // Create or get price for this subscription amount (in cents)
  const amountInCents = Math.round(subscription.amount * 100);

  // Create a Stripe Subscription with monthly billing
  // Set billing_cycle_anchor to start of today so the subscription starts immediately
  // Map billing interval to Stripe interval
  const stripeInterval =
    subscription.billingInterval === "daily"
      ? "day"
      : subscription.billingInterval === "weekly"
        ? "week"
        : "month";

  const stripeSubscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: subscription.name,
          },
          unit_amount: amountInCents,
          recurring: {
            interval: stripeInterval,
          },
        } as any,
      },
    ],
    default_payment_method: paymentMethodId,
    billing_cycle_anchor: Math.floor(todayStart.getTime() / 1000), // Unix timestamp - start today at midnight
    metadata: {
      project_subscription_id: subscriptionId,
      project_id: subscription.projectId,
      company_id: subscription.companyId,
    },
  });

  // Update subscription billing dates (first payment was just completed, billing starts today)
  await updateSubscriptionBillingDates(
    subscriptionId,
    todayStart.toISOString(),
    nextBillingDate.toISOString(),
  );

  // Update subscription with Stripe subscription ID and payment request ID
  const supabase = getServerSupabaseClient();
  await supabase
    .from("project_subscriptions")
    .update({
      payment_request_id: paymentRequestId,
      stripe_subscription_id: stripeSubscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  // Create transaction record for first payment
  await createProjectSubscriptionTransaction({
    projectSubscriptionId: subscriptionId,
    paymentRequestId,
    stripePaymentIntentId: stripePaymentIntentId || null,
    amount: subscription.amount,
    invoiceNumber,
    billingPeriodStart: todayStart.toISOString(),
    billingPeriodEnd: nextBillingDate.toISOString(),
  });
}

/**
 * Get fee by payment request ID
 */
export async function getFeeByPaymentRequestId(
  paymentRequestId: string,
): Promise<ProjectFee | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_fees")
    .select("*")
    .eq("payment_request_id", paymentRequestId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching fee by payment request ID:", error);
    return null;
  }

  return data ? rowToProjectFee(data as ProjectFeeRow) : null;
}

/**
 * Keep project_subscriptions in sync when a linked payment request is edited.
 * Billing and the admin UI read amount/next_billing_date from project_subscriptions.
 */
export async function syncProjectSubscriptionFromPaymentRequestUpdate(
  paymentRequestId: string,
  updates: { amount?: number; next_billing_date?: string | null },
): Promise<void> {
  const subscription = await getSubscriptionByPaymentRequestId(paymentRequestId);
  if (!subscription) return;

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.next_billing_date !== undefined)
    payload.next_billing_date = updates.next_billing_date;

  if (Object.keys(payload).length <= 1) return;

  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from("project_subscriptions")
    .update(payload)
    .eq("id", subscription.id);

  if (error) {
    console.error("Error syncing subscription from payment request update:", error);
    throw new Error("Failed to sync subscription");
  }
}

/**
 * Get subscription by payment request ID
 */
export async function getSubscriptionByPaymentRequestId(
  paymentRequestId: string,
): Promise<ProjectSubscription | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("payment_request_id", paymentRequestId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription by payment request ID:", error);
    return null;
  }

  return data ? rowToProjectSubscription(data as ProjectSubscriptionRow) : null;
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getProjectSubscriptionByStripeSubscriptionId(
  stripeSubscriptionId: string,
): Promise<ProjectSubscription | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_subscriptions")
    .select("*")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching subscription by Stripe subscription ID:", error);
    return null;
  }

  return data ? rowToProjectSubscription(data as ProjectSubscriptionRow) : null;
}

/**
 * Delete a project fee
 */
export async function deleteProjectFee(feeId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from("project_fees").delete().eq("id", feeId);

  if (error) {
    console.error("Error deleting project fee:", error);
    throw new Error("Failed to delete project fee");
  }
}

/**
 * Delete a project subscription
 */
export async function deleteProjectSubscription(subscriptionId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from("project_subscriptions").delete().eq("id", subscriptionId);

  if (error) {
    console.error("Error deleting project subscription:", error);
    throw new Error("Failed to delete project subscription");
  }
}

export type CompanyPaymentStatus = {
  allUpToDate: boolean;
  pendingFees: number;
  overdueSubscriptions: number;
  /** Active bills (Billing tab) past due — blocks authorization after grace period */
  overdueBills: number;
  maxDaysOverdue: number;
};

/**
 * Check if company has any overdue payments.
 * maxDaysOverdue = the highest number of days any single fee/subscription/bill has been overdue (0 if none).
 */
export async function getCompanyPaymentStatus(companyId: string): Promise<CompanyPaymentStatus> {
  const { fetchCompanyPaymentStatusFast } = await import("@/lib/admin-db-rpc");
  const fast = await fetchCompanyPaymentStatusFast(companyId);
  if (fast) return fast;

  const fees = await getCompanyFees(companyId);
  const subscriptions = await getCompanySubscriptions(companyId);

  const now = new Date();
  const msPerDay = 86_400_000;

  const pendingFeesWithPr = fees.filter((f) => f.status === "pending" && f.paymentRequestId);
  const prIds = [...new Set(pendingFeesWithPr.map((f) => f.paymentRequestId!))];
  const prById = new Map<string, { status: string; next_billing_date?: string | null }>();
  if (prIds.length > 0) {
    const supabase = (await import("@/lib/supabase")).getServerSupabaseClient();
    const { data: prRows } = await supabase
      .from("payments_requests")
      .select("id, status, next_billing_date")
      .in("id", prIds);
    for (const pr of prRows || []) {
      prById.set(pr.id as string, {
        status: pr.status as string,
        next_billing_date: pr.next_billing_date as string | null,
      });
    }
  }

  let pendingFeesList = fees.filter((f) => f.status === "pending");
  for (const fee of pendingFeesList) {
    if (fee.paymentRequestId) {
      const pr = prById.get(fee.paymentRequestId);
      if (pr?.status === "completed") {
        await updateProjectFeeStatus(fee.id, "completed", fee.paymentRequestId);
        pendingFeesList = pendingFeesList.filter((f) => f.id !== fee.id);
      }
    }
  }
  const pendingFees = pendingFeesList.length;

  // Only count subscriptions we actually bill (no stripe_subscription_id). Stripe-billed
  // subscriptions are skipped by run billing, so counting them as overdue would show
  // "1 overdue" but "Run billing" would say "No due items to charge".
  const overdueSubsList = subscriptions.filter(
    (sub) =>
      sub.status === "active" &&
      !sub.stripeSubscriptionId &&
      sub.nextBillingDate &&
      new Date(sub.nextBillingDate) < now,
  );
  const overdueSubscriptions = overdueSubsList.length;

  let maxDaysOverdue = 0;

  for (const fee of pendingFeesList) {
    let dueTime: number;
    if (fee.paymentRequestId) {
      const pr = prById.get(fee.paymentRequestId);
      if (pr?.next_billing_date) {
        const due = new Date(pr.next_billing_date).getTime();
        if (due > now.getTime()) continue;
        dueTime = due;
      } else {
        dueTime = new Date(fee.createdAt).getTime();
      }
    } else {
      dueTime = new Date(fee.createdAt).getTime();
    }
    const days = Math.floor((now.getTime() - dueTime) / msPerDay);
    if (days > maxDaysOverdue) maxDaysOverdue = days;
  }
  for (const sub of overdueSubsList) {
    const days = Math.floor((now.getTime() - new Date(sub.nextBillingDate!).getTime()) / msPerDay);
    if (days > maxDaysOverdue) maxDaysOverdue = days;
  }

  // Standalone one-time payment requests (Admin → Payments): respect due date for days overdue
  const companyPaymentRequests = await getCompanyPaymentRequests(companyId);
  const pendingOneTime = companyPaymentRequests.filter(
    (pr) => pr.payment_type === "one_time" && (pr.status === "pending" || pr.status === "invoiced"),
  );
  for (const pr of pendingOneTime) {
    const dueTime = pr.next_billing_date
      ? new Date(pr.next_billing_date).getTime()
      : new Date(pr.created_at).getTime();
    if (dueTime > now.getTime()) continue; // not due yet
    const days = Math.floor((now.getTime() - dueTime) / msPerDay);
    if (days > maxDaysOverdue) maxDaysOverdue = days;
  }

  const hasOverdueOneTime = pendingOneTime.some((pr) => {
    const dueTime = pr.next_billing_date
      ? new Date(pr.next_billing_date).getTime()
      : new Date(pr.created_at).getTime();
    return dueTime <= now.getTime();
  });

  const { getCompanyBillPaymentContribution } = await import("@/lib/bills");
  const { overdueBills, maxDaysOverdueFromBills } =
    await getCompanyBillPaymentContribution(companyId);
  if (maxDaysOverdueFromBills > maxDaysOverdue) {
    maxDaysOverdue = maxDaysOverdueFromBills;
  }

  return {
    allUpToDate:
      pendingFees === 0 && overdueSubscriptions === 0 && !hasOverdueOneTime && overdueBills === 0,
    pendingFees,
    overdueSubscriptions,
    overdueBills,
    maxDaysOverdue,
  };
}
