import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getPaymentRequestByToken,
  getRequestDisplayInfo,
  updatePaymentRequestStripeInfo,
} from "@/lib/payments";
import { resolveCheckoutByToken } from "@/lib/bill-checkout";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const { public_token, method = "card", email } = await request.json();

    if (!public_token) {
      return NextResponse.json({ error: "Public token is required" }, { status: 400 });
    }

    const token = String(public_token).trim();
    const checkout = await resolveCheckoutByToken(token);

    if (checkout?.source === "bill") {
      const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
      return NextResponse.json(
        {
          error: "Add a payment method by signing in to your account under Billing & Payments.",
          code: "AUTO_CHARGE_SIGN_IN_REQUIRED",
          signInUrl: `${base}/sign-in`,
        },
        { status: 403 },
      );
    }

    let paymentRequest;
    try {
      paymentRequest = await getPaymentRequestByToken(token);
    } catch (err) {
      console.error("Error fetching payment request:", err);
      return NextResponse.json({ error: "Failed to fetch payment request" }, { status: 500 });
    }

    if (!paymentRequest) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    if (paymentRequest.payment_type !== "interval_billing") {
      return NextResponse.json(
        {
          error: `Setup intents are only for interval billing. This payment type is: ${paymentRequest.payment_type || "unknown"}`,
        },
        { status: 400 },
      );
    }

    let customerEmail = email;
    if (!customerEmail) {
      customerEmail = paymentRequest.recipient_email || getRequestDisplayInfo(paymentRequest).email;
    }

    if (!customerEmail) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const isACH = method === "us_bank_account";

    let customerId = paymentRequest.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: customerEmail });
      customerId = customer.id;
      try {
        await updatePaymentRequestStripeInfo(paymentRequest.id, customerId, undefined);
      } catch (err) {
        console.error("Failed to save customer ID:", err);
      }
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: isACH ? ["us_bank_account"] : ["card"],
      metadata: {
        public_token: token,
        method: isACH ? "ach" : "card",
        payer_email: customerEmail,
      },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error("Error creating setup intent:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Failed to create setup intent: ${errorMessage}`,
      },
      { status: 500 },
    );
  }
}
