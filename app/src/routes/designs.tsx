import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaExperience } from "../components/ElsiaaExperience";
import { DesignsStory } from "../components/DesignsStory";
import { SiteNav } from "../components/SiteNav";
import { ScrollHUD } from "../components/ScrollHUD";

export const Route = createFileRoute("/designs")({
  head: () => ({
    meta: [
      { title: "Designs — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Discover designs that convert strangers into customers. Brand identity, web, product visuals, motion and more — every discipline, one standard.",
      },
      { property: "og:title", content: "Designs — ELSIAA" },
      {
        property: "og:description",
        content: "Discover designs that convert strangers into customers.",
      },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
  }),
  component: Designs,
});

function Designs() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />
      <ScrollHUD />
      <ElsiaaExperience />
      <DesignsStory />
    </main>
  );
}
