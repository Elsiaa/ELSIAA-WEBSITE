import { NextRequest, NextResponse } from 'next/server';
import { getProjectById } from '@/lib/projects';
import { getExtensionSource, upsertExtensionSource } from '@/lib/project-extension-sources';
import { requireCompanyAccessOrSupportAgentAuthorizations } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/projects/[id]/github-ref
 * Updates the selected GitHub ref (version) for a project's extension source.
 * Body: { ref: string }
 */
export async function PATCH(
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

    const body = await req.json().catch(() => ({}));
    const newRef = typeof body.ref === 'string' ? body.ref.trim() : '';

    if (!newRef) {
      return NextResponse.json({ error: 'Valid ref is required' }, { status: 400 });
    }

    const source = await getExtensionSource(projectId);
    if (!source) {
      return NextResponse.json({ error: 'GitHub repository not configured for this project' }, { status: 400 });
    }

    const saved = await upsertExtensionSource({
      projectId,
      githubOwner: source.githubOwner,
      githubRepo: source.githubRepo,
      githubRef: newRef,
    });

    if (!saved) {
      return NextResponse.json({ error: 'Failed to update extension source ref' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ref: saved.githubRef,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update GitHub ref';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
