import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/permissions';
import { getServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && (!dbUser || dbUser.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = getServerSupabaseClient();

    // Get payment requests, fees, and subscriptions in parallel where possible
    let paymentRequests: any[] = [];
    let fees: any[] = [];
    let subscriptions: any[] = [];

    if (!isSuperAdmin && dbUser?.company_id) {
      // For company admins: get user IDs first, then run payment requests + fees + subscriptions in parallel
      const { data: companyUsers, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('company_id', dbUser.company_id);

      if (usersError) {
        console.error('Error fetching company users:', usersError);
        return NextResponse.json({ error: 'Failed to fetch company users' }, { status: 500 });
      }

      const userIds = companyUsers?.map(u => u.id) || [];

      const paymentRequestsPromise = userIds.length > 0
        ? supabase
            .from('payments_requests')
            .select(`*, users ( email, first_name, last_name, company_id )`)
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null });

      const feesPromise = supabase
        .from('project_fees')
        .select(`id, name, amount, payment_request_id, project_id, status, projects ( id, title, company_id )`)
        .eq('company_id', dbUser.company_id);

      const subscriptionsPromise = supabase
        .from('project_subscriptions')
        .select(`id, name, amount, payment_request_id, project_id, status, last_billed_date, next_billing_date, billing_interval, projects ( id, title, company_id )`)
        .eq('company_id', dbUser.company_id);

      const [paymentRequestsRes, feesRes, subsRes] = await Promise.all([
        paymentRequestsPromise,
        feesPromise,
        subscriptionsPromise,
      ]);

      if (paymentRequestsRes.error) {
        console.error('Error fetching payment requests:', paymentRequestsRes.error);
        return NextResponse.json({ error: 'Failed to fetch payment requests' }, { status: 500 });
      }
      paymentRequests = paymentRequestsRes.data || [];

      if (feesRes.error) console.error('Error fetching fees:', feesRes.error);
      fees = feesRes.data || [];

      if (subsRes.error) {
        if (subsRes.error.code === '42703' && subsRes.error.message?.includes('billing_interval')) {
          const { data: retrySubs, error: retryError } = await supabase
            .from('project_subscriptions')
            .select(`id, name, amount, payment_request_id, project_id, status, last_billed_date, next_billing_date, projects ( id, title, company_id )`)
            .eq('company_id', dbUser.company_id);
          if (!retryError) subscriptions = retrySubs || [];
        }
      } else {
        subscriptions = subsRes.data || [];
      }
    } else {
      // Super admin: run payment requests, fees, and subscriptions in parallel
      const paymentRequestsPromise = supabase
        .from('payments_requests')
        .select(`*, users ( email, first_name, last_name, company_id )`)
        .order('created_at', { ascending: false });

      const feesPromise = supabase
        .from('project_fees')
        .select(`id, name, amount, payment_request_id, project_id, status, projects ( id, title, company_id )`);

      const subscriptionsPromise = supabase
        .from('project_subscriptions')
        .select(`id, name, amount, payment_request_id, project_id, status, last_billed_date, next_billing_date, billing_interval, projects ( id, title, company_id )`);

      const [paymentRequestsRes, feesRes, subsRes] = await Promise.all([
        paymentRequestsPromise,
        feesPromise,
        subscriptionsPromise,
      ]);

      if (paymentRequestsRes.error) {
        console.error('Error fetching payment requests:', paymentRequestsRes.error);
        return NextResponse.json({ error: 'Failed to fetch payment requests' }, { status: 500 });
      }
      paymentRequests = paymentRequestsRes.data || [];

      if (feesRes.error) console.error('Error fetching fees:', feesRes.error);
      fees = feesRes.data || [];

      if (subsRes.error) {
        if (subsRes.error.code === '42703' && subsRes.error.message?.includes('billing_interval')) {
          const { data: retrySubs, error: retryError } = await supabase
            .from('project_subscriptions')
            .select(`id, name, amount, payment_request_id, project_id, status, last_billed_date, next_billing_date, projects ( id, title, company_id )`);
          if (!retryError) subscriptions = retrySubs || [];
        }
      } else {
        subscriptions = subsRes.data || [];
      }
    }


    // Create maps for quick lookup
    const feeMap = new Map();
    const subscriptionMap = new Map();

    if (fees) {
      fees.forEach(fee => {
        if (fee.payment_request_id) {
          feeMap.set(fee.payment_request_id, {
            name: fee.name,
            project: fee.projects,
            type: 'fee'
          });
        }
      });
    }

    if (subscriptions) {
      subscriptions.forEach(sub => {
        if (sub.payment_request_id) {
          subscriptionMap.set(sub.payment_request_id, {
            name: sub.name,
            project: sub.projects,
            type: 'subscription',
            billingInterval: sub.billing_interval || 'monthly'
          });
        }
      });
    }

    // Enrich payment requests with project information
    const enrichedPayments = (paymentRequests || []).map((payment: any) => {
      const feeInfo = feeMap.get(payment.id);
      const subInfo = subscriptionMap.get(payment.id);

      return {
        ...payment,
        project: feeInfo?.project || subInfo?.project || null,
        projectItemName: feeInfo?.name || subInfo?.name || null,
        projectItemType: feeInfo?.type || subInfo?.type || null,
        billingInterval: subInfo?.billingInterval || null,
      };
    });

    // Payment request IDs that are already represented by a subscription or fee row (don't show again as standalone)
    const subscriptionPaymentRequestIds = new Set(
      (subscriptions || []).filter((sub: any) => sub.payment_request_id).map((sub: any) => sub.payment_request_id)
    );
    const feePaymentRequestIds = new Set(
      (fees || []).filter((fee: any) => fee.payment_request_id).map((fee: any) => fee.payment_request_id)
    );
    const linkedPaymentRequestIds = new Set([...subscriptionPaymentRequestIds, ...feePaymentRequestIds]);

    // Get payment request details for subscriptions
    const subscriptionPaymentRequestIdsArray = Array.from(subscriptionPaymentRequestIds);
    let subscriptionPaymentRequests: any[] = [];
    if (subscriptionPaymentRequestIdsArray.length > 0) {
      const { data: subPaymentRequests } = await supabase
        .from('payments_requests')
        .select('*')
        .in('id', subscriptionPaymentRequestIdsArray);

      subscriptionPaymentRequests = subPaymentRequests || [];
    }

    // Create a map of payment requests for subscriptions
    const subscriptionPaymentRequestMap = new Map();
    subscriptionPaymentRequests.forEach((pr: any) => {
      subscriptionPaymentRequestMap.set(pr.id, pr);
    });

    // Create a set of payment request IDs that are already shown as payments
    const paymentRequestIdsInPayments = new Set((paymentRequests || []).map((p: any) => p.id));

    // Normalize project relation (Supabase may return as object or array, key may be projects or project)
    const getProject = (row: any) => {
      const rel = row?.projects ?? row?.project ?? null;
      if (Array.isArray(rel) && rel.length > 0) return rel[0];
      return rel || null;
    };

    // Add ALL subscriptions as separate entries
    const allSubscriptions = (subscriptions || []).map((sub: any) => {
      const hasPaymentRequest = sub.payment_request_id && paymentRequestIdsInPayments.has(sub.payment_request_id);
      const paymentRequest = sub.payment_request_id ? subscriptionPaymentRequestMap.get(sub.payment_request_id) : null;

      const subscriptionData = {
        id: `subscription-${sub.id}`,
        isSubscription: true,
        subscriptionId: sub.id,
        projectItemName: sub.name ?? 'Subscription',
        project: getProject(sub),
        projectItemType: 'subscription',
        billingInterval: (sub as any).billing_interval || 'monthly',
        amount: sub.amount || 0,
        status: paymentRequest?.status || sub.status || 'active',
        created_at: sub.created_at,
        stripe_payment_method_id: paymentRequest?.stripe_payment_method_id || null,
        stripe_customer_id: paymentRequest?.stripe_customer_id || null,
        payment_type: 'monthly',
        recipient_name: paymentRequest?.recipient_name || sub.name || 'Subscription',
        recipient_email: paymentRequest?.recipient_email || '',
        payment_request_id: sub.payment_request_id || null,
        next_billing_date: sub.next_billing_date || null,
        last_billed_date: sub.last_billed_date || null,
      };
      
      return subscriptionData;
    });

    // Use the SAME data source as super admin subscriptions tab
    // Primary source: project_subscriptions and project_fees (not payments_requests)
    const allPayments: any[] = [];

    // First, add all subscriptions (they are the primary source)
    allSubscriptions.forEach((sub: any) => {
      allPayments.push(sub);
    });

    // Second, add all fees (they are also primary source)
    if (fees) {
      fees.forEach((fee: any) => {
        // Get payment request info if linked
        const linkedPaymentRequest = fee.payment_request_id 
          ? enrichedPayments.find((p: any) => p.id === fee.payment_request_id)
          : null;

        allPayments.push({
          id: `fee-${fee.id}`,
          isFee: true,
          feeId: fee.id,
          projectItemName: fee.name ?? 'Fee',
          project: getProject(fee),
          projectItemType: 'fee',
          amount: fee.amount,
          status: linkedPaymentRequest?.status || fee.status || 'pending',
          created_at: fee.created_at || new Date().toISOString(),
          stripe_payment_method_id: linkedPaymentRequest?.stripe_payment_method_id || null,
          stripe_customer_id: linkedPaymentRequest?.stripe_customer_id || null,
          payment_type: 'one_time',
          recipient_name: linkedPaymentRequest?.recipient_name || fee.name,
          recipient_email: linkedPaymentRequest?.recipient_email || '',
          payment_request_id: fee.payment_request_id || null,
        });
      });
    }

    // Finally, add only standalone payment requests (not linked to any subscription or fee)
    enrichedPayments.forEach((payment: any) => {
      if (linkedPaymentRequestIds.has(payment.id)) return; // already shown as subscription or fee above
      allPayments.push(payment);
    });

    return NextResponse.json({ payments: allPayments });
  } catch (error) {
    console.error('Error fetching payments with projects:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}

