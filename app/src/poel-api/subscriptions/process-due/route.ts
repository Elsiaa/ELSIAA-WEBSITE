import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { processAllDueBillings } from "@/lib/billing-cron";

function parseAsOfParam(url: string): Date | null {
  try {
    const u = new URL(url, "http://localhost");
    const asOf = u.searchParams.get("asOf");
    if (!asOf) return null;
    const date = new Date(asOf + "T00:00:00.000Z");
    if (isNaN(date.getTime())) return null;
    if (date > new Date()) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Legacy alias: runs the same logic as the single system cron.
 * Prefer GET /api/cron/billing as the one cron for the entire system.
 */

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const isSystemCall = apiKey === process.env.INTERNAL_API_KEY;

    if (!isSystemCall) {
      const cronSecret = request.headers.get("authorization");
      if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    // Optional asOf=YYYY-MM-DD for testing (only when cron auth passed)
    const asOfDate = parseAsOfParam(request.url);

    const result = await processAllDueBillings(asOfDate || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing due subscriptions:", error);
    return NextResponse.json({ error: "Failed to process subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const isSystemCall = apiKey === process.env.INTERNAL_API_KEY;

    if (!isSystemCall) {
      const session = await auth();
      const userId = session?.user?.id;
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const userIsSuperAdmin = await isSuperAdmin();
      if (!userIsSuperAdmin) {
        return NextResponse.json({ error: "Forbidden - super admin only" }, { status: 403 });
      }
    }

    const result = await processAllDueBillings();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing due subscriptions:", error);
    return NextResponse.json({ error: "Failed to process subscriptions" }, { status: 500 });
  }
}
