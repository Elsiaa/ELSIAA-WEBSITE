import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import {
  getProjectFeeById,
  getProjectSubscriptionById,
  updateProjectFeeStatus,
  calculateNextBillingDate,
} from "@/lib/project-payments";
import { createPaymentRequest } from "@/lib/payments";
import { getUsersByCompany } from "@/lib/users";
import { getServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/admin/payments/resolve-request?feeId=xxx | ?subscriptionId=xxx
 * Returns the payment request ID for a project fee or subscription (super admin only).
 * If the fee/sub has no linked payment request, creates one and links it so Edit always works.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can resolve payment request" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const feeId = searchParams.get("feeId");
    const subscriptionId = searchParams.get("subscriptionId");

    if (feeId) {
      const fee = await getProjectFeeById(feeId);
      if (!fee) {
        return NextResponse.json({ error: "Fee not found" }, { status: 404 });
      }
      let prId = fee.paymentRequestId ?? null;
      if (!prId) {
        const users = await getUsersByCompany(fee.companyId);
        const admin = users.find((u) => u.role === "admin") || users[0];
        const recipientName = admin
          ? `${(admin as { first_name?: string }).first_name || ""} ${(admin as { last_name?: string }).last_name || ""}`.trim() ||
            admin.email
          : "Set in Edit";
        const recipientEmail = admin?.email || "edit@placeholder.local";
        const pr = await createPaymentRequest({
          userId: admin?.id,
          recipientEmail,
          recipientName,
          amount: fee.amount,
          createdByClerkUserId: userId,
          paymentType: "one_time",
        });
        await updateProjectFeeStatus(feeId, "pending", pr.id);
        prId = pr.id;
        return NextResponse.json({
          paymentRequestId: prId,
          request: {
            amount: pr.amount,
            next_billing_date: pr.next_billing_date ?? null,
            recipient_name: pr.recipient_name ?? "",
            recipient_email: pr.recipient_email ?? "",
          },
        });
      }
      return NextResponse.json({ paymentRequestId: prId });
    }

    if (subscriptionId) {
      const sub = await getProjectSubscriptionById(subscriptionId);
      if (!sub) {
        return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
      }
      let prId = sub.paymentRequestId ?? null;
      if (!prId) {
        const users = await getUsersByCompany(sub.companyId);
        const admin = users.find((u) => u.role === "admin") || users[0];
        const recipientName = admin
          ? `${(admin as { first_name?: string }).first_name || ""} ${(admin as { last_name?: string }).last_name || ""}`.trim() ||
            admin.email
          : "Set in Edit";
        const recipientEmail = admin?.email || "edit@placeholder.local";
        const nextBilling = sub.nextBillingDate
          ? sub.nextBillingDate
          : calculateNextBillingDate(sub.billingInterval || "monthly", undefined, {
              dayOfMonth: sub.billingDayOfMonth ?? undefined,
              dayOfWeek: sub.billingDayOfWeek ?? undefined,
            }).toISOString();
        const pr = await createPaymentRequest({
          userId: admin?.id,
          recipientEmail,
          recipientName,
          amount: sub.amount,
          createdByClerkUserId: userId,
          paymentType: "monthly",
          nextBillingDate: nextBilling.slice(0, 10),
        });
        const supabase = getServerSupabaseClient();
        await supabase
          .from("project_subscriptions")
          .update({
            payment_request_id: pr.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscriptionId);
        prId = pr.id;
        return NextResponse.json({
          paymentRequestId: prId,
          request: {
            amount: pr.amount,
            next_billing_date: pr.next_billing_date ?? null,
            recipient_name: pr.recipient_name ?? "",
            recipient_email: pr.recipient_email ?? "",
          },
        });
      }
      return NextResponse.json({ paymentRequestId: prId });
    }

    return NextResponse.json(
      { error: "Provide feeId or subscriptionId query param" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error resolving payment request:", error);
    return NextResponse.json({ error: "Failed to resolve" }, { status: 500 });
  }
}
