import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/permissions";
import { getServerSupabaseClient } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/** Get failure reason for a single payment id. Returns null if no failure or no payment intent. */
async function getFailureReasonForId(
  supabase: Awaited<ReturnType<typeof getServerSupabaseClient>>,
  id: string,
): Promise<string | null> {
  const isSubscriptionId = id.startsWith("subscription-");
  const isFeeId = id.startsWith("fee-");
  const subscriptionId = isSubscriptionId ? id.replace("subscription-", "") : null;
  const feeId = isFeeId ? id.replace("fee-", "") : null;
  const paymentRequestId = !isSubscriptionId && !isFeeId ? id : null;

  let lastPaymentIntentId: string | null = null;

  if (subscriptionId) {
    const { data } = await supabase
      .from("project_subscription_transactions")
      .select("stripe_payment_intent_id")
      .eq("project_subscription_id", subscriptionId)
      .not("stripe_payment_intent_id", "is", null)
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastPaymentIntentId = data?.stripe_payment_intent_id || null;
  } else if (feeId) {
    const { data } = await supabase
      .from("project_fee_transactions")
      .select("stripe_payment_intent_id")
      .eq("project_fee_id", feeId)
      .not("stripe_payment_intent_id", "is", null)
      .order("transaction_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    lastPaymentIntentId = data?.stripe_payment_intent_id || null;
  } else if (paymentRequestId) {
    const { data: subscription } = await supabase
      .from("project_subscriptions")
      .select("id")
      .eq("payment_request_id", paymentRequestId)
      .maybeSingle();

    if (subscription) {
      const { data } = await supabase
        .from("project_subscription_transactions")
        .select("stripe_payment_intent_id")
        .eq("project_subscription_id", subscription.id)
        .not("stripe_payment_intent_id", "is", null)
        .order("transaction_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      lastPaymentIntentId = data?.stripe_payment_intent_id || null;
    } else {
      const { data: fee } = await supabase
        .from("project_fees")
        .select("id")
        .eq("payment_request_id", paymentRequestId)
        .maybeSingle();
      if (fee) {
        const { data } = await supabase
          .from("project_fee_transactions")
          .select("stripe_payment_intent_id")
          .eq("project_fee_id", fee.id)
          .not("stripe_payment_intent_id", "is", null)
          .order("transaction_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastPaymentIntentId = data?.stripe_payment_intent_id || null;
      }
    }
  }

  if (!lastPaymentIntentId) return null;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(lastPaymentIntentId);
    if (
      paymentIntent.status === "requires_payment_method" ||
      paymentIntent.status === "canceled" ||
      (paymentIntent.last_payment_error && paymentIntent.status !== "succeeded")
    ) {
      const error = paymentIntent.last_payment_error;
      if (error) {
        if (error.decline_code) return `Card declined: ${error.decline_code}`;
        if (error.code) return `Payment error: ${error.code}`;
        if (error.message) return error.message;
      }
      if (paymentIntent.status === "requires_payment_method") return "Payment method required";
      if (paymentIntent.status === "canceled") return "Payment canceled";
      return "Payment failed";
    }
  } catch {
    // ignore Stripe errors per id
  }
  return null;
}

/**
 * GET /api/admin/payments/failure-reasons?ids=id1,id2,id3
 * Returns { reasons: { [id]: string | null } } for each requested id (one round-trip, parallel Stripe/DB work).
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get("ids");
    const ids = idsParam
      ? idsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ reasons: {} });
    }

    // Limit batch size to avoid timeouts
    const limitedIds = ids.slice(0, 50);

    const supabase = getServerSupabaseClient();
    const results = await Promise.all(limitedIds.map((id) => getFailureReasonForId(supabase, id)));

    const reasons: Record<string, string | null> = {};
    limitedIds.forEach((id, i) => {
      reasons[id] = results[i];
    });

    return NextResponse.json({ reasons });
  } catch (error) {
    console.error("Error fetching failure reasons:", error);
    return NextResponse.json({ error: "Failed to fetch failure reasons" }, { status: 500 });
  }
}
