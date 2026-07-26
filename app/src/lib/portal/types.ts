/** Shared portal domain types — empty of tenant data. */

export type PortalRole = "owner" | "admin" | "member";

export type PortalModule =
  | "overview"
  | "projects"
  | "files"
  | "messages"
  | "meetings"
  | "billing"
  | "support"
  | "authorizations"
  | "logs"
  | "signatures"
  | "users";

export type PortalNavId = PortalModule;

export type CompanyModuleFlags = {
  authorizationsAllowed: boolean;
  programLogsAllowed: boolean;
  filesAllowed: boolean;
  supportAllowed: boolean;
  allProjectsAccess: boolean;
};

export type PortalCompany = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyId: string | null;
  role: PortalRole;
  isActive: boolean;
};

export type PortalProject = {
  id: string;
  companyId: string;
  title: string;
  url: string;
  description?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
};

export type PortalSession = {
  userId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
} | null;

export type PortalWorkspace = {
  userId: string;
  email: string;
  displayName: string;
  company: PortalCompany | null;
  role: PortalRole | null;
  modules: CompanyModuleFlags;
  allowedNav: PortalNavId[];
};
