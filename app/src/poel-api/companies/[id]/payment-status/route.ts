import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireCompanyAdmin } from '@/lib/permissions';
import { getCompanyPaymentStatusWithPreemptiveBilling } from '@/lib/preemptive-company-billing';

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
    const skipPreemptive =
      request.nextUrl.searchParams.get('skipPreemptive') === '1' ||
      request.nextUrl.searchParams.get('readOnly') === '1';

    await requireCompanyAdmin(companyId);

    const status = skipPreemptive
      ? await (await import('@/lib/project-payments')).getCompanyPaymentStatus(companyId)
      : await getCompanyPaymentStatusWithPreemptiveBilling(companyId);
    return NextResponse.json({ status });
  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    if (error.message.includes('Forbidden') || error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
}

