import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById, updateProject } from '@/lib/projects';
import { requireSuperAdminOrSupportAgentAuthorizations } from '@/lib/permissions';
import {
  DEFAULT_APP_FEATURES,
  normalizeAppFeatures,
  parseAppFeaturesPartial,
  resolveAppFeatures,
} from '@/lib/app-features';

/**
 * GET /api/projects/[id]/features
 * Returns stored project features + effective (merged with platform defaults).
 */
export async function GET(
  _request: NextRequest,
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

    return NextResponse.json({
      defaults: DEFAULT_APP_FEATURES,
      features: project.features ?? null,
      effective: resolveAppFeatures({ projectFeatures: project.features }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get features';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/projects/[id]/features
 * Body: { features: Record<string, boolean> | null }
 * Any string keys allowed (letter + alnum/underscore). Pass null to clear to platform defaults.
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
      return NextResponse.json(
        { error: 'Only super admins or authorized support agents can set project features' },
        { status: 403 }
      );
    }

    const body = await request.json();
    if (!('features' in body)) {
      return NextResponse.json({ error: 'features is required (object or null)' }, { status: 400 });
    }

    if (body.features === null) {
      const updated = await updateProject(projectId, { features: null });
      if (!updated) {
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
      }
      return NextResponse.json({
        features: null,
        effective: DEFAULT_APP_FEATURES,
      });
    }

    const parsed = parseAppFeaturesPartial(body.features);
    if (parsed === null) {
      return NextResponse.json({ error: 'features must be an object or null' }, { status: 400 });
    }

    // Store exactly the keys provided (open-ended map).
    const features = normalizeAppFeatures(parsed);
    const updated = await updateProject(projectId, {
      features: Object.keys(features).length === 0 ? null : features,
    });
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }

    return NextResponse.json({
      features: updated.features ?? null,
      effective: resolveAppFeatures({ projectFeatures: updated.features }),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update features';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
