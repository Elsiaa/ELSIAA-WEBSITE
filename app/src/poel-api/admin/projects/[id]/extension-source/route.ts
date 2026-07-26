import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById } from '@/lib/projects';
import { requireSuperAdminOrSupportAgentAuthorizations } from '@/lib/permissions';
import {
  getExtensionSource,
  upsertExtensionSource,
  deleteExtensionSource,
  updateExtensionDeploymentVisibleFrom,
} from '@/lib/project-extension-sources';
import { parseGitHubRepoUrl } from '@/lib/parse-github-repo-url';

/**
 * GET /api/admin/projects/[id]/extension-source
 * Super admin only. Returns { owner, repo, ref } or null if unset.
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
      await requireSuperAdminOrSupportAgentAuthorizations(project.companyId);
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const row = await getExtensionSource(projectId);
    if (!row) {
      return NextResponse.json({ extensionSource: null });
    }

    return NextResponse.json({
      extensionSource: {
        owner: row.githubOwner,
        repo: row.githubRepo,
        ref: row.githubRef,
        deploymentVisibleFrom: row.deploymentVisibleFrom,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load extension source';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/projects/[id]/extension-source
 * Body: { deploymentVisibleFrom: "YYYY-MM-DD" | null } — company admins only see commits on/after this date (UTC).
 * Super admin only. Extension source row must already exist.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
      await requireSuperAdminOrSupportAgentAuthorizations(project.companyId);
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (!('deploymentVisibleFrom' in body)) {
      return NextResponse.json({ error: 'deploymentVisibleFrom is required (string YYYY-MM-DD or null)' }, { status: 400 });
    }

    const raw = body.deploymentVisibleFrom;
    let value: string | null;
    if (raw === null || raw === '') {
      value = null;
    } else if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      value = raw;
    } else {
      return NextResponse.json({ error: 'deploymentVisibleFrom must be YYYY-MM-DD or null' }, { status: 400 });
    }

    const existing = await getExtensionSource(projectId);
    if (!existing) {
      return NextResponse.json(
        { error: 'Link a GitHub repository for this project before setting a deployment date' },
        { status: 400 }
      );
    }

    const ok = await updateExtensionDeploymentVisibleFrom(projectId, value);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to save deployment date' }, { status: 500 });
    }

    return NextResponse.json({ deploymentVisibleFrom: value });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update deployment date';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/admin/projects/[id]/extension-source
 * Body: { githubRepoUrl: string } or { clear: true }
 * Super admin only.
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    try {
      await requireSuperAdminOrSupportAgentAuthorizations(project.companyId);
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.clear === true) {
      const ok = await deleteExtensionSource(projectId);
      if (!ok) {
        return NextResponse.json({ error: 'Failed to clear extension source' }, { status: 500 });
      }
      return NextResponse.json({ extensionSource: null });
    }

    const url = typeof body.githubRepoUrl === 'string' ? body.githubRepoUrl : '';
    const parsed = parseGitHubRepoUrl(url);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid githubRepoUrl. Use https://github.com/owner/repo or .../tree/branch' },
        { status: 400 }
      );
    }

    const saved = await upsertExtensionSource({
      projectId,
      githubOwner: parsed.owner,
      githubRepo: parsed.repo,
      githubRef: parsed.ref,
    });

    if (!saved) {
      return NextResponse.json({ error: 'Failed to save extension source' }, { status: 500 });
    }

    return NextResponse.json({
      extensionSource: {
        owner: saved.githubOwner,
        repo: saved.githubRepo,
        ref: saved.githubRef,
        deploymentVisibleFrom: saved.deploymentVisibleFrom,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save extension source';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
