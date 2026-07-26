import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { fetchCompanyPaymentStatusFast, fetchFeesSubscriptionsByCompanies } from '@/lib/admin-db-rpc';

/**
 * GET /api/admin/billing/subscriptions-batch?companyIds=id1,id2,...
 * One request for Subscriptions tab: fees/subs by project + payment status per company.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const raw = request.nextUrl.searchParams.get('companyIds') || '';
    const companyIds = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (companyIds.length === 0) {
      return NextResponse.json({ byCompany: {}, paymentStatus: {} });
    }

    const [feesSubs, statusRows] = await Promise.all([
      fetchFeesSubscriptionsByCompanies(companyIds),
      Promise.all(companyIds.map(async (id) => ({ id, status: await fetchCompanyPaymentStatusFast(id) }))),
    ]);

    const paymentStatus: Record<string, unknown> = {};
    for (const row of statusRows) {
      if (row.status) paymentStatus[row.id] = row.status;
    }

    return NextResponse.json({
      byCompany: feesSubs ?? {},
      paymentStatus,
    });
  } catch (error) {
    console.error('[admin/billing/subscriptions-batch] GET', error);
    return NextResponse.json({ error: 'Failed to load subscriptions data' }, { status: 500 });
  }
}
