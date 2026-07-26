import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import SupportDesk from "../../components/support/support-desk";
import { getPortalAuthState } from "../../lib/portal/auth.functions";
import { bootstrapPortal } from "../../lib/portal-bootstrap.functions";
import { absoluteUrl } from "../../lib/site-url";
import type { Company, User, UserWithCompany } from "../../types/company";

export const Route = createFileRoute("/portal/support")({
  beforeLoad: async () => {
    const auth = await getPortalAuthState();
    if (!auth.authenticated) throw redirect({ to: "/portal/sign-in" });
    return { auth };
  },
  head: () => ({
    meta: [{ title: "Support — ELSIAA" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: absoluteUrl("/portal/support") }],
  }),
  component: PortalSupportPage,
});

function PortalSupportPage() {
  const [user, setUser] = useState<UserWithCompany | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void bootstrapPortal().then((d) => {
      setUser(d.user);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-[#111]/45">
        Loading support…
      </div>
    );
  }

  const companies: Company[] = user?.company
    ? [user.company]
    : [];
  const allUsers: User[] = user ? [user] : [];

  return (
    <div className="min-h-screen bg-[#F5F5F3] px-4 py-8 text-[#111]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-[#1e6b3c]">ELSIAA</p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">Support</h1>
            <p className="mt-1 text-sm text-[#111]/50">
              Tickets and help from the ELSIAA team
            </p>
          </div>
          <a
            href="/portal"
            className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium"
          >
            Back to portal
          </a>
        </div>
        <SupportDesk
          mode="portal"
          isSuperAdmin={false}
          companies={companies}
          allUsers={allUsers}
          fixedCompanyId={user?.company_id ?? null}
          appUserId={user?.id ?? null}
          portalIsCompanyAdmin={user?.role === "admin"}
        />
      </div>
    </div>
  );
}
