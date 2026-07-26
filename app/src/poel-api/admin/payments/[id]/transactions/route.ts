import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getCurrentUser } from '@/lib/permissions';
import { getProjectSubscriptionTransactions, getProjectFeeTransactions } from '@/lib/project-payments';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await getCurrentUser();
    if (!dbUser || dbUser.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { id } = await context.params;
    
    // Check if it's a subscription ID, fee ID, or payment request ID
    const isSubscriptionId = id.startsWith('subscription-');
    const isFeeId = id.startsWith('fee-');
    const subscriptionId = isSubscriptionId ? id.replace('subscription-', '') : null;
    const feeIdFromPayment = isFeeId ? id.replace('fee-', '') : null;
    const paymentRequestId = !isSubscriptionId && !isFeeId ? id : null;

    if (subscriptionId) {
      // Get subscription transactions
      const transactions = await getProjectSubscriptionTransactions(subscriptionId);
      return NextResponse.json({ transactions });
    }

    if (feeIdFromPayment) {
      // Get fee transactions
      const transactions = await getProjectFeeTransactions(feeIdFromPayment);
      return NextResponse.json({ transactions });
    }

    // For payment requests, check if it's linked to a fee or subscription
    const supabase = getServerSupabaseClient();
    
    // Check for linked subscription
    const { data: subscription } = await supabase
      .from('project_subscriptions')
      .select('id')
      .eq('payment_request_id', paymentRequestId)
      .maybeSingle();

    if (subscription) {
      const transactions = await getProjectSubscriptionTransactions(subscription.id);
      return NextResponse.json({ transactions });
    }

    // Check for linked fee
    const { data: fee } = await supabase
      .from('project_fees')
      .select('id')
      .eq('payment_request_id', paymentRequestId)
      .maybeSingle();

    if (fee) {
      const transactions = await getProjectFeeTransactions(fee.id);
      return NextResponse.json({ transactions });
    }

    // No transactions found
    return NextResponse.json({ transactions: [] });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

