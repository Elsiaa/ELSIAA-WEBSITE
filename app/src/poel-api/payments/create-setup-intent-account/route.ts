import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/auth';
import { getCurrentUser } from '@/lib/permissions';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { method = 'card', email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const isACH = method === 'us_bank_account';

    // Get or create Stripe customer for this user
    let customerId = (currentUser as any).stripe_customer_id;
    
    if (!customerId) {
      // Check if customer exists by email
      const existingCustomers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({ 
          email: email,
          metadata: {
            user_id: currentUser.id,
          },
        });
        customerId = customer.id;
      }
    }

    // Create setup intent (no charge, just collects payment method)
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: isACH ? ['us_bank_account'] : ['card'],
      metadata: {
        user_id: currentUser.id,
        method: isACH ? 'ach' : 'card',
        payer_email: email,
      },
    });

    console.log('Setup intent created for account:', { setupIntentId: setupIntent.id, customerId });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating setup intent for account:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: `Failed to create setup intent: ${errorMessage}` 
    }, { status: 500 });
  }
}

