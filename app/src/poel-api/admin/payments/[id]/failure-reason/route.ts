import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/permissions";
import { getServerSupabaseClient } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await getCurrentUser();
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await context.params;
    const supabase = getServerSupabaseClient();

    // Determine if it's a subscription, fee, or payment request
    const isSubscriptionId = id.startsWith("subscription-");
    const isFeeId = id.startsWith("fee-");
    const subscriptionId = isSubscriptionId ? id.replace("subscription-", "") : null;
    const feeId = isFeeId ? id.replace("fee-", "") : null;
    const paymentRequestId = !isSubscriptionId && !isFeeId ? id : null;

    let lastPaymentIntentId: string | null = null;

    // Get the last failed payment intent ID from transactions
    if (subscriptionId) {
      const { data: transactions } = await supabase
        .from("project_subscription_transactions")
        .select("stripe_payment_intent_id")
        .eq("project_subscription_id", subscriptionId)
        .not("stripe_payment_intent_id", "is", null)
        .order("transaction_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      lastPaymentIntentId = transactions?.stripe_payment_intent_id || null;
    } else if (feeId) {
      const { data: transactions } = await supabase
        .from("project_fee_transactions")
        .select("stripe_payment_intent_id")
        .eq("project_fee_id", feeId)
        .not("stripe_payment_intent_id", "is", null)
        .order("transaction_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      lastPaymentIntentId = transactions?.stripe_payment_intent_id || null;
    } else if (paymentRequestId) {
      // Check if payment request is linked to a subscription or fee
      const { data: subscription } = await supabase
        .from("project_subscriptions")
        .select("id")
        .eq("payment_request_id", paymentRequestId)
        .maybeSingle();

      if (subscription) {
        const { data: transactions } = await supabase
          .from("project_subscription_transactions")
          .select("stripe_payment_intent_id")
          .eq("project_subscription_id", subscription.id)
          .not("stripe_payment_intent_id", "is", null)
          .order("transaction_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        lastPaymentIntentId = transactions?.stripe_payment_intent_id || null;
      } else {
        const { data: fee } = await supabase
          .from("project_fees")
          .select("id")
          .eq("payment_request_id", paymentRequestId)
          .maybeSingle();

        if (fee) {
          const { data: transactions } = await supabase
            .from("project_fee_transactions")
            .select("stripe_payment_intent_id")
            .eq("project_fee_id", fee.id)
            .not("stripe_payment_intent_id", "is", null)
            .order("transaction_date", { ascending: false })
            .limit(1)
            .maybeSingle();

          lastPaymentIntentId = transactions?.stripe_payment_intent_id || null;
        }
      }
    }

    if (!lastPaymentIntentId) {
      return NextResponse.json({
        hasFailure: false,
        reason: null,
      });
    }

    // Retrieve payment intent from Stripe
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(lastPaymentIntentId);

      // Check if payment failed
      if (
        paymentIntent.status === "requires_payment_method" ||
        paymentIntent.status === "canceled" ||
        (paymentIntent.last_payment_error && paymentIntent.status !== "succeeded")
      ) {
        const error = paymentIntent.last_payment_error;
        let reason = "Payment failed";

        if (error) {
          if (error.decline_code) {
            reason = `Card declined: ${error.decline_code}`;
          } else if (error.code) {
            reason = `Payment error: ${error.code}`;
          } else if (error.message) {
            reason = error.message;
          }
        } else if (paymentIntent.status === "requires_payment_method") {
          reason = "Payment method required";
        } else if (paymentIntent.status === "canceled") {
          reason = "Payment canceled";
        }

        return NextResponse.json({
          hasFailure: true,
          reason,
          paymentIntentId: lastPaymentIntentId,
          status: paymentIntent.status,
        });
      }

      // Payment succeeded or is processing
      return NextResponse.json({
        hasFailure: false,
        reason: null,
        status: paymentIntent.status,
      });
    } catch (stripeError: any) {
      console.error("Error retrieving payment intent from Stripe:", stripeError);
      return NextResponse.json({
        hasFailure: false,
        reason: null,
        error: "Could not retrieve payment details",
      });
    }
  } catch (error) {
    console.error("Error fetching failure reason:", error);
    return NextResponse.json({ error: "Failed to fetch failure reason" }, { status: 500 });
  }
}
