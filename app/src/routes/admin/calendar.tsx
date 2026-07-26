import { createFileRoute, redirect } from "@tanstack/react-router";
import { getAppSessionState } from "../../lib/app-session.functions";
import CalendarPageClient from "../../components/admin/poel/calendar/page-client";
import { OpsLightTheme } from "../../components/ops/OpsLightTheme";

export const Route = createFileRoute("/admin/calendar")({
  beforeLoad: async () => {
    const session = await getAppSessionState();
    if (!session.authenticated) throw redirect({ to: "/portal/sign-in" });
    return { email: session.email };
  },
  component: () => (
    <OpsLightTheme>
      <div className="min-h-screen bg-[#F5F5F3] p-4 md:p-8">
        <CalendarPageClient />
      </div>
    </OpsLightTheme>
  ),
});
