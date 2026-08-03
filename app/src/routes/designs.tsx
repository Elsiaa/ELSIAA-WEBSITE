import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { DesignsShowcase } from "../components/DesignsShowcase";
import { absoluteUrl } from "../lib/site-url";

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
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [
      { rel: "preconnect", href: "https://primebins.com" },
      { rel: "preconnect", href: "https://isya-stack.github.io" },
      { rel: "canonical", href: absoluteUrl("/designs") },
    ],
  }),
  component: Designs,
});

function Designs() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />
      <DesignsShowcase />
    </main>
  );
}
