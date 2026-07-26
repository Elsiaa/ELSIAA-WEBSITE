import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireSuperAdmin } from '@/lib/permissions';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * Get all project fee and subscription transactions (central payment history for superadmin)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await requireSuperAdmin();

    const supabase = getServerSupabaseClient();

    // Get all fee transactions with related data (use left join to include transactions even if fee is deleted)
    const { data: feeTransactions, error: feeError } = await supabase
      .from('project_fee_transactions')
      .select(`
        *,
        project_fees:project_fee_id (
          id,
          name,
          project_id,
          company_id,
          projects (
            id,
            title,
            companies (
              id,
              name
            )
          )
        )
      `)
      .order('transaction_date', { ascending: false });

    if (feeError) {
      console.error('Error fetching fee transactions:', feeError);
    }

    // Get all subscription transactions with related data (use left join to include transactions even if subscription is deleted)
    const { data: subscriptionTransactions, error: subError } = await supabase
      .from('project_subscription_transactions')
      .select(`
        *,
        project_subscriptions:project_subscription_id (
          id,
          name,
          project_id,
          company_id,
          projects (
            id,
            title,
            companies (
              id,
              name
            )
          )
        )
      `)
      .order('transaction_date', { ascending: false });

    if (subError) {
      console.error('Error fetching subscription transactions:', subError);
    }

    // Combine and format transactions
    const allTransactions: any[] = [];

    (feeTransactions || []).forEach((tx: any) => {
      const fee = Array.isArray(tx.project_fees) ? tx.project_fees[0] : tx.project_fees;
      const project = Array.isArray(fee?.projects) ? fee.projects[0] : fee?.projects;
      const company = Array.isArray(project?.companies) ? project.companies[0] : project?.companies;
      
      // Include transaction even if fee/subscription was deleted (use fallback names)
      allTransactions.push({
        id: tx.id,
        type: 'fee',
        feeId: tx.project_fee_id,
        subscriptionId: null,
        feeName: fee?.name || 'Deleted Fee',
        subscriptionName: null,
        projectId: fee?.project_id || null,
        projectTitle: project?.title || 'Unknown Project',
        companyId: fee?.company_id || null,
        companyName: company?.name || 'Unknown Company',
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

    (subscriptionTransactions || []).forEach((tx: any) => {
      const sub = Array.isArray(tx.project_subscriptions) ? tx.project_subscriptions[0] : tx.project_subscriptions;
      const project = Array.isArray(sub?.projects) ? sub.projects[0] : sub?.projects;
      const company = Array.isArray(project?.companies) ? project.companies[0] : project?.companies;
      
      // Include transaction even if fee/subscription was deleted (use fallback names)
      allTransactions.push({
        id: tx.id,
        type: 'subscription',
        feeId: null,
        subscriptionId: tx.project_subscription_id,
        feeName: null,
        subscriptionName: sub?.name || 'Deleted Subscription',
        projectId: sub?.project_id || null,
        projectTitle: project?.title || 'Unknown Project',
        companyId: sub?.company_id || null,
        companyName: company?.name || 'Unknown Company',
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

    // Sort by transaction date (most recent first)
    allTransactions.sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );

    // Debug logging
    console.log('[PROJECT-TRANSACTIONS] Total transactions found:', allTransactions.length);
    console.log('[PROJECT-TRANSACTIONS] Transaction details:', allTransactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      feeName: tx.feeName,
      subscriptionName: tx.subscriptionName,
      amount: tx.amount,
      invoiceNumber: tx.invoiceNumber,
      transactionDate: tx.transactionDate,
      projectTitle: tx.projectTitle,
      companyName: tx.companyName,
      feeId: tx.feeId,
      subscriptionId: tx.subscriptionId
    })));

    return NextResponse.json({ transactions: allTransactions });
  } catch (error: any) {
    console.error('Error fetching project transactions:', error);
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

