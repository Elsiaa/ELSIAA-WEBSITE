import { createFileRoute } from "@tanstack/react-router";
import { EmpireHero } from "../components/EmpireHero";
import { AppleCaptions } from "../components/AppleCaptions";
import { ElsiaaSections } from "../components/ElsiaaSections";
import { WalkingLion } from "../components/WalkingLion";

export const Route = createFileRoute("/concept-walk")({
  /* internal design scratch page — reachable for review, never indexed */
  head: () => ({
    meta: [
      { title: "Concept walk — ELSIAA (internal)" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ConceptWalk,
});

function ConceptWalk() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <WalkingLion />
      <EmpireHero />
      <AppleCaptions />
      <ElsiaaSections />
    </main>
  );
}
