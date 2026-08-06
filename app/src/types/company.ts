/**
 * Company-based multi-tenant system types
 */

export interface Company {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  /** When true, support agents with an Authorizations grant may use Admin → Files for this company. */
  support_agent_company_files_allowed?: boolean;
}

export type UserRole = "admin" | "member";
export type UserStatus = "pending" | "active" | "inactive";
export type PlatformRole = "none" | "support" | "billing" | "operator" | "support_agent";

export interface User {
  id: string;
  /** Workspace tenant; null for support agents (they use `support_agent_company_grants` only). */
  company_id: string | null;
  auth_user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  platform_role: PlatformRole;
  /** When true (or admin), client portal lists all company projects; otherwise only `user_project_permissions` rows. */
  all_projects_access?: boolean;
  /** Admin → Authorizations for this user's company. */
  authorizations_allowed?: boolean;
  /** Admin → Logs for this user's company projects. */
  program_logs_allowed?: boolean;
  /** Admin → Files for this user's company. */
  files_allowed?: boolean;
  /** Admin → Support for this user's company. */
  support_allowed?: boolean;
  is_active: boolean; // Deprecated - use status instead
  created_at: string;
  updated_at: string;
}

export interface UserWithCompany extends User {
  company?: Company;
}

export interface CreateUserInput {
  company_id: string | null;
  auth_user_id?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: UserRole;
  status?: UserStatus;
  all_projects_access?: boolean;
  authorizations_allowed?: boolean;
  program_logs_allowed?: boolean;
  files_allowed?: boolean;
  support_allowed?: boolean;
}

export interface UpdateUserInput {
  company_id?: string;
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
  all_projects_access?: boolean;
  authorizations_allowed?: boolean;
  program_logs_allowed?: boolean;
  files_allowed?: boolean;
  support_allowed?: boolean;
  platform_role?: PlatformRole;
  auth_user_id?: string | null;
  is_active?: boolean; // Deprecated - use status instead
}

export interface CreateCompanyInput {
  name: string;
}

export interface UpdateCompanyInput {
  name?: string;
  support_agent_company_files_allowed?: boolean;
}

// Helper type for displaying user names
export type UserDisplayInfo = {
  id: string;
  name: string; // Formatted as "First Last" or email if no name
  email: string;
  role: UserRole;
};
