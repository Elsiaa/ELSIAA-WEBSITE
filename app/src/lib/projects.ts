import { getServerSupabaseClient } from './supabase';
import type { AppFeatures } from './app-features';
import { parseAppFeaturesPartial, normalizeAppFeatures } from './app-features';

export interface Project {
  id: string;
  companyId: string; // Company that owns this project
  userId?: string; // Legacy field - will be deprecated
  title: string;
  url: string;
  description?: string;
  /** Secret key for entitlement API; external sites use it to check if project company is paid up. */
  apiKey?: string | null;
  /** When set, overrides payment-based entitlement: "allowed" = always allow, "blocked" = always deny. Null = follow typical rules. */
  accessOverride?: 'allowed' | 'blocked' | null;
  /** Max active+paused auth devices for this project; null = unlimited. */
  deviceLimit?: number | null;
  /**
   * Open-ended product feature flags for extension/auth clients (`Record<string, boolean>`).
   * Null = use platform defaults only. When set, that map is stored as-is (any keys).
   */
  features?: AppFeatures | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStore {
  [userId: string]: Project[];
}

// Database row type (snake_case from Supabase)
type ProjectRow = {
  id: string;
  company_id: string;
  user_id?: string; // Legacy field
  title: string;
  url: string;
  description: string | null;
  api_key: string | null;
  access_override: string | null;
  device_limit?: number | null;
  features?: unknown | null;
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

/**
 * Convert database row to Project object (snake_case to camelCase)
 */
function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    companyId: row.company_id,
    userId: row.user_id, // Legacy field
    title: row.title,
    url: row.url,
    description: row.description || undefined,
    apiKey: row.api_key ?? undefined,
    accessOverride: row.access_override === 'allowed' || row.access_override === 'blocked' ? row.access_override : null,
    deviceLimit: row.device_limit ?? null,
    features: rowFeatures(row.features),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert Project object to database row (camelCase to snake_case)
 */
function projectToRow(project: Partial<Project>): Partial<ProjectRow> {
  const row: Partial<ProjectRow> = {};

  if (project.id !== undefined) row.id = project.id;
  if (project.companyId !== undefined) row.company_id = project.companyId;
  if (project.userId !== undefined) row.user_id = project.userId; // Legacy field
  if (project.title !== undefined) row.title = project.title;
  if (project.url !== undefined) row.url = project.url;
  if (project.description !== undefined) row.description = project.description || null;
  if (project.createdAt !== undefined) row.created_at = project.createdAt;
  if (project.updatedAt !== undefined) row.updated_at = project.updatedAt;
  if (project.apiKey !== undefined) row.api_key = project.apiKey || null;
  if (project.accessOverride !== undefined) row.access_override = project.accessOverride || null;
  if (project.deviceLimit !== undefined) row.device_limit = project.deviceLimit;
  if (project.features !== undefined) row.features = project.features;

  return row;
}

/**
 * Get all projects for a specific company
 */
export async function getCompanyProjects(companyId: string): Promise<Project[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map(rowToProject);
  } catch (error) {
    return [];
  }
}

/**
 * Get all projects for a specific user (LEGACY - kept for backward compatibility)
 * @deprecated Use getCompanyProjects instead
 */
export async function getUserProjects(userId: string): Promise<Project[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return (data || []).map(rowToProject);
  } catch (error) {
    return [];
  }
}

/**
 * Get all users with their projects (for admin)
 * @deprecated Use getAllProjects instead
 */
export async function getAllUserProjects(): Promise<ProjectStore> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return {};
    }

    // Group projects by user ID
    const projectStore: ProjectStore = {};
    (data || []).forEach((row) => {
      const project = rowToProject(row as ProjectRow);
      if (project.userId) {
        if (!projectStore[project.userId]) {
          projectStore[project.userId] = [];
        }
        projectStore[project.userId].push(project);
      }
    });

    return projectStore;
  } catch (error) {
    return {};
  }
}

/**
 * Get all projects (for superuser admin)
 */
export async function getAllProjects(): Promise<Project[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all projects:', error);
      return [];
    }

    return (data || []).map(rowToProject);
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }
}

/**
 * Add a project for a company
 */
export async function addProject(
  companyId: string,
  title: string,
  url: string,
  description?: string
): Promise<Project> {
  // Let the database generate the UUID and timestamps
  const row = {
    company_id: companyId,
    title,
    url,
    description: description || null,
  };

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error adding project:', error);
    throw new Error(`Failed to add project: ${error.message}`);
  }

  return rowToProject(data as ProjectRow);
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  updates: {
    title?: string;
    url?: string;
    description?: string;
    companyId?: string;
    accessOverride?: 'allowed' | 'blocked' | null;
    deviceLimit?: number | null;
    features?: AppFeatures | null;
  }
): Promise<Project | null> {
  const row = projectToRow({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .update(row)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }

  return data ? rowToProject(data as ProjectRow) : null;
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }

  return true;
}

/**
 * Get a single project by ID
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }

  return data ? rowToProject(data as ProjectRow) : null;
}

/**
 * Get project by entitlement API key (for external sites).
 */
export async function getProjectByApiKey(apiKey: string): Promise<Project | null> {
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!key || key.length < 16) return null;
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('api_key', key)
    .maybeSingle();

  if (error || !data) return null;
  return rowToProject(data as ProjectRow);
}

/**
 * Generate a new API key for a project and update the DB. Returns the new key (caller must show it once).
 */
export async function regenerateProjectApiKey(projectId: string): Promise<string | null> {
  const crypto = await import('crypto');
  const newKey = crypto.randomBytes(32).toString('hex');
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('projects')
    .update({ api_key: newKey, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) {
    console.error('Error regenerating project API key:', error);
    return null;
  }
  return newKey;
}
