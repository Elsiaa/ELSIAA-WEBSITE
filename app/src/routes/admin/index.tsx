import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import AdminPoelDashboard from "../../components/poel-shell/AdminPoelDashboard";
import {
  bootstrapAdminDashboard,
  type AdminBootstrap,
} from "../../lib/admin-bootstrap.functions";
import { getAppSessionState } from "../../lib/app-session.functions";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    // Must use a server fn — never import auth()/getSession into route modules
    // (that pulls server-only cookie APIs into the client and hangs navigations).
    const session = await getAppSessionState();
    if (!session.authenticated || !session.email) {
      throw redirect({ to: "/portal/sign-in" });
    }
    return { adminEmail: session.email };
  },
  component: AdminHome,
});

function AdminHome() {
  const [data, setData] = useState<AdminBootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);

  const load = useCallback(async (opts?: { soft?: boolean }) => {
    if (!opts?.soft) {
      setError(null);
    }
    try {
      const d = await bootstrapAdminDashboard();
      setData(d);
      if (opts?.soft) setDataRevision((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const softRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load({ soft: true });
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Admin failed to load</h1>
        <p className="mt-3 text-sm text-red-700">{error}</p>
        <p className="mt-4 text-sm text-[#111]/55">
          Ensure Supabase migrations are applied (including{" "}
          <code>0005_poel_full_tables.sql</code>) and{" "}
          <code>SUPABASE_SECRET_KEY</code> is set.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3] text-sm text-[#111]/45">
        Loading admin…
      </div>
    );
  }

  if (data.denied) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="mt-3 text-sm text-[#111]/55">
          You need super admin, company admin, or support-agent grants.
        </p>
        <a href="/portal" className="mt-6 inline-block text-[#1e6b3c] underline">
          Back to portal
        </a>
      </div>
    );
  }

  return (
    <AdminPoelDashboard
      companies={data.companies}
      initialUsers={data.initialUsers}
      initialProjects={data.initialProjects as never}
      currentUser={data.currentUser}
      userEmail={data.userEmail}
      isSuperAdmin={data.isSuperAdmin}
      isSupportAgent={data.isSupportAgent}
      supportAgentAccess={data.supportAgentAccess}
      onSoftRefresh={softRefresh}
      softRefreshing={refreshing}
      dataRevision={dataRevision}
    />
  );
}
