import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — ELSIAA · AI Done Better" },
      { name: "description", content: "Working with ELSIAA. New clients start here; existing clients sign in to the portal. How we work, what to expect, and the results." },
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

const STEPS: Array<[string, string, string]> = [
  ["1", "Free call", "Twenty minutes to understand the problem and where AI actually pays off. No deck, no obligation."],
  ["2", "Scoped proposal", "A clear plan, timeline, and fixed price within three days — you know exactly what you're buying."],
  ["3", "Design & build", "We build it live, inside your real workflow, reviewed as we go. You see progress, not promises."],
  ["4", "Launch & support", "It ships into production and keeps improving against real use. Delivery is the start of the standard."],
];

const EXPECT: Array<[string, string]> = [
  ["Fixed scope, fixed price", "You approve the plan and the number before a line of code is written."],
  ["One partner, four divisions", "Automation, software, design, and consultation — no relay race between vendors."],
  ["Your data stays yours", "Hardened, insured builds. Never used to train anyone else's model."],
  ["A direct line", "You work with the people building it — not an account manager relaying messages."],
];

const RESULTS: Array<[string, string, string]> = [
  ["0", "manual dispatch", "A field-service line where an AI agent books the emergency and routes the nearest tech — no dispatcher."],
  ["14 min", "average intake", "A health system's intake, down from ~31 minutes of hold time to a live agent that triages and requests the bed."],
  ["34 hrs", "to close the books", "A finance team's month-end, from six days and a weekend to an automated, audit-ready close."],
];

function ClientsPage() {
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* hero */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-9 md:pt-40 md:pb-16">
        <Reveal>
          <p className={eyebrow} style={mono}>Clients</p>
          <h1 className="mt-5 font-semibold tracking-[-0.045em]" style={{ ...inter, fontSize: "clamp(2.75rem, 6vw, 5rem)", lineHeight: 0.99 }}>
            Working with ELSIAA.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#111111]/60 md:text-xl" style={inter}>
            Two ways in. If you're new, we'll show you what's possible and scope it before you commit a dollar. If you're already with us, your build and your team are one click away.
          </p>
        </Reveal>
      </section>

      {/* two paths */}
 <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2">
          {/* new clients */}
          <Reveal>
            <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-8 md:p-10">
              <p className={eyebrow} style={mono}>New to ELSIAA?</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>Start with a conversation.</h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
                Tell us the step in your business that still waits on a person. We'll map where AI fits, then hand you a scoped plan and a price — the first twenty minutes are free.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="/contact" className="inline-flex items-center justify-center rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]" style={mono}>Start here →</a>
                <a href="/quote" className="text-[13px] text-[#111111]/55  transition-colors hover:text-[#1e6b3c]" style={mono}>Get a quote</a>
              </div>
            </div>
          </Reveal>
          {/* existing clients */}
          <Reveal delay={0.08}>
            <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0c0c0c] p-8 text-white md:p-10">
              <p className="text-[13px] text-[#2e9e58] " style={mono}>Already working with us?</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>Go to your portal.</h2>
              <p className="mt-3 flex-1 text-[15px] leading-relaxed text-white/60" style={inter}>
                Live project status, deliverables and source, invoices and documents, and a direct line to your team — all in one place.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href="/portal" className="inline-flex items-center justify-center rounded-full bg-[#2e9e58] px-7 py-3.5 text-[13px] font-bold text-white  transition-all hover:bg-[#111111] hover:text-white" style={mono}>Go to Client Portal →</a>
                <a href="/portal/sign-in" className="text-[13px] text-white/50  transition-colors hover:text-white" style={mono}>Sign in</a>
              </div>
              <p className="mt-4 text-[13px] text-white/40" style={inter}>Trouble signing in? Email <a href="mailto:info@elsiaa.com" className="text-[#2e9e58] hover:underline">info@elsiaa.com</a>.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* how we work */}
 <section className="bg-white px-6 py-9 md:py-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className={eyebrow} style={mono}>How we work</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>From first call to running system.</h2>
          </Reveal>
          <ol className="mt-9 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 0.05}>
                <li className="border-t border-black/10 pt-4">
                  <span className="text-[13px] font-semibold text-[#1e6b3c]" style={mono}>{n}</span>
                  <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.01em]" style={inter}>{t}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>{d}</p>
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
            <p className={eyebrow} style={mono}>What to expect</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>The standard, on every engagement.</h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/[0.08] sm:grid-cols-2">
            {EXPECT.map(([t, d], i) => (
              <Reveal key={t} delay={(i % 2) * 0.06}>
                <div className="h-full bg-white p-6 md:p-7">
                  <h3 className="text-[16px] font-semibold tracking-[-0.01em]" style={inter}>{t}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* results */}
 <section className="bg-white px-6 py-9 md:py-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className={eyebrow} style={mono}>Results</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>What the work looks like.</h2>
            <p className="mt-3 text-[13px] tracking-[0.04em] text-[#111111]/40" style={mono}>Figures are attached to anonymized engagements to protect client privacy.</p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {RESULTS.map(([n, label, d], i) => (
              <Reveal key={label} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6">
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-[#1e6b3c]" style={inter}>{n}</p>
                  <p className="mt-1 text-[13px] text-[#111111]/45 " style={mono}>{label}</p>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-[#111111]/60" style={inter}>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <a href="/automate" className="mt-6 inline-block text-[13px] text-[#1e6b3c]  hover:underline" style={mono}>See the systems, running live →</a>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F5F5F3] px-6 py-9 text-[#111111] md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Let's find your first system.</h2>
            <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-[#111111]/60" style={inter}>
              The first conversation is free, and you'll leave with a clear sense of what's possible.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a href="/contact" className="rounded-full bg-[#1e6b3c] px-9 py-4 text-[13px] font-bold text-white  transition-all hover:bg-[#111111] hover:text-white" style={mono}>Book a free call →</a>
              <a href="/portal/sign-in" className="rounded-full border border-black/15 px-8 py-4 text-[13px] font-bold text-[#111111]  transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white" style={mono}>Sign in</a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
