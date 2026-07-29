import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { absoluteUrl } from "../lib/site-url";

/*
  New Automate — hosts the self-contained ELSIAA Secretary demonstration
  (two iPhones: live voice call + text chat, plus the Admin Command Center).
  The demo is a standalone HTML document served from /elsiaa-secretary.html, so
  we embed it full-screen in an iframe (with mic access) rather than porting its
  vanilla CSS/JS into React. The existing /automate page is left untouched.
*/

export const Route = createFileRoute("/new-automate")({
  head: () => ({
    meta: [
      { title: "New Automate — ELSIAA Secretary" },
      {
        name: "description",
        content:
          "ELSIAA Secretary — a live voice-and-chat customer-service agent. Call it or message it and watch the Admin Command Center work in real time.",
      },
      { property: "og:title", content: "ELSIAA Secretary — New Automate" },
      { property: "og:description", content: "Live voice & chat customer service, one memory." },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/new-automate") }],
  }),
  component: NewAutomate,
});

function NewAutomate() {
  return (
    <main style={{ minHeight: "100dvh", width: "100%", background: "#fff" }}>
      {/* the site's own nav, so the demo lives inside the site, not on its own.
          white strip behind the fixed nav so its ink logo/links stay readable
          on a page that never scrolls. */}
      <SiteNav />
      <div style={{ paddingTop: 72, height: "100dvh", background: "#fff", overflow: "hidden" }}>
        <iframe
          src="/elsiaa-secretary.html"
          aria-label="ELSIAA Secretary — live voice & chat demo"
          allow="microphone; autoplay"
          style={{ border: 0, width: "100%", height: "calc(100dvh - 72px)", display: "block" }}
        />
      </div>
    </main>
  );
}
