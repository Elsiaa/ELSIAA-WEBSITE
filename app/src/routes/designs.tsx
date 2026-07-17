import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaExperience } from "../components/ElsiaaExperience";
import { DesignsStory } from "../components/DesignsStory";

export const Route = createFileRoute("/designs")({
  component: Designs,
});

function Designs() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <ElsiaaExperience />
      <DesignsStory />
    </main>
  );
}
