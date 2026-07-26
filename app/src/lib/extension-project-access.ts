import type { Project } from './projects';
import { getProjectByApiKey } from './projects';
import { getExtensionEntitlementForProject } from './extension-project-entitlement';
import { findActiveDeviceByExternalId } from './project-auth-device-lookup';
import {
  activeAdminDeviceBypassesEntitlement,
} from './project-auth-devices';
import {
  extensionSourceForDevMode,
  getExtensionSource,
  type ProjectExtensionSource,
} from './project-extension-sources';
import { getParsedProjectApiKeyFromRequest } from './project-api-key';

export type ProjectExtensionAccessError = {
  status: number;
  body: Record<string, unknown>;
};

/** Raw API key header value (may include `=dev` suffix). Prefer {@link getParsedProjectApiKeyFromRequest}. */
export function getProjectApiKeyFromRequest(request: Request): string | null {
  return getParsedProjectApiKeyFromRequest(request)?.lookupKey ?? null;
}

/**
 * Resolve project API key, payment entitlement, optional active device (skipped when access is manually allowed), and configured GitHub source.
 * When `project.accessOverride === 'allowed'`, device checks are skipped; `deviceId` in the success result is null.
 * Active admin devices bypass payment rules and accessOverride blocked; deviceId is still required and validated.
 * API key suffix `=dev` (e.g. `<key>=dev`) serves GitHub default-branch HEAD; requires an active admin device.
 * @throws ProjectExtensionAccessError as a plain object (caller checks with instanceof or use try/catch on message - better use return discriminated union)
 */
export async function resolveProjectExtensionAccess(
  request: Request
): Promise<{ project: Project; source: ProjectExtensionSource; deviceId: string | null } | ProjectExtensionAccessError> {
  const parsedKey = getParsedProjectApiKeyFromRequest(request);
  if (!parsedKey) {
    return { status: 401, body: { error: 'Missing project API key' } };
  }

  const project = await getProjectByApiKey(parsedKey.lookupKey);
  if (!project) {
    return { status: 403, body: { error: 'Invalid project API key' } };
  }

  const devMode = parsedKey.devMode;

  const skipDevice = project.accessOverride === 'allowed';

  const url = new URL(request.url);
  const deviceIdParam = url.searchParams.get('deviceId')?.trim() ?? null;

  let resolvedDevice = null;
  if (!skipDevice) {
    if (!deviceIdParam) {
      return { status: 400, body: { error: 'deviceId query parameter is required' } };
    }

    resolvedDevice = await findActiveDeviceByExternalId(project.id, deviceIdParam);
    if (!resolvedDevice) {
      return {
        status: 403,
        body: {
          error: 'device_not_authorized',
          projectId: project.id,
          deviceIdReceived: deviceIdParam,
          message:
            'No active auth device matches this deviceId. Call POST /api/entitlement/request-device with the same deviceId, then wait for a super admin to approve.',
        },
      };
    }
  }

  if (devMode && !activeAdminDeviceBypassesEntitlement(resolvedDevice)) {
    return {
      status: 403,
      body: {
        error: 'dev_mode_requires_admin_device',
        message:
          'Append =dev to the API key only with an active admin device (same deviceId). Example: x-project-api-key: <your-key>=dev',
      },
    };
  }

  const entitlement = await getExtensionEntitlementForProject(project, { device: resolvedDevice });
  if (!entitlement.allowed) {
    return {
      status: 403,
      body: {
        error: 'entitlement_denied',
        reason: entitlement.reason,
        pendingFees: entitlement.pendingFees,
        overdueSubscriptions: entitlement.overdueSubscriptions,
        maxDaysOverdue: entitlement.maxDaysOverdue,
      },
    };
  }

  let source = await getExtensionSource(project.id);
  if (!source) {
    return {
      status: 404,
      body: { error: 'extension_repo_not_configured', message: 'Super admin has not linked a GitHub repo for this project.' },
    };
  }

  if (devMode) {
    source = await extensionSourceForDevMode(source);
  }

  return { project, source, deviceId: skipDevice ? null : deviceIdParam };
}

export function isAccessError(
  r: { project: Project; source: ProjectExtensionSource; deviceId: string | null } | ProjectExtensionAccessError
): r is ProjectExtensionAccessError {
  return 'status' in r && 'body' in r;
}
