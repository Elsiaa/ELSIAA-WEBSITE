import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/permissions";
import {
  getProjectSubscriptionById,
  updateSubscriptionBillingDates,
  createProjectSubscriptionTransaction,
} from "@/lib/project-payments";
import { getNextInvoiceNumber } from "@/lib/payments";

/**
 * Mark a subscription payment as completed manually
 * This is useful for monthly subscriptions that were paid outside the system
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; subscriptionId: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only superadmin can mark payments as completed
    await requireSuperAdmin();

    const { id: projectId, subscriptionId } = await context.params;

    // Get the subscription
    const subscription = await getProjectSubscriptionById(subscriptionId);

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (subscription.status !== "active") {
      return NextResponse.json({ error: "Subscription is not active" }, { status: 400 });
    }

    const now = new Date();

    // Calculate next billing date based on interval
    let nextBillingDate: Date;
    switch (subscription.billingInterval) {
      case "daily":
        nextBillingDate = new Date(now);
        nextBillingDate.setDate(nextBillingDate.getDate() + 1);
        break;
      case "weekly":
        nextBillingDate = new Date(now);
        nextBillingDate.setDate(nextBillingDate.getDate() + 7);
        break;
      case "monthly":
      default:
        nextBillingDate = new Date(now);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
        nextBillingDate.setDate(1);
        break;
    }
    nextBillingDate.setHours(0, 0, 0, 0);

    // Get invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // Update subscription billing dates
    await updateSubscriptionBillingDates(
      subscriptionId,
      now.toISOString(),
      nextBillingDate.toISOString(),
    );

    // Create transaction record (without payment intent since it was paid outside)
    await createProjectSubscriptionTransaction({
      projectSubscriptionId: subscriptionId,
      paymentRequestId: null,
      stripePaymentIntentId: null,
      amount: subscription.amount,
      invoiceNumber,
      billingPeriodStart: now.toISOString(),
      billingPeriodEnd: nextBillingDate.toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Payment marked as completed",
      nextBillingDate: nextBillingDate.toISOString(),
      invoiceNumber,
    });
  } catch (error: any) {
    console.error("Error marking subscription payment as completed:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to mark payment as completed" }, { status: 500 });
  }
}
