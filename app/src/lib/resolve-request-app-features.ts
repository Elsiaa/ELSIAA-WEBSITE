import type { Project } from '@/lib/projects';
import { findActiveDeviceByExternalId } from '@/lib/project-auth-device-lookup';
import {
  parseAppFeaturesPartial,
  resolveAppFeatures,
  type AppFeatures,
} from '@/lib/app-features';

function featuresFromRow(features: unknown): AppFeatures | null {
  if (features === null || features === undefined) return null;
  return parseAppFeaturesPartial(features);
}

function getExternalDeviceIdFromRequest(request: Request): string {
  const url = new URL(request.url);
  return (
    request.headers.get('x-device-id')?.trim() ||
    url.searchParams.get('deviceId')?.trim() ||
    ''
  );
}

/**
 * Resolve features for a project API request.
 * When `deviceId` / `x-device-id` matches an active auth device, that device's
 * features override the project's. Otherwise project (+ platform defaults) only.
 */
export async function resolveAppFeaturesForProjectRequest(
  project: Project,
  request: Request
): Promise<AppFeatures> {
  const externalDeviceId = getExternalDeviceIdFromRequest(request);
  let deviceFeatures: AppFeatures | null = null;

  if (externalDeviceId) {
    const device = await findActiveDeviceByExternalId(project.id, externalDeviceId);
    if (device) {
      deviceFeatures = featuresFromRow(device.features);
    }
  }

  return resolveAppFeatures({
    projectFeatures: project.features,
    deviceFeatures,
  });
}
