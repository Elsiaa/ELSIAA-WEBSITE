import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getPaymentRequestById, markPaymentRequestPaidManually } from "@/lib/payments";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can mark payments as paid" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const existing = await getPaymentRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Payment request not found" }, { status: 404 });
    }

    const result = await markPaymentRequestPaidManually(id);
    const updated = await getPaymentRequestById(id);

    return NextResponse.json({
      success: true,
      message: "Payment marked as paid",
      invoiceNumber: result.invoiceNumber,
      request: updated,
    });
  } catch (error) {
    console.error("[admin/payments/mark-paid]", error);
    const message = error instanceof Error ? error.message : "Failed to mark payment as paid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
