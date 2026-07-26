import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resolvePaymentIntentRail } from '@/lib/stripe-payment-rail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Returns the actual payment method type used for a payment intent (card vs ACH),
 * from Stripe's PaymentMethod, not from intent metadata (which can be wrong if user switched method).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('paymentIntentId');
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'paymentIntentId required' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
    });

    const method = await resolvePaymentIntentRail(stripe, paymentIntent);

    // Keep metadata in sync so other code that reads it later sees the correct method
    if (paymentIntent.metadata?.method !== method) {
      await stripe.paymentIntents.update(paymentIntentId, {
        metadata: { ...paymentIntent.metadata, method },
      });
    }

    return NextResponse.json({ method });
  } catch (err) {
    console.error('Error getting payment intent method:', err);
    return NextResponse.json(
      { error: 'Failed to get payment method type' },
      { status: 500 }
    );
  }
}
