import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { QuoteWizard } from "../components/QuoteWizard";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/quote")({
  head: () => ({
    meta: [
      { title: "Get Your Project Quoted — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Tell us what you need built — design, automation, software, or consultation — and get a personal quote from ELSIAA within one business day.",
      },
      { property: "og:title", content: "Get Your Project Quoted — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [
      { rel: "canonical", href: absoluteUrl("/quote") },
    ],
  }),
  component: QuotePage,
});

function QuotePage() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-24 md:pt-44">
        {/* the hero copy sits beside the mascot; the form stays full width below */}
        <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1">
        <p
          className="text-[13px] text-[#1e6b3c] "
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Project Quote
        </p>
        <h1
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Tell us what you need. We'll quote it.
        </h1>
        <p className="mt-3 text-[13px] text-[#1e6b3c] " style={{ fontFamily: "var(--font-sans)" }}>
          Quote delivered within 1 business day
        </p>
        <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#111111]/60">
          A few focused questions — two minutes of your time. Your answers are
          distilled into a project brief for our team, and a personal quote
          comes back within one business day.
        </p>
        </div>
        <img
          src="/assets/quote/robot.png"
          alt=""
          width={760}
          height={760}
          className="hidden w-52 shrink-0 object-contain md:block lg:w-72"
        />
        </div>
        <div className="mt-10">
          <QuoteWizard />
        </div>
      </section>
    </main>
  );
}
