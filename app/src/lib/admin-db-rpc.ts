/**
 * Batched Postgres RPCs for admin dashboard performance.
 */

import { getServerSupabaseClient } from "@/lib/supabase";
import type { CompanyPaymentStatus } from "@/lib/project-payments";

export type CompanyAdminStats = {
  companyId: string;
  users: number;
  projects: number;
  meetings: number;
};

export type BillingHistoryRpcRow = {
  id: string;
  type: "fee" | "subscription" | "bill" | "payment";
  feeId: string | null;
  subscriptionId: string | null;
  billId: string | null;
  chargeId: string | null;
  feeName: string | null;
  subscriptionName: string | null;
  billDescription: string | null;
  billRecipientName: string | null;
  paymentRecipientName?: string | null;
  paymentRecipientEmail?: string | null;
  paymentType?: string | null;
  projectId: string | null;
  projectTitle: string | null;
  companyId: string | null;
  companyName: string | null;
  amount: number;
  invoiceNumber: number | null;
  paymentRequestId: string | null;
  stripePaymentIntentId: string | null;
  transactionDate: string;
  billingPeriodStart: string | null;
  billingPeriodEnd: string | null;
  createdAt: string;
};

export type BillChargeSummary = {
  id: string;
  billId: string;
  invoiceNumber: number | null;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

function rpcAvailable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return true;
  const msg = (error.message || "").toLowerCase();
  return !(
    error.code === "PGRST202" ||
    msg.includes("could not find the function") ||
    msg.includes("does not exist")
  );
}

export async function fetchCompaniesAdminStats(
  companyIds: string[],
): Promise<Map<string, { users: number; projects: number; meetings: number }>> {
  const out = new Map<string, { users: number; projects: number; meetings: number }>();
  if (companyIds.length === 0) return out;

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_companies_admin_stats", {
    p_company_ids: companyIds,
  });

  if (!rpcAvailable(error) || !Array.isArray(data)) {
    return out;
  }

  for (const row of data as CompanyAdminStats[]) {
    out.set(row.companyId, {
      users: row.users ?? 0,
      projects: row.projects ?? 0,
      meetings: row.meetings ?? 0,
    });
  }
  return out;
}

export async function fetchCompanyPaymentStatusFast(
  companyId: string,
): Promise<CompanyPaymentStatus | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_company_payment_status_fast", {
    p_company_id: companyId,
  });

  if (!rpcAvailable(error) || data == null || typeof data !== "object") {
    return null;
  }

  const s = data as Record<string, unknown>;
  return {
    allUpToDate: Boolean(s.allUpToDate),
    pendingFees: Number(s.pendingFees) || 0,
    overdueSubscriptions: Number(s.overdueSubscriptions) || 0,
    overdueBills: Number(s.overdueBills) || 0,
    maxDaysOverdue: Number(s.maxDaysOverdue) || 0,
  };
}

export async function fetchCompanyBillingHistoryRpc(
  companyId: string,
  limit = 250,
): Promise<BillingHistoryRpcRow[] | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_company_billing_history", {
    p_company_id: companyId,
    p_limit: limit,
  });

  if (!rpcAvailable(error) || !Array.isArray(data)) {
    return null;
  }
  return data as BillingHistoryRpcRow[];
}

export type FeesSubscriptionsByCompany = Record<
  string,
  {
    feesByProject: Record<string, unknown[]>;
    subscriptionsByProject: Record<string, unknown[]>;
  }
>;

export async function fetchFeesSubscriptionsByCompanies(
  companyIds: string[],
): Promise<FeesSubscriptionsByCompany | null> {
  if (companyIds.length === 0) return {};

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_fees_subscriptions_by_companies", {
    p_company_ids: companyIds,
  });

  if (!rpcAvailable(error) || data == null || typeof data !== "object") {
    return null;
  }
  return data as FeesSubscriptionsByCompany;
}

export type ListAdminBillsRpcResult = {
  bills: Record<string, unknown>[];
  chargesByBillId: Record<string, BillChargeSummary[]>;
};

export async function fetchListAdminBillsWithCharges(
  companyId: string | null,
  chargeLimit = 12,
): Promise<ListAdminBillsRpcResult | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("list_admin_bills_with_charges", {
    p_company_id: companyId,
    p_charge_limit: chargeLimit,
  });

  if (!rpcAvailable(error) || data == null || typeof data !== "object") {
    return null;
  }

  const payload = data as { bills?: unknown; chargesByBillId?: unknown };
  const bills = Array.isArray(payload.bills) ? (payload.bills as Record<string, unknown>[]) : [];
  const chargesRaw =
    payload.chargesByBillId && typeof payload.chargesByBillId === "object"
      ? (payload.chargesByBillId as Record<string, BillChargeSummary[]>)
      : {};

  return { bills, chargesByBillId: chargesRaw };
}

/** Deduplicate fee rows that duplicate subscription charges (same as billing-history route). */
export function dedupeBillingHistoryRows(rows: BillingHistoryRpcRow[]): BillingHistoryRpcRow[] {
  const subscriptionChargeKeys = new Set<string>();
  for (const tx of rows) {
    if (tx.type !== "subscription") continue;
    if (tx.paymentRequestId && tx.stripePaymentIntentId) {
      subscriptionChargeKeys.add(
        `${tx.paymentRequestId}:${tx.stripePaymentIntentId}:${tx.amount}:${tx.transactionDate}`,
      );
    }
  }
  const afterFeeSubDedupe = rows.filter((tx) => {
    if (tx.type !== "fee") return true;
    if (!tx.paymentRequestId || !tx.stripePaymentIntentId) return true;
    const key = `${tx.paymentRequestId}:${tx.stripePaymentIntentId}:${tx.amount}:${tx.transactionDate}`;
    return !subscriptionChargeKeys.has(key);
  });

  const projectChargePaymentIds = new Set<string>();
  for (const tx of afterFeeSubDedupe) {
    if (tx.type === "fee" || tx.type === "subscription") {
      if (tx.paymentRequestId) projectChargePaymentIds.add(tx.paymentRequestId);
    }
  }

  return afterFeeSubDedupe.filter((tx) => {
    if (tx.type !== "payment" || !tx.paymentRequestId) return true;
    return !projectChargePaymentIds.has(tx.paymentRequestId);
  });
}

export async function fetchAdminBillingHistoryRpc(
  limit = 500,
): Promise<BillingHistoryRpcRow[] | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("get_admin_billing_history", {
    p_limit: limit,
  });

  if (!rpcAvailable(error) || !Array.isArray(data)) {
    return null;
  }
  return dedupeBillingHistoryRows(data as BillingHistoryRpcRow[]);
}
