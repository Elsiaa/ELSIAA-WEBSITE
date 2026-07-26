import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from '@/lib/permissions';
import { createBill, listAdminBillsWithCharges, normalizeBillRecurrenceInterval } from '@/lib/bills';
import { validateLineItemsForCreate } from '@/lib/invoice-line-items';
import type { BillCollectionMode, BillRecurrenceInterval, BillScheduleType } from '@/lib/bills';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    const includeCharges = request.nextUrl.searchParams.get('includeCharges') === '1';
    const companyFilter = request.nextUrl.searchParams.get('companyId');
    let companyId: string | null = null;
    if (isSuperAdmin) {
      companyId = companyFilter?.trim() || null;
    } else if (dbUser?.company_id && dbUser.role === 'admin') {
      companyId = dbUser.company_id;
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { bills, chargesByBillId } = await listAdminBillsWithCharges(companyId);
    return NextResponse.json({
      bills,
      ...(includeCharges ? { chargesByBillId } : {}),
    });
  } catch (error) {
    console.error('[admin/bills] GET', error);
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const clerkUserId = session?.user?.id;
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only super admins can create bills' }, { status: 403 });
    }

    const body = await request.json();
    const {
      recipientEmail,
      recipientName,
      userId,
      companyId,
      scheduleType,
      collectionMode,
      attachCompanyPaymentMethod,
      lineItems,
      saveAsDraft,
      recurrenceInterval,
      recurrenceDayOfMonth,
      recurrenceDayOfWeek,
      dueDate,
      nextBillingDate,
      description,
      internalNote,
      sendInvoiceEmail,
    } = body;

    if (!recipientEmail?.trim() || !recipientName?.trim()) {
      return NextResponse.json({ error: 'Recipient email and name are required' }, { status: 400 });
    }

    const validated = validateLineItemsForCreate(lineItems);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const sched = (scheduleType === 'recurring' ? 'recurring' : 'one_time') as BillScheduleType;
    const coll = (collectionMode === 'auto_charge' ? 'auto_charge' : 'invoice_link') as BillCollectionMode;

    if (attachCompanyPaymentMethod && !userId && !companyId) {
      return NextResponse.json(
        { error: 'Company is required when attaching a company payment method' },
        { status: 400 }
      );
    }

    const bill = await createBill({
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName.trim(),
      userId: userId || undefined,
      companyId: companyId || undefined,
      scheduleType: sched,
      collectionMode: coll,
      attachCompanyPaymentMethod: Boolean(attachCompanyPaymentMethod),
      lineItems: validated.items,
      status: saveAsDraft ? 'draft' : 'active',
      recurrenceInterval:
        sched === 'recurring'
          ? normalizeBillRecurrenceInterval('recurring', recurrenceInterval as BillRecurrenceInterval) ??
            undefined
          : undefined,
      recurrenceDayOfMonth: recurrenceDayOfMonth ?? undefined,
      recurrenceDayOfWeek:
        recurrenceDayOfWeek != null && recurrenceDayOfWeek !== ''
          ? Number(recurrenceDayOfWeek)
          : undefined,
      dueDate: dueDate || nextBillingDate || undefined,
      description: description || undefined,
      internalNote: internalNote || undefined,
      createdByClerkUserId: clerkUserId,
    });

    let activation: { charged: boolean; emailed: boolean } = { charged: false, emailed: false };
    if (!saveAsDraft) {
      const { deliverBillOnActivation } = await import('@/lib/bill-billing-engine');
      activation = await deliverBillOnActivation(bill.id, {
        sendInvoiceEmail: sendInvoiceEmail !== false,
      });
    }

    const refreshed = await import('@/lib/bills').then((m) => m.getBillById(bill.id));
    return NextResponse.json({ bill: refreshed ?? bill, activation }, { status: 201 });
  } catch (error) {
    console.error('[admin/bills] POST', error);
    const message = error instanceof Error ? error.message : 'Failed to create bill';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
