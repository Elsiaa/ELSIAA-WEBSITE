import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getBillById, markBillPaidManually } from "@/lib/bills";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Only super admins can mark bills as paid" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const bill = await getBillById(id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const result = await markBillPaidManually(id);
    const updated = await getBillById(id);

    return NextResponse.json({
      success: true,
      message: "Bill marked as paid",
      invoiceNumber: result.invoiceNumber,
      bill: updated,
    });
  } catch (error) {
    console.error("[admin/bills/mark-paid]", error);
    const message = error instanceof Error ? error.message : "Failed to mark bill as paid";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
