import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import ClientsPoelPortal from "../../components/poel-shell/ClientsPoelPortal";
import {
  bootstrapPortal,
  type PortalBootstrap,
} from "../../lib/portal-bootstrap.functions";
import { getPortalAuthState } from "../../lib/portal/auth.functions";
import { absoluteUrl } from "../../lib/site-url";

/** Keep last successful bootstrap so remounts don't flash "Loading portal…". */
let portalBootstrapCache: PortalBootstrap | null = null;

export const Route = createFileRoute("/portal/")({
  beforeLoad: async () => {
    const auth = await getPortalAuthState();
    if (!auth.authenticated) {
      throw redirect({ to: "/portal/sign-in" });
    }
    // Super admins land in the admin dashboard, not the empty client portal.
    if (auth.isSuperAdmin) {
      throw redirect({ to: "/admin" });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Client Portal — ELSIAA" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portal") }],
  }),
  component: PortalHome,
});

function PortalHome() {
  const navigate = useNavigate();
  const [data, setData] = useState<PortalBootstrap | null>(
    () => portalBootstrapCache,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void bootstrapPortal()
      .then((d) => {
        if (cancelled) return;
        if (d.redirectSupportAgent) {
          void navigate({ to: "/admin" });
          return;
        }
        if (d.redirectSuperAdmin) {
          void navigate({ to: "/admin" });
          return;
        }
        portalBootstrapCache = d;
        setData(d);
      })
      .catch((e) => {
        if (cancelled) return;
        const raw = e instanceof Error ? e.message : String(e);
        // Server-fn failures sometimes return an HTML error document as the message.
        const cleaned =
          raw.includes("<!doctype html>") || raw.includes("<!DOCTYPE html>")
            ? "Portal bootstrap failed. Try signing out and back in, or refresh."
            : raw;
        // Only wipe the UI if we have nothing cached.
        if (!portalBootstrapCache) setError(cleaned);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error && !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Portal failed to load</h1>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F5F3] text-sm text-[#111]/45">
        Loading portal…
      </div>
    );
  }

  return (
    <ClientsPoelPortal
      projects={data.projects}
      userName={data.userName}
      companyName={data.companyName}
      user={data.user}
      isSuperAdmin={data.isSuperAdmin}
      companies={data.companies}
      users={data.users}
      hasNoProjects={data.hasNoProjects}
      authUserId={data.authUserId}
    />
  );
}
