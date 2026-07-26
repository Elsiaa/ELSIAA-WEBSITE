import { getServerSupabaseClient } from './supabase';
import type { AppFeatures } from './app-features';
import { normalizeAppFeatures, parseAppFeaturesPartial } from './app-features';

export interface ProjectAuthDevice {
  id: string;
  projectId: string;
  name: string;
  deviceId: string;
  status: 'active' | 'paused' | 'pending';
  isAdminDevice: boolean;
  /** Open-ended feature overrides for this device; null = inherit project defaults. */
  features: AppFeatures | null;
  createdByClerkUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

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
    status: row.status as 'active' | 'paused' | 'pending',
    isAdminDevice: Boolean(row.is_admin_device),
    features: rowFeatures(row.features),
    createdByClerkUserId: row.created_by_clerk_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Active/paused devices that count toward device_limit (excludes admin devices). */
export function deviceCountsTowardQuota(device: Pick<ProjectAuthDevice, 'status' | 'isAdminDevice'>): boolean {
  return !device.isAdminDevice && (device.status === 'active' || device.status === 'paused');
}

/** Active admin devices bypass payment rules and project accessOverride blocked (must present deviceId on entitlement/extension calls). */
export function activeAdminDeviceBypassesEntitlement(
  device: Pick<ProjectAuthDevice, 'isAdminDevice' | 'status'> | null | undefined
): boolean {
  return Boolean(device?.isAdminDevice && device.status === 'active');
}

export async function getProjectAuthDevices(
  projectId: string,
  options?: { includeAdminDevices?: boolean }
): Promise<ProjectAuthDevice[]> {
  const includeAdminDevices = options?.includeAdminDevices ?? false;
  const supabase = getServerSupabaseClient();
  let query = supabase.from('project_auth_devices').select('*').eq('project_id', projectId);
  if (!includeAdminDevices) {
    query = query.eq('is_admin_device', false);
  }
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching project auth devices:', error);
    return [];
  }
  return (data || []).map((r) => rowToDevice(r as Row));
}

/** One query for many projects (fallback when RPC is unavailable). */
export async function getAuthDevicesGroupedByProjectId(
  projectIds: string[],
  options?: { includeAdminDevices?: boolean }
): Promise<Record<string, ProjectAuthDevice[]>> {
  if (projectIds.length === 0) return {};
  const includeAdminDevices = options?.includeAdminDevices ?? false;
  const supabase = getServerSupabaseClient();
  let query = supabase.from('project_auth_devices').select('*').in('project_id', projectIds);
  if (!includeAdminDevices) {
    query = query.eq('is_admin_device', false);
  }
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error batch-fetching auth devices:', error);
    return {};
  }

  const byProject: Record<string, ProjectAuthDevice[]> = {};
  for (const id of projectIds) byProject[id] = [];
  for (const r of data || []) {
    const row = r as Row;
    const pid = row.project_id;
    if (!byProject[pid]) byProject[pid] = [];
    byProject[pid].push(rowToDevice(row));
  }
  for (const id of projectIds) {
    (byProject[id] || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return byProject;
}

/** Counts active + paused non-admin devices (same basis as quota enforcement). Pending excluded. */
export async function getProjectAuthDeviceCount(projectId: string): Promise<number> {
  const supabase = getServerSupabaseClient();
  const { count, error } = await supabase
    .from('project_auth_devices')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('is_admin_device', false)
    .in('status', ['active', 'paused']);

  if (error) {
    console.error('Error counting project auth devices:', error);
    return 0;
  }
  return count || 0;
}

export async function createProjectAuthDevice(params: {
  projectId: string;
  name: string;
  deviceId?: string;
  createdByClerkUserId?: string;
  isAdminDevice?: boolean;
  features?: AppFeatures | null;
}): Promise<ProjectAuthDevice | null> {
  const supabase = getServerSupabaseClient();
  const insert: Record<string, unknown> = {
    project_id: params.projectId,
    name: params.name,
    status: 'active',
    is_admin_device: Boolean(params.isAdminDevice),
  };
  if (params.deviceId) insert.device_id = params.deviceId;
  if (params.createdByClerkUserId) insert.created_by_clerk_user_id = params.createdByClerkUserId;
  if (params.features !== undefined) {
    insert.features =
      params.features && Object.keys(params.features).length > 0 ? params.features : null;
  }

  const { data, error } = await supabase
    .from('project_auth_devices')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('Error creating project auth device:', error);
    return null;
  }
  return rowToDevice(data as Row);
}

export async function updateProjectAuthDeviceStatus(
  deviceId: string,
  status: 'active' | 'paused' | 'pending'
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('project_auth_devices')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', deviceId);

  if (error) {
    console.error('Error updating project auth device status:', error);
    return false;
  }
  return true;
}

