import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/projects";
import {
  requireCompanyAccessOrSupportAgentAuthorizations,
  isSuperAdminOrAuthorizationsElevated,
} from "@/lib/permissions";
import { getGithubStatusForProject } from "@/lib/project-github-status-data";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects/[id]/github-status
 * Checks if the project has a GitHub repository connected and gets the latest commit date and recent commits.
 * Super admins see all commits and `deploymentVisibleFrom`; `beforeDeploymentCutoff` marks rows before that date.
 * Company admins only receive commits on/after that cutoff (plus the currently pinned ref if needed); the cutoff date is not returned.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);

    const superUser = await isSuperAdminOrAuthorizationsElevated(project.companyId);
    const payload = await getGithubStatusForProject(projectId, superUser);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get GitHub status";
    if (message.includes("Forbidden") || message.includes("Unauthorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
