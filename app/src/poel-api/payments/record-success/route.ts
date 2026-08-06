import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { finalizeCheckoutPaymentIntent } from "@/lib/payment-intent-finalize";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Called from the browser after Stripe confirms payment — replaces broken client-side
 * imports of updatePaymentRequestStatus (server-only Supabase).
 *
 * Body: { paymentIntentId: string, publicToken?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentIntentId =
      typeof body.paymentIntentId === "string" ? body.paymentIntentId.trim() : "";
    const publicToken = typeof body.publicToken === "string" ? body.publicToken.trim() : undefined;

    if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
      return NextResponse.json({ error: "Invalid paymentIntentId" }, { status: 400 });
    }

    const result = await finalizeCheckoutPaymentIntent(paymentIntentId, {
      publicToken: publicToken || undefined,
      sendEmails: true,
    });

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return NextResponse.json({
      success: true,
      invoiceNumber: result.invoiceNumber,
      alreadyCompleted: result.alreadyCompleted,
      publicToken: result.publicToken,
      displayAmount: pi.amount / 100,
      paymentIntentStatus: pi.status,
    });
  } catch (error) {
    console.error("[record-success]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record payment" },
      { status: 400 },
    );
  }
}
