import { createServerFn } from "@tanstack/react-start";
import { auth } from "../auth";
import { getCurrentUser, getUserPermissions, isSuperAdmin } from "./permissions";
import { canEnterCompanyAdminPortal } from "./company-user-modules";
import { getAllCompanies, getCompanyById, getCompanyStats } from "./companies";
import { filterOutSuperAdminUsers, getAllUsers, getUsersByCompany } from "./users";
import { getAllProjects, getCompanyProjects } from "./projects";
import { getGrantsForUser, summarizeGrants } from "./support-agent-grants";
import type { Company, User, UserWithCompany } from "../types/company";

export type AdminBootstrap = {
  companies: (Company & {
    stats?: { users: number; projects: number; meetings: number };
  })[];
  initialUsers: UserWithCompany[];
  initialProjects: { [companyId: string]: unknown[] } | unknown[];
  currentUser: User | null;
  userEmail: string;
  isSuperAdmin: boolean;
  isSupportAgent: boolean;
  supportAgentAccess: ReturnType<typeof summarizeGrants> | null;
  denied: boolean;
};

export const bootstrapAdminDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<AdminBootstrap> => {
    const superAdmin = await isSuperAdmin();
    const currentUser = await getCurrentUser();
    const session = await auth();
    const userEmail = currentUser?.email || session?.user?.email || "Admin";

    if (!superAdmin && !currentUser) {
      return {
        companies: [],
        initialUsers: [],
        initialProjects: [],
        currentUser: null,
        userEmail,
        isSuperAdmin: false,
        isSupportAgent: false,
        supportAgentAccess: null,
        denied: true,
      };
    }

    const permissions = await getUserPermissions();
    const isSupportAgent = Boolean(permissions.isSupportAgent);
    const supportAgentAccess =
      isSupportAgent && currentUser
        ? summarizeGrants(await getGrantsForUser(currentUser.id))
        : null;

    // Poel: company admin OR any module grant can enter company admin portal.
    const canCompanyAdmin = canEnterCompanyAdminPortal(currentUser);

    if (!permissions.isSuperAdmin && !isSupportAgent && !canCompanyAdmin) {
      return {
        companies: [],
        initialUsers: [],
        initialProjects: [],
        currentUser,
        userEmail,
        isSuperAdmin: false,
        isSupportAgent,
        supportAgentAccess,
        denied: true,
      };
    }

    let companies: AdminBootstrap["companies"] = [];
    let users: UserWithCompany[] = [];
    let projects: AdminBootstrap["initialProjects"] = [];

    if (superAdmin) {
      const all = await getAllCompanies();
      companies = await Promise.all(
        all.map(async (company) => ({
          ...company,
          stats: await getCompanyStats(company.id),
        })),
      );
      users = filterOutSuperAdminUsers(await getAllUsers());
      projects = await getAllProjects();
    } else if (isSupportAgent && supportAgentAccess) {
      const ids = [
        ...new Set([
          ...supportAgentAccess.supportCompanyIds,
          ...supportAgentAccess.authorizationsCompanyIds,
          ...supportAgentAccess.programLogsCompanyIds,
          ...supportAgentAccess.filesCompanyIds,
        ]),
      ];
      const rows = await Promise.all(ids.map((id) => getCompanyById(id)));
      companies = rows.filter(Boolean) as Company[];
      users = [];
      projects = await getAllProjects();
    } else {
      if (!currentUser?.company_id) {
        return {
          companies: [],
          initialUsers: [],
          initialProjects: [],
          currentUser,
          userEmail,
          isSuperAdmin: false,
          isSupportAgent: false,
          supportAgentAccess: null,
          denied: true,
        };
      }
      const company = await getCompanyById(currentUser.company_id);
      if (!company) {
        return {
          companies: [],
          initialUsers: [],
          initialProjects: [],
          currentUser,
          userEmail,
          isSuperAdmin: false,
          isSupportAgent: false,
          supportAgentAccess: null,
          denied: true,
        };
      }
      companies = [{ ...company, stats: await getCompanyStats(company.id) }];
      users = (await getUsersByCompany(currentUser.company_id)).map((user) => ({
        ...user,
        company,
      }));
      const projectsList = await getCompanyProjects(currentUser.company_id);
      projects = { [currentUser.company_id]: projectsList };
    }

    return {
      companies,
      initialUsers: users,
      initialProjects: projects,
      currentUser,
      userEmail,
      isSuperAdmin: superAdmin,
      isSupportAgent,
      supportAgentAccess,
      denied: false,
    };
  },
);
