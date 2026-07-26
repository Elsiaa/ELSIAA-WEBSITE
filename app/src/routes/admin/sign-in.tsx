import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminSignInForm } from "../../components/admin/AdminSignInForm";
import { getAdminAuthState } from "../../lib/admin/auth.functions";
import { getAppSessionState } from "../../lib/app-session.functions";

export const Route = createFileRoute("/admin/sign-in")({
  beforeLoad: async () => {
    const admin = await getAdminAuthState();
    if (admin.authenticated) {
      throw redirect({ to: "/admin" });
    }
    // Portal cookie also counts — company admins land in the admin shell.
    const session = await getAppSessionState();
    if (session.authenticated) {
      throw redirect({ to: "/admin" });
    }
    return { auth: admin };
  },
  head: () => ({
    meta: [
      { title: "Admin sign in — ELSIAA" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminSignInPage,
});

function AdminSignInPage() {
  const { auth } = Route.useRouteContext();
  return <AdminSignInForm initial={auth} />;
}
