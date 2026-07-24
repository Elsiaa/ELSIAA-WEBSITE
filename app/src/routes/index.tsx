import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { HomeRows } from "../components/HomeRows";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ELSIAA — AI Done Better" },
      {
        name: "description",
        content:
          "Design, automation, software, and consultation — four divisions, one standard. ELSIAA builds the technology and the image of businesses that intend to be taken seriously.",
      },
      { property: "og:title", content: "ELSIAA — AI Done Better" },
      {
        property: "og:description",
        content: "Four divisions. One empire of detail.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/") }],
  }),
  component: Home,
});

function Home() {
  return (
    <>
      <SiteNav />
      <HomeRows />
    </>
  );
}
