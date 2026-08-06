import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from "@/lib/permissions";
import { getBillById } from "@/lib/bills";
import { chargeBillNow, runBillCycle } from "@/lib/bill-billing-engine";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json().catch(() => ({}));
    const payWithSavedMethod = body.payWithSavedMethod === true;

    if (bill.status === "completed") {
      return NextResponse.json({ error: "This bill has already been paid" }, { status: 400 });
    }

    if (!isSuperAdmin) {
      if (!dbUser?.company_id || dbUser.role !== "admin" || bill.companyId !== dbUser.company_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const shouldCharge =
      payWithSavedMethod ||
      bill.collectionMode === "auto_charge" ||
      bill.attachCompanyPaymentMethod;

    if (shouldCharge) {
      const result = await chargeBillNow(id, { actingUserId: dbUser?.id });
      return NextResponse.json({
        success: true,
        charged: result.charged,
        processing: result.processing,
        paymentIntentId: result.paymentIntentId,
        charge: result.charge,
        bill: await getBillById(id),
      });
    }

    const result = await runBillCycle(id, {
      sendInvoiceEmail: body.sendInvoiceEmail === true,
      force: true,
      notifyManagementOnFailure: false,
    });

    if (!result.charged && !result.emailed) {
      return NextResponse.json(
        {
          error:
            "Nothing to charge — use Send invoice for invoice-link bills without company auto-charge.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      charged: result.charged,
      emailed: result.emailed,
      charge: result.charge,
      bill: await getBillById(id),
    });
  } catch (error) {
    console.error("[admin/bills/charge-now]", error);
    const message = error instanceof Error ? error.message : "Charge failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
