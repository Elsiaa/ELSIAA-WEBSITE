import { createFileRoute } from "@tanstack/react-router";
import { EmpireHero } from "../components/EmpireHero";
import { ElsiaaSections } from "../components/ElsiaaSections";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <EmpireHero />
      <ElsiaaSections />
    </main>
  );
}
