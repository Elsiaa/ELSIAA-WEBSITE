import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/lib/projects";
import { getProjectAuthDeviceCount } from "@/lib/project-auth-devices";
import {
  requireCompanyAccessOrSupportAgentAuthorizations,
  requireSuperAdminOrSupportAgentAuthorizations,
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects/[id]/device-limit
 * deviceLimit + deviceCount (active+paused) for this project.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);

    const deviceCount = await getProjectAuthDeviceCount(projectId);
    return NextResponse.json({
      deviceLimit: project.deviceLimit ?? null,
      deviceCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get device limit";
    if (message.includes("Forbidden") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]/device-limit
 * Body: { device_limit: number | null }. Super admin only.
 */
export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await requireSuperAdminOrSupportAgentAuthorizations(project.companyId);

    const body = await req.json();
    if (body.device_limit === undefined) {
      return NextResponse.json(
        { error: "device_limit is required (number or null)" },
        { status: 400 },
      );
    }

    let deviceLimit: number | null;
    if (body.device_limit === null || body.device_limit === "") {
      deviceLimit = null;
    } else {
      const n = Number(body.device_limit);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json(
          { error: "device_limit must be a non-negative integer or null" },
          { status: 400 },
        );
      }
      deviceLimit = n;
    }

    const updated = await updateProject(projectId, { deviceLimit });
    if (!updated) {
      return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
    }

    const deviceCount = await getProjectAuthDeviceCount(projectId);
    return NextResponse.json({
      deviceLimit: updated.deviceLimit ?? null,
      deviceCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update device limit";
    if (message.includes("Forbidden") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
