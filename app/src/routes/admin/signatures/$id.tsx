import { createFileRoute, redirect } from "@tanstack/react-router";
import SignaturePlacementPage from "../../../components/signatures/admin-signature-editor";
import { getAppSessionState } from "../../../lib/app-session.functions";
import { OpsLightTheme } from "../../../components/ops/OpsLightTheme";

export const Route = createFileRoute("/admin/signatures/$id")({
  beforeLoad: async () => {
    const session = await getAppSessionState();
    if (!session.authenticated) throw redirect({ to: "/portal/sign-in" });
  },
  component: AdminSignaturePage,
});

function AdminSignaturePage() {
  const { id } = Route.useParams();
  return (
    <OpsLightTheme>
      <main className="min-h-screen bg-[#F5F5F3] text-[#111]">
        <SignaturePlacementPage id={id} />
      </main>
    </OpsLightTheme>
  );
}
