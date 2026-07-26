import { NextRequest, NextResponse } from 'next/server';
import { resolveCheckoutByToken } from '@/lib/bill-checkout';
import { billToCheckoutPayload, isBillCheckoutSetupOnly } from '@/lib/bill-finalize';
import { getLatestPaidBillCharge } from '@/lib/bills';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const checkout = await resolveCheckoutByToken(token);

    if (!checkout) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    if (checkout.source === 'bill' && checkout.bill) {
      if (isBillCheckoutSetupOnly(checkout.bill)) {
        const base = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
        return NextResponse.json(
          {
            error:
              'This bill is set up for automatic charging. Sign in to your account and add a payment method under Billing & Payments.',
            code: 'AUTO_CHARGE_SIGN_IN_REQUIRED',
            signInUrl: `${base}/sign-in`,
          },
          { status: 403 }
        );
      }
      const paidCharge =
        !checkout.billCharge && (checkout.completed || checkout.bill.status === 'completed')
          ? await getLatestPaidBillCharge(checkout.bill.id)
          : null;
      return NextResponse.json({
        request: billToCheckoutPayload(checkout.bill, checkout.billCharge, paidCharge),
        source: 'bill',
      });
    }

    return NextResponse.json({
      request: checkout.paymentRequest,
      source: 'payment_request',
    });
  } catch (error) {
    console.error('Error fetching payment request:', error);
    return NextResponse.json({ error: 'Failed to fetch payment request' }, { status: 500 });
  }
}
