import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSavedPaymentMethods, savePaymentMethod, deleteSavedPaymentMethod } from '@/lib/payments';
import { getCurrentUser } from '@/lib/permissions';
import { requireCompanyAccess, isSuperAdmin } from '@/lib/permissions';
import type { BillingTypeForMethod } from '@/lib/payments';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// GET - Retrieve saved payment methods for the current user (and company if in one)
export async function GET(request: NextRequest) {
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

    const userMethods = await getSavedPaymentMethods({ userId: currentUser.id });
    const companyMethods = currentUser.company_id
      ? await getSavedPaymentMethods({ companyId: currentUser.company_id })
      : [];
    const seen = new Set(userMethods.map((m) => m.id));
    const methods = [...userMethods, ...companyMethods.filter((m) => !seen.has(m.id))];

    // Enrich with Stripe payment method details
    const enrichedMethods = await Promise.all(
      methods.map(async (method) => {
        try {
          const pm = await stripe.paymentMethods.retrieve(method.stripePaymentMethodId);
          return {
            ...method,
            displayName: method.displayName || getPaymentMethodDisplayName(pm),
            last4: pm.card?.last4 || pm.us_bank_account?.last4 || null,
            brand: pm.card?.brand || null,
          };
        } catch (err) {
          console.error('Error retrieving payment method from Stripe:', err);
          return method;
        }
      })
    );

    return NextResponse.json({ methods: enrichedMethods });
  } catch (error) {
    console.error('Error fetching saved payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved payment methods' },
      { status: 500 }
    );
  }
}

// POST - Save a new payment method
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { setupIntentId, paymentMethodId, isDefault, companyId: bodyCompanyId, useForBillingType } = body;

    if (!setupIntentId && !paymentMethodId) {
      return NextResponse.json({ error: 'setupIntentId or paymentMethodId required' }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let saveAsCompanyId: string | undefined;
    const validBillingTypes: (BillingTypeForMethod | '')[] = ['subscription', 'one_time', 'interval_billing', 'monthly', ''];
    const useType: BillingTypeForMethod | null =
      useForBillingType && validBillingTypes.includes(useForBillingType) ? useForBillingType : null;

    if (bodyCompanyId) {
      const superAdmin = await isSuperAdmin();
      if (!superAdmin) await requireCompanyAccess(bodyCompanyId);
      if (currentUser.company_id !== bodyCompanyId && !superAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      saveAsCompanyId = bodyCompanyId;
    }

    let stripePaymentMethodId: string;
    let stripeCustomerId: string;
    let paymentMethodType: 'card' | 'us_bank_account';

    if (setupIntentId) {
      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (!setupIntent.payment_method) {
        return NextResponse.json({ error: 'No payment method in setup intent' }, { status: 400 });
      }
      stripePaymentMethodId = setupIntent.payment_method as string;
      stripeCustomerId = setupIntent.customer as string;
      
      const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
      paymentMethodType = pm.type === 'card' ? 'card' : 'us_bank_account';
    } else if (paymentMethodId) {
      stripePaymentMethodId = paymentMethodId;
      const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
      paymentMethodType = pm.type === 'card' ? 'card' : 'us_bank_account';
      
      if (!pm.customer) {
        return NextResponse.json({ error: 'Payment method not attached to customer' }, { status: 400 });
      }
      stripeCustomerId = pm.customer as string;
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get payment method details for display name
    const pm = await stripe.paymentMethods.retrieve(stripePaymentMethodId);
    const displayName = getPaymentMethodDisplayName(pm);

    // Save the payment method (company-level when saveAsCompanyId set, else user-level)
    const saved = await savePaymentMethod({
      ...(saveAsCompanyId ? { companyId: saveAsCompanyId } : { userId: currentUser.id }),
      stripeCustomerId,
      stripePaymentMethodId,
      paymentMethodType,
      displayName,
      isDefault: isDefault !== false,
      useForBillingType: useType ?? undefined,
    });

    return NextResponse.json({ method: saved });
  } catch (error) {
    console.error('Error saving payment method:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save payment method' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a saved payment method
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const methodId = searchParams.get('id');

    if (!methodId) {
      return NextResponse.json({ error: 'Method ID required' }, { status: 400 });
    }

    await deleteSavedPaymentMethod(methodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved payment method:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved payment method' },
      { status: 500 }
    );
  }
}

function getPaymentMethodDisplayName(pm: Stripe.PaymentMethod): string {
  if (pm.type === 'card' && pm.card) {
    return `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`;
  } else if (pm.type === 'us_bank_account' && pm.us_bank_account) {
    return `${pm.us_bank_account.bank_name || 'Bank'} •••• ${pm.us_bank_account.last4}`;
  }
  return 'Payment Method';
}

