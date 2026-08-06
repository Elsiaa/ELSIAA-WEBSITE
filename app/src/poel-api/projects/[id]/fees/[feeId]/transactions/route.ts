import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCompanyAdmin } from "@/lib/permissions";
import { getProjectFeeTransactions } from "@/lib/project-payments";
import { getProjectById } from "@/lib/projects";

export async function GET(
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

    const transactions = await getProjectFeeTransactions(feeId);
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("Error fetching fee transactions:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch fee transactions" }, { status: 500 });
  }
}
