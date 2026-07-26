import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from '@/lib/permissions';
import { getBillById, getBillChargeById, getBillDisplayInfo } from '@/lib/bills';
import { generateInvoicePdfBuffer } from '@/lib/invoice-pdf';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const chargeId = searchParams.get('chargeId');

    const bill = await getBillById(id);
    if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (!isSuperAdmin) {
      if (!dbUser?.company_id || dbUser.role !== 'admin' || bill.companyId !== dbUser.company_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let charge = chargeId ? await getBillChargeById(chargeId) : null;
    if (charge && charge.billId !== id) {
      return NextResponse.json({ error: 'Charge does not belong to bill' }, { status: 400 });
    }

    if (!charge || charge.status !== 'paid') {
      return NextResponse.json({ error: 'Paid charge required for receipt' }, { status: 400 });
    }

    const { name, email } = getBillDisplayInfo(bill);
    const invoiceNumber = charge.invoiceNumber?.toString() ?? charge.id.slice(0, 8);
    const invoiceDate = charge.paidAt
      ? new Date(charge.paidAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

    const format = searchParams.get('format');
    if (format === 'pdf') {
      const publicBase = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000'
      ).replace(/\/$/, '');
      const pdfBuffer = await generateInvoicePdfBuffer({
        invoiceNumber,
        invoiceDate,
        recipientName: name,
        recipientEmail: email,
        amount: charge.amount,
        lineItems: charge.lineItemsSnapshot,
        payUrl: `${publicBase}/admin`,
        statusLabel: 'Paid',
      });
      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="receipt-${invoiceNumber}.pdf"`,
        },
      });
    }

    return NextResponse.json({
      receipt: {
        billId: bill.id,
        chargeId: charge.id,
        invoiceNumber: charge.invoiceNumber,
        amount: charge.amount,
        recipientName: name,
        recipientEmail: email,
        paidAt: charge.paidAt,
        lineItems: charge.lineItemsSnapshot,
        description: bill.description,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch receipt' }, { status: 500 });
  }
}
