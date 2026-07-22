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
          Our calendar runs tight. Pick an open slot — we confirm by email.
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


      {/* the process — a clean timeline */}
      <section className="mx-auto max-w-5xl border-t border-black/[0.06] px-6 py-16 md:py-20">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          The Process
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
          From first call to running system.
        </h2>
        <div className="mt-10">
          {[
            ["01", "The free call", "20 minutes with ELSIAA leadership. You talk, we map — a straight answer on where AI pays off in your business.", "Day 1"],
            ["02", "Scoped proposal", "A written plan with deliverables, timeline, and a fixed price. No surprises later — the quote is the contract's spine.", "Within 3 days"],
            ["03", "Design & build", "Sprints you can watch. Designs to approve, working software to click, automations running against real data.", "Weeks 1–6"],
            ["04", "Review & launch", "Hardened, tested, insured — then shipped. Your team trained on everything we hand over.", "Launch week"],
            ["05", "Ongoing partnership", "Support in every timezone, and a standing team for whatever you build next. Most clients never leave.", "Always on"],
          ].map(([n, title, body, when], i, arr) => (
            <div key={n} className="relative flex gap-6 pb-10 last:pb-0">
              {/* rail */}
              <div className="flex flex-col items-center">
                <span
                  className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#1e6b3c]/40 bg-white text-[11px] font-bold text-[#1e6b3c]"
                  style={mono}
                >
                  {n}
                </span>
                {i < arr.length - 1 && <span className="mt-2 w-px flex-1 bg-black/[0.08]" />}
              </div>
              <div className="pt-1.5">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em]" style={inter}>
                    {title}
                  </h3>
                  <span className="text-[10px] tracking-[0.22em] text-[#111111]/40 uppercase" style={mono}>
                    {when}
                  </span>
                </div>
                <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-[#111111]/55" style={inter}>
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
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
