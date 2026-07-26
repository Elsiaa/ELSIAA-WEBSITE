import { createFileRoute, redirect } from "@tanstack/react-router";
import TimeTrackingClient from "../../components/time-tracking/time-tracking-client";
import { getPortalAuthState } from "../../lib/portal/auth.functions";
import { absoluteUrl } from "../../lib/site-url";

export const Route = createFileRoute("/portal/time-tracking")({
  beforeLoad: async () => {
    const auth = await getPortalAuthState();
    if (!auth.authenticated) throw redirect({ to: "/portal/sign-in" });
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "Time tracking — ELSIAA" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/portal/time-tracking") }],
  }),
  component: () => (
    <div className="min-h-screen bg-[#F5F5F3]">
      <TimeTrackingClient />
    </div>
  ),
});
