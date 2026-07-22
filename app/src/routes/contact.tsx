import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { RequestCalendar } from "../components/RequestCalendar";
import { Packages } from "../components/Packages";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Request a free 20-minute call with ELSIAA, browse our packages, or get your project quoted.",
      },
      { property: "og:title", content: "Contact Us — ELSIAA" },
      { property: "og:image", content: "/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/contact" }],
  }),
  component: ContactPage,
});

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-5xl px-6 pt-36 pb-10 md:pt-44">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          Contact Us
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
          Let's talk. First 20 minutes are on us.
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
          A free 20-minute intro call with the ELSIAA team. Our calendar runs
          tight — pick an open slot and request it, and we'll confirm by email.
        </p>
        <div className="mt-10">
          <RequestCalendar />
        </div>
        <p className="mt-6 text-[13.5px] text-[#111111]/45" style={inter}>
          Prefer writing? Reach us at{" "}
          <a href="mailto:isya@elsiaa.com" className="font-medium text-[#1e6b3c] hover:underline">
            isya@elsiaa.com
          </a>{" "}
          — or{" "}
          <a href="/quote" className="font-medium text-[#1e6b3c] hover:underline">
            get your project quoted
          </a>{" "}
          in two minutes.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-20">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          Our Packages
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
          What we offer.
        </h2>
        <div className="mt-8">
          <Packages />
        </div>
      </section>
    </main>
  );
}
