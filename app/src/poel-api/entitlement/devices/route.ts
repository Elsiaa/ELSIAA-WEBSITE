import { NextRequest, NextResponse } from 'next/server';
import { getParsedProjectApiKeyFromRequest } from '@/lib/project-api-key';
import { getProjectByApiKey } from '@/lib/projects';
import { getProjectAuthDevices } from '@/lib/project-auth-devices';

/**
 * GET /api/entitlement/devices
 * List auth devices for the project resolved by API key (same project as entitlement).
 * Auth: x-project-api-key or Authorization: Bearer <project_api_key>
 *
 * For integrations that cannot use cookie-based GET /api/projects/[id]/auth-devices.
 * Response: { devices: Array<{ id, name, deviceId, status, features, createdAt, updatedAt }> }
 */
export async function GET(request: NextRequest) {
  try {
    const parsedKey = getParsedProjectApiKeyFromRequest(request);
    if (!parsedKey) {
      return NextResponse.json({ error: 'Missing project API key' }, { status: 401 });
    }

    const project = await getProjectByApiKey(parsedKey.lookupKey);
    if (!project) {
      return NextResponse.json({ error: 'Invalid project API key' }, { status: 403 });
    }

    const rows = await getProjectAuthDevices(project.id);
    const devices = rows.map((d) => ({
      id: d.id,
      name: d.name,
      deviceId: d.deviceId,
      status: d.status,
      isAdminDevice: d.isAdminDevice,
      features: d.features ?? null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Entitlement devices list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
