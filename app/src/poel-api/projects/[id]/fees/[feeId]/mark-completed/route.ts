import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireSuperAdmin } from "@/lib/permissions";
import {
  createProjectFeeTransaction,
  getProjectFeeById,
  updateProjectFeeStatus,
} from "@/lib/project-payments";
import {
  getNextInvoiceNumber,
  getPaymentRequestById,
  updatePaymentRequestInvoiceAndStatus,
} from "@/lib/payments";

/**
 * Mark a project fee as paid manually (e.g. paid outside Stripe).
 */
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string; feeId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireSuperAdmin();

    const { id: projectId, feeId } = await context.params;
    const fee = await getProjectFeeById(feeId);

    if (!fee || fee.projectId !== projectId) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    if (fee.status !== "pending") {
      return NextResponse.json({ error: "Fee is not pending" }, { status: 400 });
    }

    const invoiceNumber = await getNextInvoiceNumber();
    await updateProjectFeeStatus(feeId, "completed", fee.paymentRequestId);
    await createProjectFeeTransaction({
      projectFeeId: feeId,
      paymentRequestId: fee.paymentRequestId,
      stripePaymentIntentId: null,
      amount: fee.amount,
      invoiceNumber,
    });

    if (fee.paymentRequestId) {
      const pr = await getPaymentRequestById(fee.paymentRequestId);
      if (pr && pr.status !== "completed") {
        await updatePaymentRequestInvoiceAndStatus(
          fee.paymentRequestId,
          invoiceNumber,
          "completed",
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Fee marked as paid",
      invoiceNumber,
    });
  } catch (error: unknown) {
    console.error("Error marking fee as paid:", error);
    const message = error instanceof Error ? error.message : "Failed to mark fee as paid";
    if (message.includes("Forbidden") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to mark fee as paid" }, { status: 500 });
  }
}
