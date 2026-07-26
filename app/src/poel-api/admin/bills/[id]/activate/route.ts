import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin } from '@/lib/permissions';
import { getBillById, updateBillStatus, recordBillEvent } from '@/lib/bills';
import { activateBillInitialCycle } from '@/lib/bill-billing-engine';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const bill = await getBillById(id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (bill.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft bills can be activated' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    await updateBillStatus(id, 'active');
    await recordBillEvent({ billId: id, eventType: 'activated', message: 'Bill activated' });
    await activateBillInitialCycle(id, {
      sendInvoiceEmail: body.sendInvoiceEmail !== false,
    });

    const updated = await getBillById(id);
    return NextResponse.json({ bill: updated });
  } catch (error) {
    console.error('[admin/bills/activate]', error);
    const message = error instanceof Error ? error.message : 'Failed to activate';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
