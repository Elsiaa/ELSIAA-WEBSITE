import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/projects';
import { requireCompanyAccessOrSupportAgentAuthorizations, isSuperAdminOrAuthorizationsElevated } from '@/lib/permissions';
import { getGithubCommitsPage } from '@/lib/project-github-status-data';
import { GITHUB_STATUS_COMMIT_LIMIT } from '@/lib/github-dynamic-repo';

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/github-commits?offset=50&limit=50
 * Paginated commits for the software version dropdown (load more).
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);

    const { searchParams } = new URL(req.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10) || 0);
    const limitRaw = parseInt(searchParams.get('limit') ?? String(GITHUB_STATUS_COMMIT_LIMIT), 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(1, limitRaw), 100)
      : GITHUB_STATUS_COMMIT_LIMIT;

    const superUser = await isSuperAdminOrAuthorizationsElevated(project.companyId);
    const payload = await getGithubCommitsPage(projectId, superUser, offset, limit);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load commits';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
