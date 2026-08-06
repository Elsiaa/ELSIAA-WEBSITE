import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { resolveCheckoutByToken } from "@/lib/bill-checkout";
import { createBillCharge, getOpenBillCharge } from "@/lib/bills";
import { PAYMENT_METHOD_PHRASE_ACH } from "@/lib/payment-method-labels";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { amount, public_token, method = "card", email, customer_name } = await request.json();

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    let checkout = null;
    if (public_token && String(public_token).trim()) {
      checkout = await resolveCheckoutByToken(String(public_token).trim());
    }

    let customerEmail = email;
    if (checkout && !customerEmail) {
      customerEmail = checkout.recipientEmail;
    }

    const isACH = method === "us_bank_account";
    if (isACH && !customerEmail) {
      return NextResponse.json(
        { error: `Email is required for ${PAYMENT_METHOD_PHRASE_ACH} payments` },
        { status: 400 },
      );
    }

    const fee = isACH ? 0 : amount * 0.03;
    const totalAmount = amount + fee;
    const totalCents = Math.round(totalAmount * 100);

    const metadata: Record<string, string> = {
      originalAmount: amount.toString(),
    };
    if (public_token && String(public_token).trim()) {
      metadata.public_token = String(public_token).trim();
    }
    if (!isACH) {
      metadata.fee = fee.toString();
      metadata.method = "card";
    } else {
      metadata.payer_email = customerEmail;
      metadata.method = "ach";
    }
    if (!public_token && customer_name) {
      metadata.customer_name = customer_name;
    }

    if (checkout?.source === "bill" && checkout.bill) {
      metadata.billing_source = "bill";
      metadata.bill_id = checkout.bill.id;
      let charge = checkout.billCharge;
      if (!charge) {
        charge = await getOpenBillCharge(checkout.bill.id);
      }
      if (!charge) {
        charge = await createBillCharge({
          billId: checkout.bill.id,
          amount: checkout.bill.amount,
          lineItemsSnapshot: checkout.bill.lineItems,
          status: "invoiced",
        });
      }
      metadata.bill_charge_id = charge.id;
    }

    const isRecurring = checkout?.isRecurring ?? false;
    const stripeCustomerId = checkout?.stripeCustomerId ?? null;

    let paymentIntent;
    if (isACH) {
      let customerId = stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({ email: customerEmail });
        customerId = customer.id;
      }

      paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "usd",
        customer: customerId,
        payment_method_types: ["us_bank_account"],
        metadata,
        setup_future_usage: isRecurring ? "off_session" : undefined,
      });
    } else {
      let customerId = stripeCustomerId;
      if (isRecurring && !customerId && customerEmail) {
        const customer = await stripe.customers.create({ email: customerEmail });
        customerId = customer.id;
      }

      paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "usd",
        customer: customerId || undefined,
        metadata,
        setup_future_usage: isRecurring ? "off_session" : undefined,
      });
    }

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
