import { createFileRoute } from "@tanstack/react-router";
import { ElsiaaExperience } from "../components/ElsiaaExperience";
import { SiteNav } from "../components/SiteNav";
import { DesignsShowcase, DesignsFinalCTA } from "../components/DesignsShowcase";

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
    links: [
      { rel: "preconnect", href: "https://primebins.com" },
      { rel: "preconnect", href: "https://isya-stack.github.io" },
    ],
  }),
  component: Designs,
});

function Designs() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />
      <DesignsShowcase />
      <ElsiaaExperience />
      <DesignsFinalCTA />
    </main>
  );
}
