import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { requireCompanyAdmin, requireSuperAdmin } from "@/lib/permissions";
import {
  getProjectSubscriptions,
  createProjectSubscription,
  deleteProjectSubscription,
} from "@/lib/project-payments";
import { getProjectById } from "@/lib/projects";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await context.params;

    // Verify project exists and user has access
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user is company admin for this company
    await requireCompanyAdmin(project.companyId);

    const subscriptions = await getProjectSubscriptions(projectId);
    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error("Error fetching project subscriptions:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to fetch project subscriptions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only superadmin can create subscriptions (company admins are clients, they don't create subscriptions)
    await requireSuperAdmin();

    const { id: projectId } = await context.params;

    // Verify project exists
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, amount, billingInterval, billingDayOfMonth, billingDayOfWeek } = body;

    if (!name || !amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid name or amount" }, { status: 400 });
    }

    const subscription = await createProjectSubscription({
      projectId,
      companyId: project.companyId,
      name,
      amount,
      billingInterval: billingInterval || "monthly",
      billingDayOfMonth: billingDayOfMonth != null ? Number(billingDayOfMonth) : undefined,
      billingDayOfWeek: billingDayOfWeek != null ? Number(billingDayOfWeek) : undefined,
      createdByClerkUserId: userId,
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project subscription:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to create project subscription" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only superadmin can delete subscriptions
    await requireSuperAdmin();

    const body = await request.json();
    const { subscriptionId, projectId } = body;

    if (!subscriptionId || !projectId) {
      return NextResponse.json(
        { error: "Subscription ID and Project ID are required" },
        { status: 400 },
      );
    }

    await deleteProjectSubscription(subscriptionId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting project subscription:", error);
    if (error.message.includes("Forbidden") || error.message.includes("Unauthorized")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete project subscription" }, { status: 500 });
  }
}
