export const adminFonts = {
  mono: {
    fontFamily: "var(--font-sans)",
  },
  sans: {
    fontFamily: "var(--font-sans)",
  },
} as const;

/** Accent used across admin chrome (ELSIAA green). */
export const ADMIN_GREEN = "#1e6b3c";
export const ADMIN_GREEN_HOVER = "#2e9e58";
export const ADMIN_GREEN_DARK = "#155a32";
export const ADMIN_PAGE_BG = "#F5F5F3";

export type AdminTabId =
  | "companies"
  | "users"
  | "projects"
  | "signatures"
  | "email"
  | "billing-payments"
  | "payment-methods"
  | "company-payments"
  | "payments"
  | "billing"
  | "payments-licensing"
  | "authorizations"
  | "meetings"
  | "company-files"
  | "support"
  | "support-agents"
  | "logs";

export type AdminNavLeaf = {
  id: AdminTabId;
  label: string;
  blurb?: string;
  badge?: string | number;
};

export type AdminNavEntry =
  | {
      kind: "group";
      id: string;
      label: string;
      blurb?: string;
      children: AdminNavLeaf[];
    }
  | {
      kind: "item";
      id: AdminTabId;
      label: string;
      blurb?: string;
      badge?: string | number;
    }
  | {
      kind: "link";
      id: string;
      label: string;
      blurb?: string;
      href: string;
    };

/** @deprecated Prefer building role-specific trees in AdminPoelDashboard. */
export type AdminNavId =
  "overview" | "companies" | "users" | "projects" | "billing" | "mail" | "settings";

export const adminNav: Array<{
  id: AdminNavId;
  label: string;
  blurb: string;
  href?: string;
}> = [
  { id: "overview", label: "Overview", blurb: "Ops snapshot." },
  { id: "companies", label: "Companies", blurb: "Tenant accounts." },
  { id: "users", label: "Users", blurb: "People & roles." },
  { id: "projects", label: "Projects", blurb: "Active builds." },
  { id: "billing", label: "Billing", blurb: "Invoices & Stripe." },
  { id: "mail", label: "Mail", blurb: "Accounts, keys & send." },
  { id: "settings", label: "Settings", blurb: "Super admins & env." },
];
