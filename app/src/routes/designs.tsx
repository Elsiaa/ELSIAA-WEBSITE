import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaExperience } from "../components/ElsiaaExperience";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/designs")({
  head: () => ({
    meta: [
      { title: "Designs — ELSIAA · AI Done Better" },
      {
        name: "description",
        content: "Discover designs that convert strangers into customers.",
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
      <ElsiaaExperience />
    </main>
  );
}
