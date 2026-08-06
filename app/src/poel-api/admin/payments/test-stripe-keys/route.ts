import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getCurrentUser } from "@/lib/permissions";
import Stripe from "stripe";

/**
 * GET /api/admin/payments/test-stripe-keys
 * Test that the server's Stripe keys can see your Stripe account (e.g. list customers).
 * Admin or superuser only. Use on live server to verify env keys are correct.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();
    const isAdmin = dbUser?.role === "admin";
    if (!isSuperAdmin && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sk = (process.env.STRIPE_SECRET_KEY || "").trim();
    const pk = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();

    const secretKeyMode = sk.startsWith("sk_live_")
      ? "live"
      : sk.startsWith("sk_test_")
        ? "test"
        : "unknown";
    const publishableKeyMode = pk.startsWith("pk_live_")
      ? "live"
      : pk.startsWith("pk_test_")
        ? "test"
        : "unknown";
    const keysMatch = secretKeyMode === publishableKeyMode;

    if (!sk) {
      return NextResponse.json({
        ok: false,
        error: "STRIPE_SECRET_KEY is not set",
        secretKeyMode: null,
        publishableKeyMode: publishableKeyMode || null,
        keysMatch: false,
      });
    }

    const stripe = new Stripe(sk);
    const customers = await stripe.customers.list({ limit: 10 });
    const customerList = customers.data.map((c) => ({ id: c.id, email: c.email ?? null }));

    return NextResponse.json({
      ok: true,
      secretKeyMode,
      publishableKeyMode: pk ? publishableKeyMode : null,
      keysMatch,
      customersFound: customers.data.length,
      customers: customerList,
      message: keysMatch
        ? `Keys are ${secretKeyMode}. Server can see ${customers.data.length} customer(s).`
        : "Secret and publishable key mode differ (test vs live).",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        secretKeyMode: null,
        publishableKeyMode: null,
        keysMatch: false,
      },
      { status: 500 },
    );
  }
}
