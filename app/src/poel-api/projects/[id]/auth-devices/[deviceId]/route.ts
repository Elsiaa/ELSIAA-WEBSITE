import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProjectById } from '@/lib/projects';
import {
  getProjectAuthDeviceById,
  updateProjectAuthDevice,
  deleteProjectAuthDevice,
  getProjectAuthDeviceCount,
  type UpdateProjectAuthDeviceInput,
} from '@/lib/project-auth-devices';
import { requireCompanyAccessOrSupportAgentAuthorizations, isSuperAdmin } from '@/lib/permissions';
import { normalizeAppFeatures, parseAppFeaturesPartial } from '@/lib/app-features';

async function assertProjectAccess(projectId: string) {
  const project = await getProjectById(projectId);
  if (!project) return null;
  const superAdmin = await isSuperAdmin();
  if (!superAdmin) {
    await requireCompanyAccessOrSupportAgentAuthorizations(project.companyId);
  }
  return project;
}

/**
 * PATCH /api/projects/[id]/auth-devices/[deviceId]
 * Body: at least one of { status: 'active' | 'paused', name: string, deviceId: string }.
 * deviceId: external id; empty string assigns a new random id. Company admin or super admin only.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, deviceId } = await context.params;
    await assertProjectAccess(projectId);

    const superAdmin = await isSuperAdmin();

    const device = await getProjectAuthDeviceById(deviceId);
    if (!device || device.projectId !== projectId) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }
    if (device.isAdminDevice && !superAdmin) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const body = await request.json();
    const hasName = Object.prototype.hasOwnProperty.call(body, 'name');
    const hasDeviceId = Object.prototype.hasOwnProperty.call(body, 'deviceId');
    const hasStatus = Object.prototype.hasOwnProperty.call(body, 'status');
    const hasIsAdminDevice = Object.prototype.hasOwnProperty.call(body, 'isAdminDevice');
    const hasFeatures = Object.prototype.hasOwnProperty.call(body, 'features');

    if (!hasName && !hasDeviceId && !hasStatus && !hasIsAdminDevice && !hasFeatures) {
      return NextResponse.json(
        { error: 'Provide at least one of name, deviceId, status, isAdminDevice, or features' },
        { status: 400 }
      );
    }

    if (hasIsAdminDevice && !superAdmin) {
      return NextResponse.json({ error: 'Only super admins can change admin device flag' }, { status: 403 });
    }

    if (hasStatus) {
      const status = body.status;
      if (status !== 'active' && status !== 'paused') {
        return NextResponse.json({ error: 'status must be active or paused' }, { status: 400 });
      }
    }

    if (hasName && typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 });
    }

    if (hasDeviceId && body.deviceId != null && typeof body.deviceId !== 'string') {
      return NextResponse.json({ error: 'deviceId must be a string' }, { status: 400 });
    }

    const nextStatus = hasStatus ? (body.status as 'active' | 'paused') : undefined;
    const willBeAdminDevice = hasIsAdminDevice ? body.isAdminDevice === true : device.isAdminDevice;

    if (device.status === 'pending' && nextStatus === 'active' && !willBeAdminDevice) {
      const proj = await getProjectById(projectId);
      if (proj?.deviceLimit != null) {
        const currentCount = await getProjectAuthDeviceCount(projectId);
        if (currentCount >= proj.deviceLimit) {
          return NextResponse.json(
            {
              error: `Device limit reached (${proj.deviceLimit}) for this project. Increase the limit or remove/pause a device before approving.`,
            },
            { status: 403 }
          );
        }
      }
    }

    const updates: UpdateProjectAuthDeviceInput = {};
    if (hasName) updates.name = body.name;
    if (hasDeviceId) updates.deviceId = body.deviceId == null ? '' : body.deviceId;
    if (hasStatus) updates.status = nextStatus;
    if (hasIsAdminDevice) updates.isAdminDevice = body.isAdminDevice === true;
    if (hasFeatures) {
      if (body.features === null) {
        updates.features = null;
      } else {
        const parsed = parseAppFeaturesPartial(body.features);
        if (parsed === null) {
          return NextResponse.json({ error: 'features must be an object or null' }, { status: 400 });
        }
        const cleaned = normalizeAppFeatures(parsed);
        updates.features = Object.keys(cleaned).length === 0 ? null : cleaned;
      }
    }

    const result = await updateProjectAuthDevice(deviceId, updates);
    if (!result.ok) {
      if (result.code === 'empty_name') {
        return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
      }
      if (result.code === 'duplicate_device_id') {
        return NextResponse.json(
          { error: 'Another device in this project already uses that device ID' },
          { status: 409 }
        );
      }
      if (result.code === 'not_found') {
        return NextResponse.json({ error: 'Device not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update device' }, { status: 500 });
    }

    return NextResponse.json({ device: result.device });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update device';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/projects/[id]/auth-devices/[deviceId]
 * Remove an auth device. Company admin or super admin only.
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; deviceId: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId, deviceId } = await context.params;
    await assertProjectAccess(projectId);

    const superAdmin = await isSuperAdmin();

    const device = await getProjectAuthDeviceById(deviceId);
    if (!device || device.projectId !== projectId) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }
    if (device.isAdminDevice && !superAdmin) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const ok = await deleteProjectAuthDevice(deviceId);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to delete device' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete device';
    if (message.includes('Forbidden') || message.includes('Unauthorized')) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
