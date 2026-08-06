/**
 * Stripe Webhook Handler
 * Handles Stripe subscription invoice events for automatic monthly billing
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSupabaseClient } from "@/lib/supabase";
import {
  getProjectSubscriptionByStripeSubscriptionId,
  createProjectSubscriptionTransaction,
  updateSubscriptionBillingDates,
} from "@/lib/project-payments";
import { getPaymentRequestById, getRequestDisplayInfo } from "@/lib/payments";
import { getUsersByCompany } from "@/lib/users";
import { resolvePaymentIntentRail } from "@/lib/stripe-payment-rail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Error verifying webhook:", err);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 },
    );
  }

  // PaymentIntent succeeded or processing (ACH) — backup if the browser never calls record-success
  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.processing") {
    const piObj = event.data.object as Stripe.PaymentIntent;
    const token = piObj.metadata?.public_token?.trim();
    if (token) {
      try {
        const { finalizeCheckoutPaymentIntent } = await import("@/lib/payment-intent-finalize");
        await finalizeCheckoutPaymentIntent(piObj.id, { sendEmails: true });
      } catch (e) {
        console.error(`[stripe webhook] ${event.type} finalize:`, e);
      }
    }
    return NextResponse.json({ received: true });
  }

  // Handle invoice.payment_succeeded event (when subscription is automatically charged)
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // Only process subscription invoices (not one-time payments)
    // subscription can be a string (ID) or Subscription object
    const subscription = (invoice as any).subscription;
    const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json({ received: true, message: "Not a subscription invoice" });
    }

    const stripeSubscriptionId = subscriptionId;

    try {
      // Get the project subscription from our database
      const subscription = await getProjectSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

      if (!subscription) {
        console.log(
          `No project subscription found for Stripe subscription ${stripeSubscriptionId}`,
        );
        return NextResponse.json({ received: true, message: "Subscription not found in database" });
      }

      // Skip if subscription is stopped
      if (subscription.status === "stopped" || subscription.status === "cancelled") {
        console.log(`Subscription ${subscription.id} is stopped, skipping transaction creation`);
        return NextResponse.json({ received: true, message: "Subscription is stopped" });
      }

      // Get invoice details
      const amount = invoice.amount_paid / 100; // Convert from cents to dollars
      const invoiceNumber = invoice.number ? parseInt(invoice.number.replace(/[^0-9]/g, "")) : null;
      const paymentIntent = (invoice as any).payment_intent;
      const paymentIntentId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;

      // Calculate billing period
      const periodStart = invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null;
      const periodEnd = invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null;

      // Calculate next billing date (1 month from period end)
      let nextBillingDate: string | null = null;
      if (periodEnd) {
        const nextDate = new Date(periodEnd);
        nextDate.setMonth(nextDate.getMonth() + 1);
        nextBillingDate = nextDate.toISOString();
      }

      // Create transaction record
      await createProjectSubscriptionTransaction({
        projectSubscriptionId: subscription.id,
        paymentRequestId: null, // No payment request for automatic Stripe billing
        stripePaymentIntentId: paymentIntentId || null,
        amount,
        invoiceNumber,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      });

      // Update subscription billing dates
      if (periodStart && nextBillingDate) {
        await updateSubscriptionBillingDates(subscription.id, periodStart, nextBillingDate);
      }

      // Send receipt to customer (every charge sends a receipt)
      try {
        let recipientEmail: string;
        let recipientName: string;
        if (subscription.paymentRequestId) {
          const pr = await getPaymentRequestById(subscription.paymentRequestId);
          const info = pr ? getRequestDisplayInfo(pr) : { email: "", name: "" };
          recipientEmail = info.email || "";
          recipientName = info.name || subscription.name || "Subscription";
        } else {
          const users = await getUsersByCompany(subscription.companyId);
          const admin = users.find((u) => u.role === "admin" && u.email);
          recipientEmail = admin?.email || "";
          recipientName = admin
            ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim() ||
              admin.email ||
              subscription.name ||
              "Subscription"
            : subscription.name || "Subscription";
        }
        if (recipientEmail) {
          const fee = 0; // Stripe invoice amount is typically already total
          let receiptRail: "card" | "ach" = "card";
          if (paymentIntentId) {
            try {
              const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
                expand: ["payment_method"],
              });
              receiptRail = await resolvePaymentIntentRail(stripe, pi);
            } catch (e) {
              console.error("Webhook: could not resolve payment method for receipt", e);
            }
          }
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
          await fetch(`${baseUrl}/api/payments/send-receipt`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentIntentId: paymentIntentId || undefined,
              amount,
              fee,
              total: amount,
              paymentMethod: receiptRail,
              recipientEmail,
              recipientName,
              invoiceNumber: invoiceNumber ?? undefined,
            }),
          });
        }
      } catch (receiptErr) {
        console.error("Failed to send subscription receipt email (webhook):", receiptErr);
      }

      console.log(
        `Created transaction for subscription ${subscription.id} (Stripe invoice ${invoice.id})`,
      );

      return NextResponse.json({
        received: true,
        message: `Processed invoice for subscription ${subscription.id}`,
      });
    } catch (error: any) {
      console.error("Error processing invoice.payment_succeeded:", error);
      // Return 200 to Stripe so they don't retry (we'll handle errors manually)
      return NextResponse.json({
        received: true,
        error: error.message,
      });
    }
  }

  // Handle subscription.deleted event (when subscription is cancelled)
  if (event.type === "customer.subscription.deleted") {
    const stripeSubscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = stripeSubscription.id;

    try {
      const subscription = await getProjectSubscriptionByStripeSubscriptionId(stripeSubscriptionId);

      if (subscription && subscription.status === "active") {
        // Update subscription status to stopped (should already be stopped, but just in case)
        const supabase = getServerSupabaseClient();
        await supabase
          .from("project_subscriptions")
          .update({
            status: "stopped",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription.id);

        console.log(`Marked subscription ${subscription.id} as stopped after Stripe cancellation`);
      }
    } catch (error: any) {
      console.error("Error processing customer.subscription.deleted:", error);
    }

    return NextResponse.json({ received: true });
  }

  // Return success for other event types (we don't handle them)
  return NextResponse.json({ received: true });
}
