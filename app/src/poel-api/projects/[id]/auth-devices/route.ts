import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parseProjectApiKey } from '@/lib/project-api-key';
import { getProjectByApiKey, getProjectById } from '@/lib/projects';
import { getProjectAuthDevices, createProjectAuthDevice, getProjectAuthDeviceCount } from '@/lib/project-auth-devices';
import { requireCompanyAccessOrSupportAgentAuthorizations, isSuperAdmin } from '@/lib/permissions';
import { normalizeAppFeatures, parseAppFeaturesPartial } from '@/lib/app-features';

/**
 * GET /api/projects/[id]/auth-devices
 * List auth devices for a project.
 *
 * Auth (either):
 * - Same as other admin routes: signed-in company admin / super admin (session cookie), or
 * - Project API key: `x-project-api-key` or `Authorization: Bearer <key>` must belong to this project id.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const rawApiKey =
      request.headers.get('x-project-api-key')?.trim() ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() ||
      '';

    if (rawApiKey) {
      const parsedKey = parseProjectApiKey(rawApiKey);
      const projectForKey = parsedKey ? await getProjectByApiKey(parsedKey.lookupKey) : null;
      if (!projectForKey || projectForKey.id !== projectId) {
        return NextResponse.json(
          { error: 'Invalid project API key for this project' },
          { status: 403 }
        );
      }
      const devices = await getProjectAuthDevices(projectId);
      return NextResponse.json({ devices });
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const superAdmin = await isSuperAdmin();
    if (!superAdmin) {
      await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);
    }

    const devices = await getProjectAuthDevices(projectId, { includeAdminDevices: superAdmin });
    return NextResponse.json({ devices });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to list auth devices';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/auth-devices
 * Add an auth device. Body: { name?, deviceId?, isAdminDevice?, features? }.
 * At least one of name or deviceId required. Company admin or super admin only.
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

    const body = await request.json();
    const rawName = body?.name;
    const rawDeviceId = body?.deviceId;
    const name = typeof rawName === 'string' ? rawName.trim() : '';
    const deviceId = typeof rawDeviceId === 'string' ? rawDeviceId.trim() : '';

    if (!name && !deviceId) {
      return NextResponse.json({ error: 'Provide at least one of name or device ID' }, { status: 400 });
    }

    const wantsAdminDevice = body?.isAdminDevice === true;
    if (wantsAdminDevice && !superAdmin) {
      return NextResponse.json({ error: 'Only super admins can create admin devices' }, { status: 403 });
    }

    if (!wantsAdminDevice && project.deviceLimit != null) {
      const currentCount = await getProjectAuthDeviceCount(projectId);
      if (currentCount >= project.deviceLimit) {
        return NextResponse.json(
          { error: `Device limit reached (${project.deviceLimit}) for this project. Contact your administrator to increase the limit.` },
          { status: 403 }
        );
      }
    }

    let features = null as ReturnType<typeof normalizeAppFeatures> | null;
    if (body.features !== undefined && body.features !== null) {
      const parsed = parseAppFeaturesPartial(body.features);
      if (parsed === null) {
        return NextResponse.json({ error: 'features must be an object or null' }, { status: 400 });
      }
      const cleaned = normalizeAppFeatures(parsed);
      features = Object.keys(cleaned).length === 0 ? null : cleaned;
    }

    const device = await createProjectAuthDevice({
      projectId,
      name: name || deviceId,
      deviceId: deviceId || undefined,
      createdByClerkUserId: userId,
      isAdminDevice: wantsAdminDevice,
      features,
    });

    if (!device) {
      return NextResponse.json({ error: 'Failed to create device' }, { status: 500 });
    }

    return NextResponse.json({ device }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add auth device';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
