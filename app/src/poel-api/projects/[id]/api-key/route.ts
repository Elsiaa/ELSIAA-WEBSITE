import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById, regenerateProjectApiKey } from '@/lib/projects';
import { requireCompanyAccessOrSupportAgentAuthorizations, isSuperAdmin } from '@/lib/permissions';

/**
 * GET /api/projects/[id]/api-key
 * Reveal project API key (for entitlement). Company admin for this project or super admin only.
 */
export async function GET(
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

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);
    }

    return NextResponse.json({
      hasKey: !!project.apiKey,
      apiKey: project.apiKey || undefined,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get API key';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/api-key
 * Regenerate project API key. Returns the new key (show once to user). Company admin or super admin only.
 */
export async function POST(
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

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);
    }

    const newKey = await regenerateProjectApiKey(projectId);
    if (!newKey) {
      return NextResponse.json({ error: 'Failed to regenerate API key' }, { status: 500 });
    }

    return NextResponse.json({ apiKey: newKey });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to regenerate API key';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