async function randomDeviceIdValue(): Promise<string> {
  const crypto = await import('crypto');
  return crypto.randomBytes(24).toString('hex');
}

/** Another row in the same project with this device_id (excluding excludeDeviceId). */
export async function projectHasAuthDeviceWithExternalId(
  projectId: string,
  externalDeviceId: string,
  excludeDeviceId?: string
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  let q = supabase
    .from('project_auth_devices')
    .select('id')
    .eq('project_id', projectId)
    .eq('device_id', externalDeviceId.trim())
    .limit(1);
  if (excludeDeviceId) {
    q = q.neq('id', excludeDeviceId);
  }
  const { data, error } = await q;
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

export type UpdateProjectAuthDeviceInput = {
  name?: string;
  /** Trimmed value, or empty string to assign a new random device_id. Omit to leave unchanged. */
  deviceId?: string;
  status?: 'active' | 'paused' | 'pending';
  isAdminDevice?: boolean;
  /** Pass null to clear device overrides; omit to leave unchanged. */
  features?: AppFeatures | null;
};

export type UpdateProjectAuthDeviceResult =
  | { ok: true; device: ProjectAuthDevice }
  | { ok: false; code: 'not_found' | 'duplicate_device_id' | 'db_error' | 'empty_name' };

/**
 * Patch name, device_id, and/or status.
 * Enforces non-empty name and unique (project_id, device_id).
 */
export async function updateProjectAuthDevice(
  deviceId: string,
  updates: UpdateProjectAuthDeviceInput
): Promise<UpdateProjectAuthDeviceResult> {
  const existing = await getProjectAuthDeviceById(deviceId);
  if (!existing) {
    return { ok: false, code: 'not_found' };
  }

  let nextName = existing.name;
  if (updates.name !== undefined) {
    const trimmed = updates.name.trim();
    if (!trimmed) {
      return { ok: false, code: 'empty_name' };
    }
    nextName = trimmed;
  }

  let nextDeviceId = existing.deviceId;
  if (updates.deviceId !== undefined) {
    const trimmed = updates.deviceId.trim();
    nextDeviceId = trimmed === '' ? await randomDeviceIdValue() : trimmed;
    if (nextDeviceId !== existing.deviceId) {
      const taken = await projectHasAuthDeviceWithExternalId(existing.projectId, nextDeviceId, deviceId);
      if (taken) {
        return { ok: false, code: 'duplicate_device_id' };
      }
    }
  }

  let nextStatus = existing.status;
  if (updates.status !== undefined) {
    nextStatus = updates.status;
  }

  let nextIsAdminDevice = existing.isAdminDevice;
  if (updates.isAdminDevice !== undefined) {
    nextIsAdminDevice = updates.isAdminDevice;
  }

  let nextFeatures = existing.features;
  if (updates.features !== undefined) {
    nextFeatures =
      updates.features && Object.keys(updates.features).length > 0 ? updates.features : null;
  }

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('project_auth_devices')
    .update({
      name: nextName,
      device_id: nextDeviceId,
      status: nextStatus,
      is_admin_device: nextIsAdminDevice,
      features: nextFeatures,
      updated_at: new Date().toISOString(),
    })
    .eq('id', deviceId)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, code: 'duplicate_device_id' };
    }
    console.error('Error updating project auth device:', error);
    return { ok: false, code: 'db_error' };
  }

  return { ok: true, device: rowToDevice(data as Row) };
}

export async function deleteProjectAuthDevice(deviceId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('project_auth_devices').delete().eq('id', deviceId);

  if (error) {
    console.error('Error deleting project auth device:', error);
    return false;
  }
  return true;
}

export async function createPendingDeviceRequest(params: {
  projectId: string;
  name: string;
  deviceId?: string;
}): Promise<ProjectAuthDevice | null> {
  const supabase = getServerSupabaseClient();
  const insert: Record<string, unknown> = {
    project_id: params.projectId,
    name: params.name,
    status: 'pending',
  };
  if (params.deviceId) insert.device_id = params.deviceId;

  const { data, error } = await supabase
    .from('project_auth_devices')
    .insert(insert)
    .select()
    .single();

  if (error) {
    console.error('Error creating pending device request:', error);
    return null;
  }
  return rowToDevice(data as Row);
}

export async function getProjectAuthDeviceById(deviceId: string): Promise<ProjectAuthDevice | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('project_auth_devices')
    .select('*')
    .eq('id', deviceId)
    .maybeSingle();

  if (error || !data) return null;
  return rowToDevice(data as Row);
}
