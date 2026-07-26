import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { requireCompanyAccess, isSuperAdmin, getCurrentUser } from '@/lib/permissions';
import { attachCompanyDefaultToPaymentRequests } from '@/lib/payments';

/**
 * POST /api/admin/payments/attach-default-to-company
 * Attach the company's default payment method to all payment requests in the company
 * that are missing Stripe customer/payment method. Requires company admin or super admin.
 * Body: { companyId?: string } — optional for super admin to specify company; otherwise uses current user's company.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let companyId: string | undefined = body?.companyId;

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      const dbUser = await getCurrentUser();
      if (!dbUser?.company_id) {
        return NextResponse.json({ error: 'No company access' }, { status: 403 });
      }
      companyId = companyId || dbUser.company_id;
      if (!companyId) {
        return NextResponse.json({ error: 'No company access' }, { status: 403 });
      }
      if (companyId !== dbUser.company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await requireCompanyAccess(companyId);
    }

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    const result = await attachCompanyDefaultToPaymentRequests(companyId);
    return NextResponse.json({ success: true, updated: result.updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to attach default';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
