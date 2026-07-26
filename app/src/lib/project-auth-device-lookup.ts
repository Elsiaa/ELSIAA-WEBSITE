import { getServerSupabaseClient } from './supabase';
import type { ProjectAuthDevice } from './project-auth-devices';
import type { AppFeatures } from './app-features';
import { normalizeAppFeatures, parseAppFeaturesPartial } from './app-features';

type Row = {
  id: string;
  project_id: string;
  name: string;
  device_id: string;
  status: string;
  is_admin_device?: boolean;
  features?: unknown | null;
  created_by_clerk_user_id: string | null;
  created_at: string;
  updated_at: string;
};

function rowFeatures(raw: unknown): AppFeatures | null {
  if (raw === null || raw === undefined) return null;
  const parsed = parseAppFeaturesPartial(raw);
  if (parsed === null) return null;
  const cleaned = normalizeAppFeatures(parsed);
  return Object.keys(cleaned).length === 0 ? null : cleaned;
}

function rowToDevice(row: Row): ProjectAuthDevice {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    deviceId: row.device_id,
    status: row.status as ProjectAuthDevice['status'],
    isAdminDevice: Boolean(row.is_admin_device),
    features: rowFeatures(row.features),
    createdByClerkUserId: row.created_by_clerk_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Find an active auth device for this project matching the external device_id string.
 */
export async function findActiveDeviceByExternalId(
  projectId: string,
  externalDeviceId: string
): Promise<ProjectAuthDevice | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('project_auth_devices')
    .select('*')
    .eq('project_id', projectId)
    .eq('device_id', externalDeviceId.trim())
    .eq('status', 'active')
    .maybeSingle();

  if (error || !data) return null;
  return rowToDevice(data as Row);
}
