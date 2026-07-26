import type { User } from '@/types/company';

export type CompanyUserModule = 'authorizations' | 'program_logs' | 'files' | 'support';

export type CompanyUserModuleFlags = {
  authorizations_allowed: boolean;
  program_logs_allowed: boolean;
  files_allowed: boolean;
  support_allowed: boolean;
};

export function parseCompanyUserModuleFlags(
  input: Partial<CompanyUserModuleFlags> | null | undefined
): CompanyUserModuleFlags {
  return {
    authorizations_allowed: Boolean(input?.authorizations_allowed),
    program_logs_allowed: Boolean(input?.program_logs_allowed),
    files_allowed: Boolean(input?.files_allowed),
    support_allowed: Boolean(input?.support_allowed),
  };
}

/** Defaults when creating a user: full access for admins, none for members. */
export function defaultCompanyUserModuleFlags(role: 'admin' | 'member'): CompanyUserModuleFlags {
  const all = role === 'admin';
  return {
    authorizations_allowed: all,
    program_logs_allowed: all,
    files_allowed: all,
    support_allowed: all,
  };
}

type ModuleUser = Pick<User, 'company_id'> &
  Partial<CompanyUserModuleFlags> & { role?: string };

function readModuleFlag(user: ModuleUser, key: keyof CompanyUserModuleFlags): boolean {
  // Pre-migration / missing field: preserve previous behavior (company admins had full access).
  if (!(key in user) || user[key] === undefined || user[key] === null) {
    return user.role === 'admin';
  }
  return Boolean(user[key]);
}

export function companyUserHasModule(
  user: ModuleUser | null | undefined,
  kind: CompanyUserModule
): boolean {
  if (!user?.company_id) return false;
  switch (kind) {
    case 'authorizations':
      return readModuleFlag(user, 'authorizations_allowed');
    case 'program_logs':
      return readModuleFlag(user, 'program_logs_allowed');
    case 'files':
      return readModuleFlag(user, 'files_allowed');
    case 'support':
      return readModuleFlag(user, 'support_allowed');
    default:
      return false;
  }
}

export function companyUserHasAnyModule(user: ModuleUser | null | undefined): boolean {
  return (
    companyUserHasModule(user, 'authorizations') ||
    companyUserHasModule(user, 'program_logs') ||
    companyUserHasModule(user, 'files') ||
    companyUserHasModule(user, 'support')
  );
}

/** Company tenant can open /admin (role admin and/or any module grant). */
export function canEnterCompanyAdminPortal(
  user: (ModuleUser & { role?: string }) | null | undefined
): boolean {
  if (!user?.company_id) return false;
  if (user.role === 'admin') return true;
  return companyUserHasAnyModule(user);
}
