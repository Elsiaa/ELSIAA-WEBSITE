/**
 * Permission checking and authorization helpers
 */

import { auth } from '@/auth';
import { authPool } from '@/lib/auth-pool';
import { isSuperAdminEmail } from '@/lib/super-admin';
import { getUserByAuthUserId } from './users';
import { supportAgentHasCompanyGrant } from '@/lib/support-agent-grants';
import { isPlatformSupportAgent } from '@/lib/platform-role';
import { companyUserHasModule } from '@/lib/company-user-modules';
import type { User } from '@/types/company';

async function getSessionAuthUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Check if current user is a super admin (via SUPER_ADMIN_EMAILS env)
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await auth();
  return isSuperAdminEmail(session?.user?.email);
}

export async function isSupportAgentUser(): Promise<boolean> {
  const u = await getCurrentUser();
  return isPlatformSupportAgent(u?.platform_role);
}

/**
 * Company user with Authorizations module for this company, super admin,
 * or support agent with authorizations grant.
 */
export async function requireCompanyAccessOrSupportAgentAuthorizations(companyId: string): Promise<void> {
  if (await isSuperAdmin()) return;
  const u = await getCurrentUser();
  if (!u) {
    throw new Error('Unauthorized - not logged in');
  }
  if (u.company_id === companyId && companyUserHasModule(u, 'authorizations')) {
    return;
  }
  if (
    isPlatformSupportAgent(u.platform_role) &&
    (await supportAgentHasCompanyGrant(u.id, companyId, 'authorizations'))
  ) {
    return;
  }
  throw new Error('Forbidden - access to this company denied');
}

/**
 * Super admin, or support agent with authorizations grant for this company (elevated ops: device limits, overrides, extension source).
 */
export async function requireSuperAdminOrSupportAgentAuthorizations(companyId: string): Promise<void> {
  if (await isSuperAdmin()) return;
  const u = await getCurrentUser();
  if (
    u &&
    isPlatformSupportAgent(u.platform_role) &&
    (await supportAgentHasCompanyGrant(u.id, companyId, 'authorizations'))
  ) {
    return;
  }
  throw new Error('Forbidden - elevated access required');
}

/** Super admin or support agent with authorizations grant (e.g. full GitHub status in admin). */
export async function isSuperAdminOrAuthorizationsElevated(companyId: string): Promise<boolean> {
  if (await isSuperAdmin()) return true;
  const u = await getCurrentUser();
  return Boolean(
    u &&
      isPlatformSupportAgent(u.platform_role) &&
      (await supportAgentHasCompanyGrant(u.id, companyId, 'authorizations'))
  );
}

/**
 * Check if an Auth.js user id belongs to a super admin (by email in next_auth.users)
 */
export async function isUserIdSuperAdmin(authUserId: string): Promise<boolean> {
  if (!authUserId) return false;
  try {
    const r = await authPool.query('SELECT email FROM next_auth.users WHERE id = $1', [authUserId]);
    const email = r.rows[0]?.email as string | undefined;
    return isSuperAdminEmail(email);
  } catch (error) {
    console.error('Error checking if user is super admin:', error);
    return false;
  }
}

/**
 * Get current authenticated app user from database (null if super admin without row)
 */
export async function getCurrentUser(): Promise<User | null> {
  const authUserId = await getSessionAuthUserId();
  if (!authUserId) return null;
  return getUserByAuthUserId(authUserId);
}

/**
 * Require authentication - throws if not authenticated
 * Returns user from database, or null for super admins without DB entry
 */
export async function requireAuth(): Promise<User | null> {
  const authUserId = await getSessionAuthUserId();
  if (!authUserId) {
    throw new Error('Unauthorized - not logged in');
  }

  const session = await auth();
  if (isSuperAdminEmail(session?.user?.email)) {
    return null;
  }

  const user = await getUserByAuthUserId(authUserId);
  if (!user) {
    throw new Error('Unauthorized - user not found in database');
  }
  return user;
}

