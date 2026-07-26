import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getCurrentUser } from '@/lib/permissions';
import { processAllDueBillings } from '@/lib/billing-cron';

/**
 * GET /api/admin/payments/billing-dry-run
 * Run billing in debug mode (no charges). Returns subscriptionDebug, paymentRequestDebug, and
 * dryRunDebug.allPaymentRequestsBreakdown with company name per row for every payment request.
 * Company admin: runs for their company. Super admin: runs for ALL companies (no query); optional ?companyId= to scope to one.
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
    let companyId: string | null = null;
    if (isSuperAdmin && searchParams.get('companyId')) {
      companyId = searchParams.get('companyId');
    } else if (dbUser?.company_id) {
      companyId = dbUser.company_id;
    }

    const asOfParam = searchParams.get('asOf');
    let asOfDate: Date | undefined;
    if (asOfParam) {
      const d = new Date(asOfParam + 'T00:00:00.000Z');
      if (!isNaN(d.getTime())) {
        d.setUTCHours(23, 59, 59, 999);
        asOfDate = d;
      }
    }

    const result = await processAllDueBillings(asOfDate, {
      debug: true,
      ...(companyId && { companyId }),
    });

    return NextResponse.json({
      dryRun: true,
      message: 'No charges or attach. Subscription and payment request lists show what would happen on a real run.',
      ...result,
    });
  } catch (error) {
    console.error('Billing dry run error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dry run failed' },
      { status: 500 }
    );
  }
}
