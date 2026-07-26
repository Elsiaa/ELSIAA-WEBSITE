/**
 * User Project Permissions
 * Manages which projects users have access to
 */

import { getServerSupabaseClient } from './supabase';
import { isPlatformSupportAgent } from '@/lib/platform-role';
import { getGrantsForUser } from './support-agent-grants';

function isAllProjectsAccessFlag(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'string') {
    const s = value.toLowerCase();
    return s === 'true' || s === 't' || s === '1';
  }
  return false;
}

async function listCompanyProjectIds(supabase: ReturnType<typeof getServerSupabaseClient>, companyId: string) {
  const { data, error } = await supabase.from('projects').select('id').eq('company_id', companyId);
  if (error) {
    console.error('listCompanyProjectIds', error);
    return [];
  }
  return (data || []).map((p) => p.id as string);
}

export interface UserProjectPermission {
  id: string;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all projects a user has permission to access
 */
export async function getUserProjectPermissions(userId: string): Promise<string[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_project_permissions')
    .select('project_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user project permissions:', error);
    return [];
  }

  return (data || []).map(row => row.project_id);
}

/**
 * Grant a user permission to access a project
 */
export async function grantProjectPermission(userId: string, projectId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('user_project_permissions')
    .insert({
      user_id: userId,
      project_id: projectId,
    });

  if (error) {
    console.error('Error granting project permission:', error);
    return false;
  }

  return true;
}

/**
 * Revoke a user's permission to access a project
 */
export async function revokeProjectPermission(userId: string, projectId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('user_project_permissions')
    .delete()
    .eq('user_id', userId)
    .eq('project_id', projectId);

  if (error) {
    console.error('Error revoking project permission:', error);
    return false;
  }

  return true;
}

/**
 * Set all project permissions for a user (replaces existing)
 */
export async function setUserProjectPermissions(
  userId: string,
  projectIds: string[]
): Promise<boolean> {
  const supabase = getServerSupabaseClient();

  // Delete all existing permissions for this user
  await supabase
    .from('user_project_permissions')
    .delete()
    .eq('user_id', userId);

  // Insert new permissions
  if (projectIds.length > 0) {
    const { error } = await supabase
      .from('user_project_permissions')
      .insert(
        projectIds.map(projectId => ({
          user_id: userId,
          project_id: projectId,
        }))
      );

    if (error) {
      console.error('Error setting user project permissions:', error);
      return false;
    }
  }

  return true;
}

/**
 * Get all users who have permission to a specific project
 */
export async function getProjectUsers(projectId: string): Promise<string[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_project_permissions')
    .select('user_id')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project users:', error);
    return [];
  }

  return (data || []).map(row => row.user_id);
}

/**
 * Check if a user has permission to access a project
 */
export async function hasProjectPermission(userId: string, projectId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('user_project_permissions')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (error) {
    console.error('Error checking project permission:', error);
    return false;
  }

  return data !== null;
}

/**
 * Get projects a user can access (filtered by permissions).
 * Admins and `all_projects_access` users get all company project IDs.
 * Otherwise uses `user_project_permissions` rows that still exist on this company; stale rows are ignored.
 * If nothing valid remains (and user is not a support agent), returns all company project IDs.
 * Support agents: only projects for companies with a support or authorizations grant.
 */
export async function getUserAccessibleProjects(userId: string, companyId: string): Promise<string[]> {
  const supabase = getServerSupabaseClient();

  const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

  if (userError || !userData) {
    console.error('Error checking user permissions:', userError);
    return [];
  }

  const allAccess = isAllProjectsAccessFlag(userData.all_projects_access);
  const isAdmin = userData.role === 'admin';
  const isSupportAgent = isPlatformSupportAgent(userData.platform_role);

  if (allAccess || isAdmin) {
    return listCompanyProjectIds(supabase, companyId);
  }

  const assigned = await getUserProjectPermissions(userId);
  if (assigned.length > 0) {
    const { data: validRows, error: validErr } = await supabase
      .from('projects')
      .select('id')
      .in('id', assigned)
      .eq('company_id', companyId);

    if (validErr) {
      console.error('Error validating assigned projects:', validErr);
    }

    const validIds = (validRows || []).map((r) => r.id as string);
    if (validIds.length > 0) {
      return validIds;
    }
  }

  if (isSupportAgent) {
    const rows = await getGrantsForUser(userId);
    const row = rows.find((r) => r.company_id === companyId);
    if (row && (row.support_allowed || row.authorizations_allowed)) {
      return listCompanyProjectIds(supabase, companyId);
    }
    return [];
  }

  return listCompanyProjectIds(supabase, companyId);
}
