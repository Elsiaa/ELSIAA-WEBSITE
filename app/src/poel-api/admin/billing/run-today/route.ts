import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { processAllDueBillings, sendOverdueWarningEmails } from "@/lib/billing-cron";

/**
 * POST /api/admin/billing/run-today
 * Same logic as GET /api/cron/billing (system-wide, as of today).
 * Body: { dryRun?: boolean } — when true, no charges or emails; returns debug breakdown.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can run system billing" },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);

    const billingResult = await processAllDueBillings(today, { debug: dryRun });

    let warnings: Awaited<ReturnType<typeof sendOverdueWarningEmails>> | undefined;
    if (!dryRun) {
      warnings = await sendOverdueWarningEmails(new Date());
    }

    const asOfDate = new Date().toISOString().split("T")[0];

    return NextResponse.json({
      asOfDate,
      dryRun,
      message: dryRun
        ? "Dry run complete — nothing was charged or emailed."
        : "Billing run complete (same as daily cron).",
      billing: billingResult,
      warnings,
    });
  } catch (error) {
    console.error("[admin/billing/run-today]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Billing run failed" },
      { status: 500 },
    );
  }
}
