import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Working with ELSIAA. New clients start here; existing clients sign in to the portal. How we work, what to expect, and the results.",
      },
      { property: "og:title", content: "Clients — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/clients") }],
  }),
  component: ClientsPage,
});

const mono = { fontFamily: "var(--font-sans)" } as const;
const inter = { fontFamily: "var(--font-sans)" } as const;
const eyebrow = "text-[13px] text-[#1e6b3c] ";

/* The free-call offer is stated once, in the "new clients" card. It is
   deliberately not repeated here or in the closing CTA. */
const STEPS: Array<[string, string]> = [
  ["Call", "We learn the problem and where AI actually pays off."],
  ["Proposal", "A written plan, timeline, and fixed price within three days."],
  ["Build", "Built inside your real workflow, reviewed with you as it goes."],
  ["Launch", "It ships to production, and we maintain it once it's live."],
];

const EXPECT: Array<[string, string]> = [
  [
    "Fixed scope, fixed price",
    "You approve the plan and the number before a line of code is written.",
  ],
  [
    "One partner, four divisions",
    "Automation, software, design, and consultation, under one contract.",
  ],
  ["Your data stays yours", "Never used to train anyone else's model."],
  [
    "A direct line",
    "You work with the people building it — not an account manager relaying messages.",
  ],
];

function ClientsPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-9 md:pt-40 md:pb-16">
        <Reveal>
          <p className={eyebrow} style={mono}>
            Clients
          </p>
          <h1
            className="mt-5 font-semibold tracking-[-0.045em]"
            style={{ ...inter, fontSize: "clamp(2.75rem, 6vw, 5rem)", lineHeight: 0.99 }}
          >
            Working with ELSIAA.
          </h1>
          <p
            className="mt-6 max-w-2xl text-lg leading-relaxed text-[#111111]/60 md:text-xl"
            style={inter}
          >
            {/* The two cards below say what each path is; the lede no longer
                restates them. */}
            Two ways in — whether you're scoping your first build or signing in to one that's
            already running.
          </p>
        </Reveal>
      </section>

      {/* two paths */}
      <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {/* new clients */}
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-8 md:p-10">
              <p className={eyebrow} style={mono}>
                New to ELSIAA?
              </p>
              <h2
                className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl"
                style={inter}
              >
                Start with a conversation.
              </h2>
              <p
                className="mt-3 flex-1 text-[15px] leading-relaxed text-[#111111]/60"
                style={inter}
              >
                Tell us the step in your business that still waits on a person. We'll map where AI
                fits, then hand you a scoped plan and a price — the first twenty minutes are free.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]"
                  style={mono}
                >
                  Start here →
                </a>
                <a
                  href="/quote"
                  className="text-[13px] text-[#111111]/55  transition-colors hover:text-[#1e6b3c]"
                  style={mono}
                >
                  Get a quote
                </a>
              </div>
            </div>
          </Reveal>
          {/* existing clients */}
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-8 md:p-10">
              <p className={eyebrow} style={mono}>
                Already working with us?
              </p>
              <h2
                className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl"
                style={inter}
              >
                Go to your portal.
              </h2>
              <p
                className="mt-3 flex-1 text-[15px] leading-relaxed text-[#111111]/60"
                style={inter}
              >
                Live project status, deliverables and source, invoices and documents, and a direct
                line to your team — all in one place.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {/* /portal redirects unauthenticated visitors to sign-in, so a
                    separate "Sign in" link beside it was the same door twice. */}
                <a
                  href="/portal"
                  className="inline-flex items-center justify-center rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]"
                  style={mono}
                >
                  Go to Client Portal →
                </a>
              </div>
              <p className="mt-4 text-[13px] text-[#111111]/45" style={inter}>
                Trouble signing in? Email{" "}
                <a href="mailto:info@elsiaa.com" className="text-[#1e6b3c] hover:underline">
                  info@elsiaa.com
                </a>
                .
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* how we work */}
      <section className="bg-white px-6 py-9 md:py-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className={eyebrow} style={mono}>
              How we work
            </p>
            <h2
              className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl"
              style={inter}
            >
              From first call to running system.
            </h2>
          </Reveal>
          <ol className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.05}>
                <li className="border-t border-black/10 pt-4">
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em]" style={inter}>
                    {t}
                  </h3>
                  <p
                    className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/55"
                    style={inter}
                  >
                    {d}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* what to expect */}
      <section className="bg-[#F5F5F3] px-6 py-9 md:py-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className={eyebrow} style={mono}>
              What to expect
            </p>
            <h2
              className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl"
              style={inter}
            >
              The standard, on every engagement.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/[0.08] sm:grid-cols-2">
            {EXPECT.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 2) * 0.06}>
                <div className="h-full bg-white p-6 md:p-7">
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em]" style={inter}>
                    {t}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>
                    {d}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Close. Existing clients already have their door in the two-paths
          block above, so this speaks to new clients only and carries a single
          button — repeating the same contact/sign-in pair was the page's
          largest piece of duplication. */}
      <section className="bg-white px-6 py-12 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
              Let's find your first system.
            </h2>
            <p
              className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-[#111111]/60"
              style={inter}
            >
              Twenty minutes, no obligation, and you'll leave knowing what's possible.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
              <a
                href="/contact"
                className="rounded-full bg-[#1e6b3c] px-9 py-4 text-[13px] font-bold text-white transition-all hover:bg-[#111111]"
                style={mono}
              >
                Book a call →
              </a>
              <a
                href="/automate"
                className="text-[13px] text-[#111111]/55 transition-colors hover:text-[#1e6b3c]"
                style={mono}
              >
                See the systems, running live →
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
