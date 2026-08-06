import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin } from "@/lib/permissions";
import { getBillById, updateBillStatus, recordBillEvent } from "@/lib/bills";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await checkSuperAdmin())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const bill = await getBillById(id);
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await updateBillStatus(id, "active");
    await recordBillEvent({ billId: id, eventType: "resumed", message: "Bill resumed" });
    return NextResponse.json({ bill: await getBillById(id) });
  } catch (error) {
    return NextResponse.json({ error: "Failed to resume bill" }, { status: 500 });
  }
}