/**
 * Require super admin - throws if not super admin
 */
export async function requireSuperAdmin(): Promise<void> {
  const ok = await isSuperAdmin();
  if (!ok) {
    throw new Error('Forbidden - super admin access required');
  }
}

/**
 * Require company admin - throws if not company admin
 * Returns null for super admins, User for company admins
 */
export async function requireCompanyAdmin(companyId?: string): Promise<User | null> {
  const authUserId = await getSessionAuthUserId();
  if (!authUserId) {
    throw new Error('Unauthorized - not logged in');
  }

  const user = await getUserByAuthUserId(authUserId);

  if (user) {
    if (user.role !== 'admin') {
      const superAdmin = await isSuperAdmin();
      if (superAdmin) return null;
      throw new Error('Forbidden - company admin access required');
    }

    if (companyId && user.company_id !== companyId) {
      const superAdmin = await isSuperAdmin();
      if (superAdmin) return null;
      throw new Error('Forbidden - access to this company denied');
    }

    return user;
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    return null;
  }

  throw new Error('Unauthorized - user not found');
}

/**
 * Require access to a specific company - throws if no access
 * Returns null for super admins, User for company users
 */
export async function requireCompanyAccess(companyId: string): Promise<User | null> {
  const authUserId = await getSessionAuthUserId();
  if (!authUserId) {
    throw new Error('Unauthorized - not logged in');
  }

  const user = await getUserByAuthUserId(authUserId);

  if (user) {
    if (user.company_id !== companyId) {
      const superAdmin = await isSuperAdmin();
      if (superAdmin) return null;
      throw new Error('Forbidden - access to this company denied');
    }
    return user;
  }

  const superAdmin = await isSuperAdmin();
  if (superAdmin) {
    return null;
  }

  throw new Error('Unauthorized - user not found');
}

/**
 * Check if user can manage another user
 */
export async function canManageUser(targetUserId: string): Promise<boolean> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;

  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  if (currentUser.role === 'admin') {
    const { getUserById } = await import('./users');
    const targetUser = await getUserById(targetUserId);
    return targetUser?.company_id === currentUser.company_id;
  }

  return false;
}

/**
 * Check if user can manage a project
 */
export async function canManageProject(projectCompanyId: string): Promise<boolean> {
  const superAdmin = await isSuperAdmin();
  if (superAdmin) return true;

  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  if (currentUser.role === 'admin' && currentUser.company_id === projectCompanyId) {
    return true;
  }

  return false;
}

/**
 * List/read/delete program logs for a project: super admin, company user with Logs module,
 * or support agent with program_logs grant for that company.
 */
export async function canAccessProjectProgramLogs(projectCompanyId: string): Promise<boolean> {
  if (await isSuperAdmin()) return true;
  const u = await getCurrentUser();
  if (!u) return false;
  if (u.company_id === projectCompanyId && companyUserHasModule(u, 'program_logs')) return true;
  if (isPlatformSupportAgent(u.platform_role)) {
    return supportAgentHasCompanyGrant(u.id, projectCompanyId, 'program_logs');
  }
  return false;
}

/**
 * Get user's effective permissions
 */
export async function getUserPermissions() {
  const currentUser = await getCurrentUser();
  const superAdmin = await isSuperAdmin();
  const supportAgent = isPlatformSupportAgent(currentUser?.platform_role);

  return {
    isSuperAdmin: superAdmin,
    isCompanyAdmin: currentUser?.role === 'admin',
    isSupportAgent: Boolean(supportAgent),
    companyId: currentUser?.company_id || null,
    canManageCompanies: superAdmin,
    canManageUsers: superAdmin || currentUser?.role === 'admin',
    canManageProjects: superAdmin || currentUser?.role === 'admin',
    canManageMeetings: superAdmin || currentUser?.role === 'admin',
  };
}
