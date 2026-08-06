import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/permissions";
import { processAllDueBillings } from "@/lib/billing-cron";
import { getCompanyPaymentStatus } from "@/lib/project-payments";

/**
 * POST /api/admin/payments/run-company-billing
 * Run billing for a single company only: auto-attach default payment methods and charge all due
 * subscriptions and payment requests for that company. Same logic as the daily cron, scoped to one company.
 * Company admin: runs for their company. Super admin: can pass companyId in body to run for any company.
 * Body: { companyId?: string, dryRun?: boolean }. When dryRun is true (super admin only), no charges are made;
 * response includes subscriptionDebug, paymentRequestDebug, dryRunDebug with what would be billed.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();

    if (!isSuperAdmin && !(dbUser && dbUser.role === "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let companyId: string | null = null;
    let dryRun = false;
    try {
      const body = await request.json().catch(() => ({}));
      dryRun = body.dryRun === true;
      if (isSuperAdmin && body.companyId) {
        companyId = body.companyId;
      } else if (dbUser?.company_id) {
        companyId = dbUser.company_id;
      }
    } catch {
      if (dbUser?.company_id) companyId = dbUser.company_id;
    }

    if (!companyId) {
      return NextResponse.json({ error: "Company context required" }, { status: 400 });
    }

    // Dry run is only allowed for super admin (company admin always runs for their company)
    if (dryRun && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Dry run is only available for super admins" },
        { status: 403 },
      );
    }

    const result = await processAllDueBillings(undefined, { companyId, debug: dryRun });

    if (dryRun) {
      return NextResponse.json({
        success: result.success,
        dryRun: true,
        subscriptionDebug: result.subscriptionDebug,
        paymentRequestDebug: result.paymentRequestDebug,
        dryRunDebug: result.dryRunDebug,
      });
    }

    const totalCharged =
      (result.processed ?? 0) +
      (result.processedPaymentRequests ?? 0) +
      (result.processedBills ?? 0);
    let hint: string | undefined;
    if (totalCharged === 0 && companyId) {
      try {
        const status = await getCompanyPaymentStatus(companyId);
        if (!status.allUpToDate) {
          hint =
            "Due items need a payment method attached. Add one in Payments, then run billing again.";
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: result.success,
      processed: result.processed,
      processedIds: result.processedIds,
      errors: result.errors,
      errorDetails: result.errorDetails,
      processedPaymentRequests: result.processedPaymentRequests,
      processedPaymentRequestIds: result.processedPaymentRequestIds,
      paymentRequestErrors: result.paymentRequestErrors,
      paymentRequestErrorDetails: result.paymentRequestErrorDetails,
      processedBills: result.processedBills ?? 0,
      billErrors: result.billErrors?.length ?? 0,
      billErrorDetails: result.billErrors,
      hint,
    });
  } catch (error) {
    console.error("Run company billing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run billing" },
      { status: 500 },
    );
  }
}
