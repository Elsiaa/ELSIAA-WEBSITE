import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireSuperAdmin } from '@/lib/permissions';
import { stopProjectSubscription } from '@/lib/project-payments';

// Stop subscription (only superadmin)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; subscriptionId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only superadmin can stop subscriptions
    await requireSuperAdmin();

    const { subscriptionId } = await context.params;

    await stopProjectSubscription(subscriptionId, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error stopping project subscription:', error);
    const statusCode = error.message?.includes('payment is in progress') ? 400 : 500;
    return NextResponse.json({ 
      error: error.message || 'Failed to stop project subscription' 
    }, { status: statusCode });
  }
}

