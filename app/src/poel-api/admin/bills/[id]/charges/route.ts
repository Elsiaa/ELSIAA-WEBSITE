import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from "@/lib/permissions";
import { getBillById, getBillCharges } from "@/lib/bills";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSuperAdmin = await checkSuperAdmin();
    const dbUser = await getCurrentUser();
    const { id } = await params;

    const bill = await getBillById(id);
    if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!isSuperAdmin) {
      if (!dbUser?.company_id || dbUser.role !== "admin" || bill.companyId !== dbUser.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const charges = await getBillCharges(id);
    return NextResponse.json({ charges });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch charges" }, { status: 500 });
  }
}
