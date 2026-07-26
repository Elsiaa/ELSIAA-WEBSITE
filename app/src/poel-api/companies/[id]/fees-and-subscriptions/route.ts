import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireCompanyAdmin } from '@/lib/permissions';
import { getCompanyFees, getCompanySubscriptions } from '@/lib/project-payments';

/**
 * Get all fees and subscriptions for a company in one request
 * This is more efficient than making individual requests per project
 */
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

    const { id: companyId } = await context.params;
    
    // Check if user is company admin for this company
    await requireCompanyAdmin(companyId);

    // Fetch all fees and subscriptions for the company at once
    const [fees, subscriptions] = await Promise.all([
      getCompanyFees(companyId),
      getCompanySubscriptions(companyId),
    ]);

    // Group fees and subscriptions by project_id for easy consumption
    const feesByProject: Record<string, typeof fees> = {};
    const subscriptionsByProject: Record<string, typeof subscriptions> = {};

    fees.forEach(fee => {
      if (!feesByProject[fee.projectId]) {
        feesByProject[fee.projectId] = [];
      }
      feesByProject[fee.projectId].push(fee);
    });

    subscriptions.forEach(sub => {
      if (!subscriptionsByProject[sub.projectId]) {
        subscriptionsByProject[sub.projectId] = [];
      }
      subscriptionsByProject[sub.projectId].push(sub);
    });

    return NextResponse.json({ 
      feesByProject,
      subscriptionsByProject,
      allFees: fees,
      allSubscriptions: subscriptions,
    });
  } catch (error: any) {
    console.error('Error fetching company fees and subscriptions:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch fees and subscriptions' }, { status: 500 });
  }
}

