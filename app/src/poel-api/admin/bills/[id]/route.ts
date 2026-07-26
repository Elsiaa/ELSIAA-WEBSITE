import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from '@/lib/permissions';
import { getBillById, updateBillDetails, updateBillStatus } from '@/lib/bills';
import type { BillRecurrenceInterval } from '@/lib/bills';

async function canAccessBill(billId: string): Promise<{ ok: boolean; isSuperAdmin: boolean }> {
  const isSuperAdmin = await checkSuperAdmin();
  if (isSuperAdmin) return { ok: true, isSuperAdmin: true };

  const dbUser = await getCurrentUser();
  if (!dbUser?.company_id || dbUser.role !== 'admin') {
    return { ok: false, isSuperAdmin: false };
  }

  const bill = await getBillById(billId);
  if (!bill || bill.companyId !== dbUser.company_id) {
    return { ok: false, isSuperAdmin: false };
  }
  return { ok: true, isSuperAdmin: false };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const access = await canAccessBill(id);
    if (!access.ok) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const bill = await getBillById(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const charges = await import('@/lib/bills').then((m) => m.getBillCharges(id));
    return NextResponse.json({ bill, charges });
  } catch (error) {
    console.error('[admin/bills/id] GET', error);
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can update bills' }, { status: 403 });
    }

    const { id } = await params;
    const bill = await getBillById(id);
    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = await updateBillDetails(id, {
      recipientEmail: body.recipientEmail,
      recipientName: body.recipientName,
      description: body.description,
      internalNote: body.internalNote,
      nextBillingDate: body.nextBillingDate,
      lineItems: body.lineItems,
      recurrenceInterval: body.recurrenceInterval as BillRecurrenceInterval | undefined,
      recurrenceDayOfMonth: body.recurrenceDayOfMonth,
      recurrenceDayOfWeek: body.recurrenceDayOfWeek,
    });

    return NextResponse.json({ bill: updated });
  } catch (error) {
    console.error('[admin/bills/id] PATCH', error);
    const message = error instanceof Error ? error.message : 'Failed to update bill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can cancel bills' }, { status: 403 });
    }

    const { id } = await params;
    await updateBillStatus(id, 'cancelled');
    await import('@/lib/bills').then((m) =>
      m.recordBillEvent({ billId: id, eventType: 'cancelled', message: 'Bill cancelled' })
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[admin/bills/id] DELETE', error);
    return NextResponse.json({ error: 'Failed to cancel bill' }, { status: 500 });
  }
}
