import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProjectById, updateProject } from "@/lib/projects";
import { requireSuperAdminOrSupportAgentAuthorizations } from "@/lib/permissions";

/**
 * PATCH /api/projects/[id]/access-override
 * Set project access override: "allowed" | "blocked" | null (follow typical rules).
 * Super admin only. Overrides entitlement for this project regardless of payment status.
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    try {
      await requireSuperAdminOrSupportAgentAuthorizations(project.companyId);
    } catch {
      return NextResponse.json(
        { error: "Only super admins or authorized support agents can set access override" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const accessOverride = body.accessOverride;
    if (
      accessOverride !== undefined &&
      accessOverride !== null &&
      accessOverride !== "allowed" &&
      accessOverride !== "blocked"
    ) {
      return NextResponse.json(
        { error: 'accessOverride must be "allowed", "blocked", or null' },
        { status: 400 },
      );
    }

    const updated = await updateProject(projectId, {
      accessOverride:
        accessOverride === null || accessOverride === undefined ? null : accessOverride,
    });
    if (!updated) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    return NextResponse.json({ accessOverride: updated.accessOverride ?? null });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update access override";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
