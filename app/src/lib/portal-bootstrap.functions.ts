import { createServerFn } from "@tanstack/react-start";
import { auth } from "../auth";
import { getCurrentUser, isSuperAdmin } from "./permissions";
import { getUserWithCompany } from "./users";
import { getUserAccessibleProjects } from "./user-project-permissions";
import { getCompanyProjects } from "./projects";
import { isPlatformSupportAgent } from "./platform-role";
import type { Company, UserWithCompany } from "../types/company";

export type PortalBootstrap = {
  userName: string;
  companyName: string;
  projects: Array<{
    id: string;
    companyId?: string;
    title: string;
    url: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  user: UserWithCompany | null;
  isSuperAdmin: boolean;
  companies: Company[];
  users: UserWithCompany[];
  hasNoProjects: boolean;
  redirectSupportAgent: boolean;
  /** Super admins should leave the client portal for /admin. */
  redirectSuperAdmin: boolean;
  /** Supabase auth.users id for chat / session identity. */
  authUserId: string | null;
};

export const bootstrapPortal = createServerFn({ method: "GET" }).handler(
  async (): Promise<PortalBootstrap> => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const superAdmin = await isSuperAdmin();
    const dbUser = await getCurrentUser();

    if (dbUser && isPlatformSupportAgent(dbUser.platform_role)) {
      return {
        userName: dbUser.email,
        companyName: "",
        projects: [],
        user: dbUser as UserWithCompany,
        isSuperAdmin: false,
        companies: [],
        users: [],
        hasNoProjects: true,
        redirectSupportAgent: true,
        redirectSuperAdmin: false,
        authUserId: session.user.id,
      };
    }

    const sessionName = session.user?.name?.trim() || "";
    const sessionEmail = session.user?.email || "";

    if (superAdmin) {
      const userName = sessionName || sessionEmail.split("@")[0] || "Super Admin";
      return {
        userName,
        companyName: "All companies",
        projects: [],
        user: null,
        isSuperAdmin: true,
        companies: [],
        users: [],
        hasNoProjects: false,
        redirectSupportAgent: false,
        redirectSuperAdmin: true,
        authUserId: session.user.id,
      };
    }

    const userWithCompany = dbUser ? await getUserWithCompany(dbUser.id) : null;
    const userName =
      [userWithCompany?.first_name, userWithCompany?.last_name].filter(Boolean).join(" ") ||
      sessionName ||
      sessionEmail.split("@")[0] ||
      "Client";
    const companyName = userWithCompany?.company?.name || "Your company";

    let projects: PortalBootstrap["projects"] = [];
    if (userWithCompany?.company_id) {
      const ids = await getUserAccessibleProjects(userWithCompany.id, userWithCompany.company_id);
      if (ids.length) {
        const list = await getCompanyProjects(userWithCompany.company_id);
        projects = list
          .filter((p) => ids.includes(p.id))
          .map((p) => ({
            id: p.id,
            companyId:
              (p as { companyId?: string }).companyId ?? (p as { company_id?: string }).company_id,
            title: p.title,
            url: p.url,
            description: p.description,
            createdAt:
              (p as { createdAt?: string }).createdAt ??
              (p as { created_at?: string }).created_at ??
              "",
            updatedAt:
              (p as { updatedAt?: string }).updatedAt ??
              (p as { updated_at?: string }).updated_at ??
              "",
          }));
      }
    }

    return {
      userName,
      companyName,
      projects,
      user: userWithCompany,
      isSuperAdmin: false,
      companies: [],
      users: [],
      hasNoProjects: projects.length === 0,
      redirectSupportAgent: false,
      redirectSuperAdmin: false,
      authUserId: session.user.id,
    };
  },
);
