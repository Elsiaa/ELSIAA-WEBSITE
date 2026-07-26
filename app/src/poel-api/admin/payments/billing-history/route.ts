import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/permissions';
import { dedupeBillingHistoryRows, fetchCompanyBillingHistoryRpc } from '@/lib/admin-db-rpc';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * GET /api/admin/payments/billing-history
 * Returns all fee + subscription transactions for the current user's company.
 * Company admin: their company only. Super admin: all (optional ?companyId=).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && !(dbUser && dbUser.role === 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const companyIdParam = searchParams.get('companyId');
    let companyId: string | null = null;

    if (isSuperAdmin && companyIdParam) {
      companyId = companyIdParam;
    } else if (dbUser?.company_id) {
      companyId = dbUser.company_id;
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company context required' }, { status: 400 });
    }

    const rpcRows = await fetchCompanyBillingHistoryRpc(companyId);
    if (rpcRows) {
      return NextResponse.json({ transactions: dedupeBillingHistoryRows(rpcRows) });
    }

    const supabase = getServerSupabaseClient();

    const { data: companyFees } = await supabase
      .from('project_fees')
      .select('id, name, project_id, company_id')
      .eq('company_id', companyId);
    const { data: companySubs } = await supabase
      .from('project_subscriptions')
      .select('id, name, project_id, company_id')
      .eq('company_id', companyId);

    const feeIds = (companyFees || []).map((f: { id: string }) => f.id);
    const subIds = (companySubs || []).map((s: { id: string }) => s.id);
    const feeMap = new Map((companyFees || []).map((f: any) => [f.id, f]));
    const subMap = new Map((companySubs || []).map((s: any) => [s.id, s]));

    let feeTransactions: any[] = [];
    let subscriptionTransactions: any[] = [];

    if (feeIds.length > 0) {
      const { data, error } = await supabase
        .from('project_fee_transactions')
        .select('*')
        .in('project_fee_id', feeIds)
        .order('transaction_date', { ascending: false });
      if (!error) feeTransactions = data || [];
    }
    if (subIds.length > 0) {
      const { data, error } = await supabase
        .from('project_subscription_transactions')
        .select('*')
        .in('project_subscription_id', subIds)
        .order('transaction_date', { ascending: false });
      if (!error) subscriptionTransactions = data || [];
    }

    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, title, company_id')
      .in('id', [...new Set([...(companyFees || []).map((f: any) => f.project_id), ...(companySubs || []).map((s: any) => s.project_id)])]);
    const projectMap = new Map((projectsData || []).map((p: any) => [p.id, p]));

    const allTransactions: any[] = [];

    feeTransactions.forEach((tx: any) => {
      const fee = feeMap.get(tx.project_fee_id);
      const project = projectMap.get(fee?.project_id);
      allTransactions.push({
        id: tx.id,
        type: 'fee',
        feeId: tx.project_fee_id,
        subscriptionId: null,
        feeName: fee?.name || 'Fee',
        subscriptionName: null,
        projectId: fee?.project_id || null,
        projectTitle: project?.title || 'Unknown Project',
        companyId: fee?.company_id || null,
        companyName: null,
        amount: parseFloat(tx.amount.toString()),
        invoiceNumber: tx.invoice_number,
        paymentRequestId: tx.payment_request_id,
        stripePaymentIntentId: tx.stripe_payment_intent_id,
        transactionDate: tx.transaction_date,
        billingPeriodStart: null,
        billingPeriodEnd: null,
        createdAt: tx.created_at,
      });
    });

    subscriptionTransactions.forEach((tx: any) => {
      const sub = subMap.get(tx.project_subscription_id);
      const project = projectMap.get(sub?.project_id);
      allTransactions.push({
        id: tx.id,
        type: 'subscription',
        feeId: null,
        subscriptionId: tx.project_subscription_id,
        feeName: null,
        subscriptionName: sub?.name || 'Subscription',
        projectId: sub?.project_id || null,
        projectTitle: project?.title || 'Unknown Project',
        companyId: sub?.company_id || null,
        companyName: null,
        amount: parseFloat(tx.amount.toString()),
        invoiceNumber: tx.invoice_number,
        paymentRequestId: tx.payment_request_id,
        stripePaymentIntentId: tx.stripe_payment_intent_id,
        transactionDate: tx.transaction_date,
        billingPeriodStart: tx.billing_period_start,
        billingPeriodEnd: tx.billing_period_end,
        createdAt: tx.created_at,
      });
    });

    allTransactions.sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    // Deduplicate: same charge can be recorded as both a fee and a subscription when a payment
    // request is linked to both. Prefer subscription row (has billing period); drop fee duplicate.
    const subscriptionChargeKeys = new Set<string>();
    allTransactions.forEach((tx) => {
      if (tx.type !== 'subscription') return;
      if (tx.paymentRequestId && tx.stripePaymentIntentId) {
        subscriptionChargeKeys.add(
          `${tx.paymentRequestId}:${tx.stripePaymentIntentId}:${tx.amount}:${tx.transactionDate}`
        );
      }
    });
    const transactions = allTransactions.filter((tx) => {
      if (tx.type !== 'fee') return true;
      if (!tx.paymentRequestId || !tx.stripePaymentIntentId) return true;
      const key = `${tx.paymentRequestId}:${tx.stripePaymentIntentId}:${tx.amount}:${tx.transactionDate}`;
      return !subscriptionChargeKeys.has(key);
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Error fetching billing history:', error);
    return NextResponse.json({ error: 'Failed to fetch billing history' }, { status: 500 });
  }
}
