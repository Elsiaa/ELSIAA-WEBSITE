import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessProjectProgramLogs } from "@/lib/permissions";
import { getProjectById } from "@/lib/projects";
import { listProjectProgramLogs, resolveProgramLogDateRange } from "@/lib/project-program-logs";

/**
 * GET /api/projects/[id]/program-logs?from=YYYY-MM-DD&to=YYYY-MM-DD&limit=200
 * List ingested program logs for a project (default date range: last 7 days).
 * Super admin, company admin, or support agent with program_logs grant.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!(await canAccessProjectProgramLogs(project.companyId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const limitRaw = url.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : undefined;
    const fromYmd = url.searchParams.get("from") || undefined;
    const toYmd = url.searchParams.get("to") || undefined;
    const range = resolveProgramLogDateRange({ fromYmd, toYmd });

    const logs = await listProjectProgramLogs(projectId, {
      limit,
      fromYmd: range.fromYmd,
      toYmd: range.toYmd,
    });

    return NextResponse.json({
      logs,
      range: { from: range.fromYmd, to: range.toYmd },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to list logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
