import type {
  CompanyModuleFlags,
  PortalModule,
  PortalNavId,
  PortalRole,
} from "./types";

export function emptyModuleFlags(): CompanyModuleFlags {
  return {
    authorizationsAllowed: false,
    programLogsAllowed: false,
    filesAllowed: false,
    supportAllowed: false,
    allProjectsAccess: false,
  };
}

export function defaultFlagsForRole(role: PortalRole): CompanyModuleFlags {
  const all = role === "owner" || role === "admin";
  return {
    authorizationsAllowed: all,
    programLogsAllowed: all,
    filesAllowed: all,
    supportAllowed: all,
    allProjectsAccess: all,
  };
}

export function canSeeModule(
  role: PortalRole | null,
  flags: CompanyModuleFlags,
  module: PortalModule,
): boolean {
  // Always-on client modules for any company member
  if (
    module === "overview" ||
    module === "projects" ||
    module === "meetings" ||
    module === "messages"
  ) {
    return true;
  }
  if (module === "billing") {
    return role === "owner" || role === "admin";
  }
  if (module === "users") {
    return role === "owner" || role === "admin";
  }
  if (module === "files") return flags.filesAllowed || role === "owner" || role === "admin";
  if (module === "support")
    return flags.supportAllowed || role === "owner" || role === "admin";
  if (module === "authorizations")
    return flags.authorizationsAllowed || role === "owner" || role === "admin";
  if (module === "logs")
    return flags.programLogsAllowed || role === "owner" || role === "admin";
  if (module === "signatures") return role === "owner" || role === "admin";
  return false;
}

export function navForWorkspace(input: {
  role: PortalRole | null;
  flags: CompanyModuleFlags;
  hasCompany: boolean;
}): PortalNavId[] {
  if (!input.hasCompany) {
    return ["overview", "projects", "meetings", "support"];
  }
  const all: PortalNavId[] = [
    "overview",
    "projects",
    "authorizations",
    "files",
    "messages",
    "meetings",
    "billing",
    "users",
    "logs",
    "support",
    "signatures",
  ];
  return all.filter((id) => canSeeModule(input.role, input.flags, id));
}

export const portalNavMeta: Record<
  PortalNavId,
  { label: string; blurb: string }
> = {
  overview: { label: "Overview", blurb: "Status and what’s next." },
  projects: { label: "Projects", blurb: "Live builds and apps." },
  authorizations: {
    label: "Authorizations",
    blurb: "Devices and access.",
  },
  files: { label: "Files", blurb: "Contracts, assets, and exports." },
  messages: { label: "Messages", blurb: "Direct line to ELSIAA." },
  meetings: { label: "Meetings", blurb: "Schedule and join calls." },
  billing: { label: "Billing", blurb: "Invoices and payment methods." },
  users: { label: "Users", blurb: "People on your company." },
  logs: { label: "Logs", blurb: "Program / runtime logs." },
  support: { label: "Support", blurb: "Tickets and help." },
  signatures: { label: "Signatures", blurb: "PDF signature requests." },
};
