import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getPaymentRequestByToken } from "@/lib/payments";
import { savePaymentMethod } from "@/lib/payments";
import { getCurrentUser } from "@/lib/permissions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Save a payment method from a payment request to the user's account
 * This is used when a user completes a payment and we want to save the payment method
 * for future use in account-based payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_token, setup_intent_id, payment_intent_id } = body;

    if (!public_token || (!setup_intent_id && !payment_intent_id)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get payment request
    const paymentRequest = await getPaymentRequestByToken(public_token);
    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    // Only save for account-based payments (those with user_id)
    if (!paymentRequest.user_id) {
      return NextResponse.json({
        success: true,
        message: "Not an account-based payment, skipping",
      });
    }

    let paymentMethodId: string;
    let customerId: string;

    if (setup_intent_id) {
      const setupIntent = await stripe.setupIntents.retrieve(setup_intent_id);
      if (!setupIntent.payment_method) {
        return NextResponse.json({ error: "No payment method in setup intent" }, { status: 400 });
      }
      paymentMethodId = setupIntent.payment_method as string;
      customerId = setupIntent.customer as string;
    } else if (payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
      if (!paymentIntent.payment_method) {
        return NextResponse.json({ error: "No payment method in payment intent" }, { status: 400 });
      }
      paymentMethodId = paymentIntent.payment_method as string;
      customerId = paymentIntent.customer as string;
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID not found" }, { status: 400 });
    }

    // Get payment method details
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const paymentMethodType = pm.type === "card" ? "card" : "us_bank_account";
    const displayName = getPaymentMethodDisplayName(pm);

    // Check if this payment method is already saved
    const existingMethods = await import("@/lib/payments").then((m) =>
      m.getSavedPaymentMethods({ userId: paymentRequest.user_id! }),
    );
    const alreadySaved = existingMethods.some((m) => m.stripePaymentMethodId === paymentMethodId);

    if (alreadySaved) {
      return NextResponse.json({ success: true, message: "Payment method already saved" });
    }

    // Save the payment method (set as default if it's the first one)
    const isDefault = existingMethods.length === 0;
    await savePaymentMethod({
      userId: paymentRequest.user_id,
      stripeCustomerId: customerId,
      stripePaymentMethodId: paymentMethodId,
      paymentMethodType,
      displayName,
      isDefault,
    });

    return NextResponse.json({ success: true, message: "Payment method saved" });
  } catch (error) {
    console.error("Error saving payment method to account:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save payment method" },
      { status: 500 },
    );
  }
}

function getPaymentMethodDisplayName(pm: Stripe.PaymentMethod): string {
  if (pm.type === "card" && pm.card) {
    return `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`;
  } else if (pm.type === "us_bank_account" && pm.us_bank_account) {
    return `${pm.us_bank_account.bank_name || "Bank"} •••• ${pm.us_bank_account.last4}`;
  }
  return "Payment Method";
}
