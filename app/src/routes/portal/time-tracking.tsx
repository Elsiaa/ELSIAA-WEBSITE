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
    meta: [{ title: "Time tracking — ELSIAA" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "canonical", href: absoluteUrl("/portal/time-tracking") }],
  }),
  component: TimeTrackingPage,
});

/* TimeTrackingClient requires userLabel and renders it in the header. The
   route was mounting it with no props at all, so that slot rendered empty
   for every signed-in user. beforeLoad already resolves the session, so the
   values are taken from route context rather than fetched again. */
function TimeTrackingPage() {
  const { auth } = Route.useRouteContext();
  const email = auth.email ?? "";
  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      <TimeTrackingClient userLabel={email.split("@")[0] || "Your account"} userEmail={email} />
    </div>
  );
}
