import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPaymentRequestByToken, updatePaymentRequestStripeInfo, updatePaymentRequestStatus } from '@/lib/payments';
import { resolveCheckoutByToken } from '@/lib/bill-checkout';
import { updateBillStripeInfo, recordBillEvent } from '@/lib/bills';
import { runBillCycle } from '@/lib/bill-billing-engine';
import { isBillCheckoutSetupOnly } from '@/lib/bill-finalize';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function extractPmFromStripe(params: {
  setup_intent_id?: string;
  payment_intent_id?: string;
}): Promise<{ paymentMethodId: string; customerId: string }> {
  if (params.setup_intent_id) {
    const setupIntent = await stripe.setupIntents.retrieve(params.setup_intent_id);
    if (!setupIntent.payment_method) {
      throw new Error('No payment method found in setup intent');
    }
    return {
      paymentMethodId: setupIntent.payment_method as string,
      customerId: setupIntent.customer as string,
    };
  }
  if (params.payment_intent_id) {
    const paymentIntent = await stripe.paymentIntents.retrieve(params.payment_intent_id);
    if (!paymentIntent.payment_method) {
      throw new Error('No payment method found in payment intent');
    }
    return {
      paymentMethodId: paymentIntent.payment_method as string,
      customerId: paymentIntent.customer as string,
    };
  }
  throw new Error('Either payment_intent_id or setup_intent_id is required');
}

async function attachPmToCustomer(customerId: string, paymentMethodId: string): Promise<void> {
  try {
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (!msg.includes('already been attached')) {
      throw err;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, payment_intent_id, setup_intent_id } = body;

    if (!public_token || (!payment_intent_id && !setup_intent_id)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = String(public_token).trim();
    const checkout = await resolveCheckoutByToken(token);

    if (checkout?.source === 'bill' && checkout.bill) {
      const bill = checkout.bill;
      if (isBillCheckoutSetupOnly(bill)) {
        return NextResponse.json(
          {
            error:
              'Add a payment method by signing in to your account under Billing & Payments.',
            code: 'AUTO_CHARGE_SIGN_IN_REQUIRED',
          },
          { status: 403 }
        );
      }
      const { paymentMethodId, customerId: customerFromIntent } = await extractPmFromStripe({
        setup_intent_id,
        payment_intent_id,
      });

      let customerId = customerFromIntent;
      if (!customerId && bill.recipientEmail) {
        const customer = await stripe.customers.create({ email: bill.recipientEmail });
        customerId = customer.id;
      }
      if (!customerId || !paymentMethodId) {
        return NextResponse.json({ error: 'Customer and payment method are required' }, { status: 400 });
      }

      await attachPmToCustomer(customerId, paymentMethodId);
      await updateBillStripeInfo(bill.id, customerId, paymentMethodId);
      await recordBillEvent({
        billId: bill.id,
        eventType: 'payment_method_saved',
        message: 'Payment method saved via checkout link',
      });

      if (bill.collectionMode === 'auto_charge' && bill.status === 'active') {
        try {
          await runBillCycle(bill.id, { sendInvoiceEmail: false, force: true });
        } catch (cycleErr) {
          console.error('[SAVE-PAYMENT-METHOD] bill auto-charge after PM save failed', cycleErr);
        }
      }

      return NextResponse.json({ success: true, source: 'bill' });
    }

    const paymentRequest = await getPaymentRequestByToken(token);
    if (!paymentRequest) {
      return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
    }

    const isRecurring =
      paymentRequest.payment_type === 'monthly' || paymentRequest.payment_type === 'interval_billing';
    if (!isRecurring) {
      return NextResponse.json({ success: true, message: 'Not a recurring payment, skipping' });
    }

    const { paymentMethodId, customerId: customerFromIntent } = await extractPmFromStripe({
      setup_intent_id,
      payment_intent_id,
    });

    let customerId = customerFromIntent;
    if (!customerId && paymentRequest.recipient_email) {
      const customer = await stripe.customers.create({ email: paymentRequest.recipient_email });
      customerId = customer.id;
    }

    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: 'Customer ID and payment method ID are required' }, { status: 400 });
    }

    await attachPmToCustomer(customerId, paymentMethodId);
    await updatePaymentRequestStripeInfo(paymentRequest.id, customerId, paymentMethodId);

    if (paymentRequest.payment_type === 'interval_billing' && paymentRequest.status === 'pending') {
      try {
        await updatePaymentRequestStatus(paymentRequest.public_token, 'invoiced');
      } catch (statusError) {
        console.error('Failed to update status to invoiced:', statusError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save payment method' },
      { status: 500 }
    );
  }
}
