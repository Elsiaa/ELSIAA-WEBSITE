import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/permissions";
import { fetchAdminBillingHistoryRpc, type BillingHistoryRpcRow } from "@/lib/admin-db-rpc";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/admin/billing/history
 * Unified charge history for super-admin Billing tab (bills, payments, fees, subscriptions).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireSuperAdmin();

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 500, 1), 2000) : 500;

    const rpcRows = await fetchAdminBillingHistoryRpc(limit);
    if (rpcRows) {
      return NextResponse.json({ transactions: rpcRows });
    }

    const transactions = await fetchAdminBillingHistoryFallback(limit);
    return NextResponse.json({ transactions });
  } catch (error: unknown) {
    console.error("[admin/billing/history] GET", error);
    const message = error instanceof Error ? error.message : "Failed to fetch billing history";
    if (message.includes("Forbidden")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch billing history" }, { status: 500 });
  }
}

async function fetchAdminBillingHistoryFallback(limit: number): Promise<BillingHistoryRpcRow[]> {
  const supabase = getServerSupabaseClient();

  const [feeRes, subRes, billRes, paymentRes] = await Promise.all([
    supabase
      .from("project_fee_transactions")
      .select(
        `
        *,
        project_fees:project_fee_id (
          id, name, project_id, company_id,
          projects ( id, title, companies ( id, name ) )
        )
      `,
      )
      .order("transaction_date", { ascending: false })
      .limit(limit),
    supabase
      .from("project_subscription_transactions")
      .select(
        `
        *,
        project_subscriptions:project_subscription_id (
          id, name, project_id, company_id,
          projects ( id, title, companies ( id, name ) )
        )
      `,
      )
      .order("transaction_date", { ascending: false })
      .limit(limit),
    supabase
      .from("bill_charges")
      .select(
        `
        *,
        bills:bill_id (
          id, description, recipient_name, company_id,
          companies ( id, name )
        )
      `,
      )
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(limit),
    supabase
      .from("payments_requests")
      .select("*, users ( company_id, companies ( id, name ) )")
      .or("status.eq.completed,and(payment_type.eq.interval_billing,invoice_number.not.is.null)")
      .order("updated_at", { ascending: false })
      .limit(limit),
  ]);

  const rows: BillingHistoryRpcRow[] = [];

  for (const tx of feeRes.data || []) {
    const fee = Array.isArray(tx.project_fees) ? tx.project_fees[0] : tx.project_fees;
    const project = Array.isArray(fee?.projects) ? fee.projects[0] : fee?.projects;
    const company = Array.isArray(project?.companies) ? project.companies[0] : project?.companies;
    rows.push({
      id: tx.id,
      type: "fee",
      feeId: tx.project_fee_id,
      subscriptionId: null,
      billId: null,
      chargeId: null,
      feeName: fee?.name || "Fee",
      subscriptionName: null,
      billDescription: null,
      billRecipientName: null,
      projectId: fee?.project_id || null,
      projectTitle: project?.title || null,
      companyId: fee?.company_id || null,
      companyName: company?.name || null,
      amount: parseFloat(tx.amount.toString()),
      invoiceNumber: tx.invoice_number,
      paymentRequestId: tx.payment_request_id,
      stripePaymentIntentId: tx.stripe_payment_intent_id,
      transactionDate: tx.transaction_date,
      billingPeriodStart: null,
      billingPeriodEnd: null,
      createdAt: tx.created_at,
    });
  }

  for (const tx of subRes.data || []) {
    const sub = Array.isArray(tx.project_subscriptions)
      ? tx.project_subscriptions[0]
      : tx.project_subscriptions;
    const project = Array.isArray(sub?.projects) ? sub.projects[0] : sub?.projects;
    const company = Array.isArray(project?.companies) ? project.companies[0] : project?.companies;
    rows.push({
      id: tx.id,
      type: "subscription",
      feeId: null,
      subscriptionId: tx.project_subscription_id,
      feeName: null,
      subscriptionName: sub?.name || "Subscription",
      billDescription: null,
      billRecipientName: null,
      billId: null,
      chargeId: null,
      projectId: sub?.project_id || null,
      projectTitle: project?.title || null,
      companyId: sub?.company_id || null,
      companyName: company?.name || null,
      amount: parseFloat(tx.amount.toString()),
      invoiceNumber: tx.invoice_number,
      paymentRequestId: tx.payment_request_id,
      stripePaymentIntentId: tx.stripe_payment_intent_id,
      transactionDate: tx.transaction_date,
      billingPeriodStart: tx.billing_period_start,
      billingPeriodEnd: tx.billing_period_end,
      createdAt: tx.created_at,
    });
  }

  for (const bc of billRes.data || []) {
    const bill = Array.isArray(bc.bills) ? bc.bills[0] : bc.bills;
    const company = Array.isArray(bill?.companies) ? bill.companies[0] : bill?.companies;
    rows.push({
      id: bc.id,
      type: "bill",
      feeId: null,
      subscriptionId: null,
      billId: bc.bill_id,
      chargeId: bc.id,
      feeName: null,
      subscriptionName: null,
      billDescription: bill?.description || null,
      billRecipientName: bill?.recipient_name || null,
      projectId: null,
      projectTitle: null,
      companyId: bill?.company_id || null,
      companyName: company?.name || null,
      amount: parseFloat(bc.amount.toString()),
      invoiceNumber: bc.invoice_number,
      paymentRequestId: null,
      stripePaymentIntentId: bc.stripe_payment_intent_id,
      transactionDate: bc.paid_at || bc.created_at,
      billingPeriodStart: null,
      billingPeriodEnd: null,
      createdAt: bc.created_at,
    });
  }

  for (const pr of paymentRes.data || []) {
    const user = Array.isArray(pr.users) ? pr.users[0] : pr.users;
    const company = Array.isArray(user?.companies) ? user.companies[0] : user?.companies;
    rows.push({
      id: pr.id,
      type: "payment",
      feeId: null,
      subscriptionId: null,
      billId: null,
      chargeId: null,
      feeName: null,
      subscriptionName: null,
      billDescription: null,
      billRecipientName: pr.recipient_name,
      paymentRecipientName: pr.recipient_name,
      paymentRecipientEmail: pr.recipient_email,
      paymentType: pr.payment_type,
      projectId: null,
      projectTitle: null,
      companyId: user?.company_id || null,
      companyName: company?.name || null,
      amount: parseFloat(pr.amount.toString()),
      invoiceNumber: pr.invoice_number,
      paymentRequestId: pr.id,
      stripePaymentIntentId: null,
      transactionDate: pr.updated_at || pr.created_at,
      billingPeriodStart: null,
      billingPeriodEnd: null,
      createdAt: pr.created_at,
    });
  }

  rows.sort(
    (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime(),
  );

  const { dedupeBillingHistoryRows } = await import("@/lib/admin-db-rpc");
  return dedupeBillingHistoryRows(rows).slice(0, limit);
}
