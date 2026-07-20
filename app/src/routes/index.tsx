import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { HomeRows } from "../components/HomeRows";

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
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
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
