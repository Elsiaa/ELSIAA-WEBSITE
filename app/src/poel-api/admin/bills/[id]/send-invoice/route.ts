import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSuperAdmin as checkSuperAdmin, getCurrentUser } from "@/lib/permissions";
import { getBillById, getOpenBillCharge, createBillCharge } from "@/lib/bills";
import {
  sendBillInvoiceEmail,
  sendBillPaymentMethodRequiredEmail,
} from "@/lib/bill-billing-engine";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    if (bill.collectionMode === "auto_charge") {
      if (!bill.stripePaymentMethodId) {
        let charge = await getOpenBillCharge(id);
        if (!charge) {
          charge = await createBillCharge({
            billId: id,
            amount: bill.amount,
            lineItemsSnapshot: bill.lineItems,
            status: "pending",
          });
        }
        await sendBillPaymentMethodRequiredEmail(bill, charge);
        return NextResponse.json({ success: true, emailed: "payment_method_required" });
      }
      return NextResponse.json(
        {
          error:
            "Auto-charge bills do not use payment links. The saved payment method will be charged on the due date.",
        },
        { status: 400 },
      );
    }

    let charge = await getOpenBillCharge(id);
    if (!charge) {
      charge = await createBillCharge({
        billId: id,
        amount: bill.amount,
        lineItemsSnapshot: bill.lineItems,
        status: "invoiced",
      });
    } else if (charge.status === "pending") {
      const { updateBillCharge } = await import("@/lib/bills");
      await updateBillCharge({ chargeId: charge.id, status: "invoiced" });
      charge = { ...charge, status: "invoiced" };
    }

    await sendBillInvoiceEmail(bill, charge);
    return NextResponse.json({ success: true, emailed: "invoice" });
  } catch (error) {
    console.error("[admin/bills/send-invoice]", error);
    const message = error instanceof Error ? error.message : "Failed to send invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
