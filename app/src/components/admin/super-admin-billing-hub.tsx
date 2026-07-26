"use client";

import { useState } from "react";
import BillingManagement from "@/components/admin/billing-management";
import PaymentsManagementNew from "@/components/admin/payments-management";
import PaymentsLicensing from "@/components/admin/payments-licensing";
import { ADMIN_GREEN } from "@/components/admin/tokens";
import type { Company, User } from "@/types/company";

type BillingSubTab = "bills" | "requests" | "licenses";

type Project = {
  id: string;
  companyId: string;
  title: string;
  url: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  company?: Company;
};

type Props = {
  companies: (Company & { stats?: { users: number; projects: number; meetings: number } })[];
  projects: Project[];
  isSuperAdmin: boolean;
  currentUser: User | null;
  onDataChange?: () => void;
};

const TABS: { id: BillingSubTab; label: string; blurb: string }[] = [
  { id: "bills", label: "Bills", blurb: "Lifecycle & subscriptions" },
  { id: "requests", label: "Payment requests", blurb: "One-time invoices" },
  { id: "licenses", label: "Licenses & fees", blurb: "Project fees" },
];

/**
 * Single Billing surface for super-admins (replaces separate Billing / Payments / Subscriptions nav).
 */
export default function SuperAdminBillingHub({
  companies,
  projects,
  isSuperAdmin,
  currentUser,
  onDataChange,
}: Props) {
  const [tab, setTab] = useState<BillingSubTab>("bills");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[#111]">Billing</h2>
        <p className="mt-1 text-sm text-[#111]/55">
          Bills, payment requests, and project licenses in one place.
        </p>
      </div>

      <div
        className="flex flex-wrap gap-1 rounded-xl border border-black/[0.08] bg-white p-1"
        role="tablist"
        aria-label="Billing sections"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`min-w-[8rem] flex-1 rounded-lg px-3 py-2.5 text-left transition-colors ${
                active ? "text-white shadow-sm" : "text-[#111]/70 hover:bg-black/[0.04]"
              }`}
              style={active ? { backgroundColor: ADMIN_GREEN } : undefined}
            >
              <div className="text-sm font-semibold">{t.label}</div>
              <div className={`text-[11px] ${active ? "text-white/80" : "text-[#111]/45"}`}>
                {t.blurb}
              </div>
            </button>
          );
        })}
      </div>

      {tab === "bills" && (
        <BillingManagement
          companies={companies}
          projects={projects}
          isSuperAdmin={isSuperAdmin}
        />
      )}

      {tab === "requests" && (
        <PaymentsManagementNew
          companies={companies}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          onDataChange={onDataChange}
        />
      )}

      {tab === "licenses" && (
        <PaymentsLicensing
          companies={companies}
          projects={projects}
          isSuperAdmin={isSuperAdmin}
          currentUser={currentUser}
          variant="billing"
        />
      )}
    </div>
  );
}
