import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireCompanyAdmin, getCurrentUser } from '@/lib/permissions';
import { getProjectSubscriptionById } from '@/lib/project-payments';
import { getProjectById } from '@/lib/projects';
import { createPaymentRequest } from '@/lib/payments';
import { getServerSupabaseClient } from '@/lib/supabase';

/**
 * Create a payment request for a project subscription (first payment)
 * Company admins can initiate payment for their subscriptions
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; subscriptionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, subscriptionId } = await context.params;
    
    // Verify project exists and user has access
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user is company admin for this company
    await requireCompanyAdmin(project.companyId);

    // Get the subscription
    const subscription = await getProjectSubscriptionById(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Get current user for recipient info
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create payment request linked to this subscription (monthly recurring)
    const paymentRequest = await createPaymentRequest({
      userId: currentUser.id,
      recipientEmail: currentUser.email,
      recipientName: `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.email,
      amount: subscription.amount,
      createdByClerkUserId: userId,
      paymentType: 'monthly',
      nextBillingDate: subscription.nextBillingDate || undefined,
    });

    // Link payment request to subscription
    const supabase = getServerSupabaseClient();
    await supabase
      .from('project_subscriptions')
      .update({
        payment_request_id: paymentRequest.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    return NextResponse.json({ 
      paymentRequest,
      paymentUrl: `/payments?public_token=${paymentRequest.public_token}`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment request for subscription:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create payment request' }, { status: 500 });
  }
}

