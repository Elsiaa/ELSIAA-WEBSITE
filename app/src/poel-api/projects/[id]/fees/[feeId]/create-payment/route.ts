import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCompanyAdmin } from "@/lib/permissions";
import { getProjectFees, updateProjectFeeStatus } from "@/lib/project-payments";
import { getProjectById } from "@/lib/projects";
import { createPaymentRequest } from "@/lib/payments";
import { getCurrentUser } from "@/lib/permissions";

/**
 * Create a payment request for a project fee
 * Company admins can initiate payment for their fees
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; feeId: string }> },
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId, feeId } = await context.params;

    // Verify project exists and user has access
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is company admin for this company
    await requireCompanyAdmin(project.companyId);

    // Get the fee
    const fees = await getProjectFees(projectId);
    const fee = fees.find((f) => f.id === feeId);

    if (!fee) {
      return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    }

    if (fee.status === "completed") {
      return NextResponse.json({ error: "Fee already paid" }, { status: 400 });
    }

    // Get current user for recipient info
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create payment request linked to this fee
    const paymentRequest = await createPaymentRequest({
      userId: currentUser.id,
      recipientEmail: currentUser.email,
      recipientName:
        `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() ||
        currentUser.email,
      amount: fee.amount,
      createdByClerkUserId: userId,
      paymentType: "one_time",
    });

    // Link payment request to fee
    await updateProjectFeeStatus(feeId, "pending", paymentRequest.id);

    return NextResponse.json(
      {
        paymentRequest,
        paymentUrl: `/payments?public_token=${paymentRequest.public_token}`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating payment request for fee:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create payment request" }, { status: 500 });
  }
}
