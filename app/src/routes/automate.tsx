import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { AUTOSOFT } from "../components/HomeRows";
import { Seam, ProofDeck, Secretary } from "../components/automate-console";
import { IntakeOS } from "../components/intake-os";
import { IndustryWalkthrough } from "../components/IndustryWalkthrough";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/automate")({
  head: () => ({
    meta: [
      { title: "Automate — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Before AI, the business waited on a person. Operate the software ELSIAA builds to run it instead — live consoles, a draggable before/after seam, and a multilingual AI secretary you can talk to.",
      },
      { property: "og:title", content: "Automate — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/automate") }],
  }),
  component: AutomatePage,
});

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

/* ------------------------------- process ------------------------------- */
const STEPS: Array<[string, string, string, boolean]> = [
  ["1", "Map the real work", "We sit with the people doing it and trace every step, handoff, and workaround. The engagement begins as observation, not software.", false],
  ["2", "Design the custom system", "We turn how your business actually runs into a spec — the exact workflows, screens, and logic your software will own. Nothing off-the-shelf.", false],
  ["3", "Build the software live with you", "Working custom software from day one, inside your real workflow. We don't demo a mockup; we hand you the thing and build against your feedback.", false],
  ["4", "Embed the AI where it creates leverage", "Voice agents, decision logic, reconciliation, anomaly detection — added only where they earn their place, never as a headline.", false],
  ["5", "Prove the before/after results", "Measured against the old way, in hours, not sprints. Anything slower or less reliable than what it replaces gets rebuilt until it holds.", true],
  ["6", "Hand it over running and insured", "It ships live, your team is trained, and it keeps improving against real use. Fully owned by you, fully insured.", false],
];

/* -------------------- catalog category map -------------------- */
const CAT: Record<string, string> = {
  Operations: "Automation", "Customer Support": "Automation", Sales: "Automation", HR: "Automation", Finance: "Automation",
  Web: "Software", Apps: "Software", Mobile: "Software", Enterprise: "Software", Infrastructure: "Software", Product: "Software",
  AI: "Data & AI",
  Branding: "Design", Marketing: "Design",
};
const FILTERS = ["All", "Automation", "Software", "Data & AI", "Design"] as const;

/* small hero seam bodies */
function MiniBefore() {
  return (
    <div className="relative h-full w-full bg-[#e9eaec] p-3">
      <div className="absolute inset-x-3 top-3 h-[70%] overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1"><span className="h-2 w-2 rounded-full bg-white/70" /><span className="truncate text-[13px] font-semibold text-white" style={inter}>ops_tracker_final_USE THIS ONE.xlsx</span></div>
        <div className="grid grid-cols-7">{Array.from({ length: 70 }).map((_, i) => (<div key={i} className={`h-3 border-r border-b border-black/[0.07] ${i % 7 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[9, 23, 37].includes(i) ? "bg-[#fecaca]/70" : ""} ${[15, 30, 44].includes(i) ? "bg-[#fde68a]/60" : ""}`} />))}</div>
      </div>
      <div className="absolute right-5 bottom-5 w-24 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>ask Karen — she's the only one who knows</p></div>
    </div>
  );
}
function MiniAfter() {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-3 py-2"><span className="text-[13px] font-semibold" style={inter}>Operations OS</span><span className="flex items-center gap-1 rounded-full bg-[#1e6b3c]/10 px-2 py-0.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" /><span className="text-[13px] text-[#1e6b3c] " style={mono}>Live</span></span></div>
      <div className="grid grid-cols-3 gap-px border-b border-black/[0.06] bg-black/[0.05]">{[["Open jobs", "42"], ["Avg cycle", "3.1h"], ["SLA met", "99%"]].map(([l, v]) => (<div key={l} className="bg-white px-2.5 py-2"><p className="text-[7.5px] text-[#111111]/40 " style={mono}>{l}</p><p className="mt-0.5 text-[13px] font-semibold tabular-nums" style={inter}>{v}</p></div>))}</div>
      <div className="flex-1 p-3">{["Invoice batch · reconciled", "New order · routed to fulfilment", "Support ticket · auto-resolved", "Renewal · flagged to sales"].map((r, i) => (<div key={i} className="flex items-center gap-2 border-b border-black/[0.05] py-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" /><span className="text-[13px] text-[#111111]/70" style={inter}>{r}</span></div>))}</div>
    </div>
  );
}

/* closing comparison — one relatable process: the after-hours call */
function CallBefore() {
  return (
    <div className="relative h-full w-full bg-[#eef0ef] p-4">
      <div className="absolute inset-4 rounded-lg border border-black/10 bg-white p-3 shadow-inner">
        <p className="text-[13px] text-[#111111]/40 " style={mono}>Voicemail · after hours</p>
        <div className="mt-3 space-y-2.5">
          {["Missed call · 9:14pm", "Missed call · 9:41pm", "Voicemail · 10:02pm (0:38)"].map((r, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-black/[0.06] pb-2"><span className="h-2 w-2 rounded-full bg-[#b42318]/70" /><span className="text-[13px] text-[#111111]/60" style={inter}>{r}</span></div>
          ))}
        </div>
      </div>
      <div className="absolute right-6 bottom-6 w-28 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>call them back first thing — hope they didn't book elsewhere</p></div>
    </div>
  );
}
function CallAfter() {
  return (
    <div className="flex h-full w-full flex-col bg-white p-4">
      <p className="text-[13px] text-[#1e6b3c] " style={mono}>Agent · 9:14pm · booked in 40s</p>
      <div className="mt-3 space-y-2">
        <div className="max-w-[85%] rounded-2xl bg-black/[0.04] px-3 py-2 text-[11.5px] text-[#111111]/75" style={inter}>"My water heater's leaking — can someone come tonight?"</div>
        <div className="ml-auto max-w-[85%] rounded-2xl bg-[#1e6b3c]/[0.08] px-3 py-2 text-[11.5px]" style={inter}>Booked. A technician is 22 minutes out — I've texted you the ETA and a photo of who's coming.</div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-black/[0.07] bg-black/[0.05]">
        {[["Answered", "24/7"], ["Booked", "40s"], ["Lost", "0"]].map(([l, v]) => (
          <div key={l} className="bg-white px-2 py-2 text-center"><p className="text-[7.5px] text-[#111111]/40 " style={mono}>{l}</p><p className="mt-0.5 text-[13px] font-semibold" style={inter}>{v}</p></div>
        ))}
      </div>
    </div>
  );
}

function AutomatePage() {
  const [filter, setFilter] = useState<string>("All");
  const [step, setStep] = useState("");

  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* ---------- hero: custom software + AI ---------- */}
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>Custom software · AI implementation</p>
            <h1 className="mt-5 font-semibold tracking-[-0.045em]" style={{ ...inter, fontSize: "clamp(2.3rem, 4.8vw, 4.1rem)", lineHeight: 1.0 }}>
              We build custom software that puts AI to work inside your business.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#111111]/60" style={inter}>
              Not templates. Not chatbots you forget about. Real systems designed, built, and implemented for the way you actually operate.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="/contact" className="rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[13px] font-bold text-white transition-all hover:bg-[#111111]" style={mono}>Show us one process → We'll build the system</a>
            </div>
            <p className="mt-5 text-[13px] tracking-[0.02em] text-[#111111]/50" style={mono}>
              Fully insured · Fixed scope · Live results before you commit
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
              <Seam before={<MiniBefore />} after={<MiniAfter />} height="aspect-[4/3]" labelLeft="Before" labelRight="After" />
            </div>
            <p className="mt-3 text-center text-[13px] text-[#111111]/40 " style={mono}>Drag the line ↔ the manual reality, and the system that replaces it</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- the core promise ---------- */}
      <section className="border-t border-black/[0.06] bg-[#0c0c0c] px-6 py-20 text-white md:py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Custom software. Real AI. Delivered.</h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70" style={inter}>
              Most companies buy AI tools. We build the software layer that makes AI actually run your operations — sales, intake, dispatch, finance, support, and everything in between.
            </p>
            <p className="mt-4 text-lg leading-relaxed font-medium text-white/90" style={inter}>
              One partner. Full ownership. Systems that keep working long after the demo ends.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- what "custom" means here ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>What "custom" actually means here</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>Nothing off-the-shelf. Every layer built for you.</h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              ["We design it", "We map your exact workflows, pain points, and systems. Nothing is off-the-shelf — the spec comes from how your business actually runs."],
              ["We build it", "Custom web apps, internal tools, AI agents, integrations, and dashboards — engineered for your business, owned by you."],
              ["We implement it", "We put it live, train your team, connect it to your existing stack, and prove the results against the old way."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-black/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35">
                  <p className="text-[13px] text-[#1e6b3c]" style={mono}>0{i + 1}</p>
                  <h3 className="mt-2.5 text-[18px] font-semibold tracking-[-0.02em]" style={inter}>{t}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{b}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- proof: real systems, not demos ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>The proof</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Real systems. Not demos.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Every one of these was custom software, scoped and built for a specific business, and handed over running. Client names and data are changed to protect privacy.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {[
              ["Custom AI Intake + Scheduling System", "For healthcare clinics — a phone line and web intake that understand a patient in plain language, match them to the right specialist, and book it, with escalation when it isn't sure."],
              ["Custom Dispatch & Field Service OS", "One board that takes the job, routes the nearest qualified tech, sends the ETA, and reconciles the ticket — replacing three tools and a whiteboard."],
              ["Custom Sales + CRM Automation Layer", "Every lead captured, enriched, and routed the moment it lands; follow-ups and updates written back automatically so nothing is worked twice or dropped."],
              ["Custom Finance Reconciliation Engine", "Invoices and payments matched automatically, exceptions surfaced for review — the month-end close measured in hours, not a week of manual keying."],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={(i % 2) * 0.06}>
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                  <h3 className="text-[18px] font-semibold tracking-[-0.02em]" style={inter}>{t}</h3>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{b}</p>
                  <p className="mt-5 border-t border-black/[0.06] pt-4 text-[13px] text-[#1e6b3c]" style={mono}>
                    Built from scratch · Running in production · Fully owned by the client
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* live industry walkthrough */}
      <section className="border-t border-black/[0.06] py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <IndustryWalkthrough />
        </div>
      </section>

      {/* ---------- the tax ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Every manual step is a tax.</h2>
            <p className="mt-5 text-lg leading-relaxed text-[#111111]/65" style={inter}>
              The old way broke quietly — a number keyed twice, a job booked over, a call that rang out at 9pm. It never scaled past its busiest employee.
            </p>
            <p className="mt-5 border-l-2 border-[#1e6b3c] pl-5 text-lg leading-relaxed font-medium text-[#111111]/80" style={inter}>
              Automation isn't a tool the team uses. It's the layer the business runs on.
            </p>
          </Reveal>
          <div className="mt-9 space-y-px overflow-hidden rounded-xl border border-black/[0.08]">
            {[["Keyed twice", "2× the error rate"], ["Waited on a person", "Capped at one person's hours"], ["Rang out at 9pm", "1 in 3 revenue calls lost"]].map(([a, b], i) => (
              <Reveal key={a} delay={i * 0.06}>
                <div className="flex items-baseline justify-between gap-4 bg-white px-5 py-4">
                  <span className="text-[13px] tracking-[0.1em] text-[#111111]/50 " style={mono}>{a}</span>
                  <span className="text-right text-[14px] font-semibold text-[#111111]/85" style={inter}>{b}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- the proof deck ---------- */}
      <section id="proof" className="scroll-mt-20 bg-white px-6 pt-24 pb-24 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>The proof</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>The old way, and what we built next to it.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Real systems, running live. Pick one, drag the seam between the manual reality and the software that replaced it, then run it — every decision the system makes is shown.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed tracking-[0.04em] text-[#111111]/40" style={mono}>
              Client names, data, and branding shown here have been changed or removed to protect privacy.
            </p>
          </Reveal>
          <div className="mt-10">
            <ProofDeck />
          </div>
        </div>
      </section>

      {/* ---------- the AI secretary (star) ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>The secretary</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>It answers in three languages. And it actually does the work.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Place a call in English, Hebrew, or Russian. Watch it understand, take real actions in the background, and show its reasoning — including when it asks for clarification or escalates instead of guessing.
            </p>
          </Reveal>
          <div className="mt-10">
            <Secretary />
          </div>
        </div>
      </section>

      {/* ---------- featured product: Intake OS (embedded) ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[13px] text-[#1e6b3c] " style={mono}>Featured product · Voice</p>
              <span className="rounded-full border border-[#1e6b3c]/30 px-2.5 py-0.5 text-[13px] font-bold text-[#1e6b3c] " style={mono}>Playable</span>
            </div>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Intake OS — the line that routes itself.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              A phone line that understands a caller in plain language, matches them to the right specialist, and books it — and asks instead of guessing when it isn't sure. Run a call; the left pane is the caller's line, the right pane is the system underneath.
            </p>
            <a href="/intake" className="mt-3 inline-block text-[13px] text-[#1e6b3c]  hover:underline" style={mono}>Open the full product page →</a>
          </Reveal>
          <div className="mt-10">
            <IntakeOS />
          </div>
        </div>
      </section>

      {/* ---------- process spine ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The ELSIAA build process</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Every custom build runs the same road.</h2>
          </Reveal>
          {/* desktop spine */}
          <div className="mt-14 hidden lg:block">
            <div className="relative">
              <div className="absolute top-[6px] right-0 left-0 h-px bg-black/10" />
              <div className="grid grid-cols-6 gap-4">
                {STEPS.map(([n, t, d, key], i) => (
                  <Reveal key={n} delay={i * 0.06}>
                    <div className="relative">
                      <span className={`absolute -top-[2px] left-0 block rounded-full ${key ? "h-3.5 w-3.5 bg-[#1e6b3c] ring-4 ring-[#1e6b3c]/15" : "h-2.5 w-2.5 bg-[#1e6b3c]/40"}`} />
                      <p className="mt-6 text-[13px] text-[#1e6b3c]" style={mono}>{n}</p>
                      <h3 className="mt-2 text-[15px] font-semibold tracking-[-0.01em]" style={inter}>{t}{key && <span className="ml-1 text-[#1e6b3c]">✓</span>}</h3>
                      <p className="mt-2 text-[12.5px] leading-relaxed text-[#111111]/55" style={inter}>{d}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
          {/* mobile vertical rail */}
          <div className="mt-12 lg:hidden">
            <div className="relative border-l border-black/10 pl-6">
              {STEPS.map(([n, t, d, key], i) => (
                <Reveal key={n} delay={i * 0.04}>
                  <div className="relative pb-8">
                    <span className={`absolute top-1 -left-[25px] block rounded-full ${key ? "h-3 w-3 bg-[#1e6b3c] ring-4 ring-[#1e6b3c]/15" : "h-2 w-2 bg-[#1e6b3c]/40"}`} />
                    <p className="text-[13px] text-[#1e6b3c]" style={mono}>{n}</p>
                    <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.01em]" style={inter}>{t}{key && <span className="ml-1 text-[#1e6b3c]">✓</span>}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>{d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- capability catalog ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>What we build</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>Custom software + AI systems for every part of the business.</h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Revenue & Sales", "custom pipelines, lead capture, and CRM automation"],
              ["Operations & Dispatch", "custom scheduling, routing, and field-service systems"],
              ["Customer Intake & Support", "custom intake lines, triage, and support workflows"],
              ["Finance & Back-office", "custom reconciliation, invoicing, and reporting engines"],
              ["Internal Tools & Dashboards", "custom apps and live dashboards for your team"],
              ["Full AI Agents & Workflow Automation", "custom agents that run multi-step work end to end"],
            ].map(([t, b], i) => (
              <Reveal key={t} delay={(i % 3) * 0.05}>
                <div className="h-full rounded-xl border border-black/[0.08] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/40">
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em]" style={inter}>{t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60" style={inter}>We build {b} — for your business.</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="mt-14 text-[13px] text-[#1e6b3c] " style={mono}>Every capability, in detail</p>
          </Reveal>
          {/* filter row */}
          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-none rounded-full border px-4 py-1.5 text-[13px] font-bold  transition-all ${filter === f ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/12 text-[#111111]/55 hover:border-[#1e6b3c]/40"}`} style={mono}>{f}</button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {AUTOSOFT.map((s, i) => {
              const cat = CAT[s.name] ?? "Software";
              const on = filter === "All" || filter === cat;
              return (
                <div key={`${s.name}-${i}`} className="h-full rounded-xl border border-black/[0.07] bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/40" style={{ opacity: on ? 1 : 0.2, transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)" }}>
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[13.5px] font-semibold tracking-[-0.01em]" style={inter}>{s.name}</h3>
                    <span className="text-[13px] text-[#1e6b3c]/70 " style={mono}>{cat}</span>
                  </div>
                  <ul className="mt-2.5 space-y-1">
                    {s.items.slice(0, 3).map((it) => (<li key={it} className="text-[13px] leading-snug text-[#111111]/55" style={inter}>{it}</li>))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- closing side-by-side comparison ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>The difference, in one call</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
              A call at 9pm. That's the whole business case.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
              <Seam before={<CallBefore />} after={<CallAfter />} height="aspect-[16/9]" labelLeft="Rang out" labelRight="Booked" />
            </div>
            <p className="mt-4 text-center text-[13px] text-[#111111]/55" style={inter}>
              This is what replacing manual work with intelligent systems actually looks like — not fewer people, but no revenue left on the floor at 9pm.
            </p>
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.05]">
            {[["Calls answered", "24/7"], ["Time to booked", "40s"], ["Revenue lost", "0"]].map(([l, v]) => (
              <div key={l} className="bg-white px-3 py-5 text-center"><p className="text-[13px] text-[#111111]/40 " style={mono}>{l}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1e6b3c]" style={inter}>{v}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- final CTA (operable) ---------- */}
      <section className="bg-[#0c0c0c] px-6 py-24 text-white md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-6xl" style={inter}>Stop buying AI tools. Start running custom systems.</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/60" style={inter}>
              Show us the process that still depends on people, spreadsheets, or duct-taped tools. We'll design and build the software that replaces it — and show you the working system before you spend a dollar.
            </p>
            <form action="/contact" method="get" className="mx-auto mt-9 max-w-xl">
              <label className="block text-left text-[13px] text-white/45 " style={mono}>The process we should replace is…</label>
              <input
                name="step"
                value={step}
                onChange={(e) => setStep(e.target.value)}
                placeholder="e.g. someone re-keys every invoice by hand"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#2e9e58] focus:ring-2 focus:ring-[#2e9e58]/40 focus:outline-none"
                style={inter}
              />
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button type="submit" className="rounded-full bg-[#2e9e58] px-9 py-4 text-[13px] font-bold text-white  transition-all hover:bg-white hover:text-[#111111]" style={mono}>Book a strategy call →</button>
                <a href="/quote" className="rounded-full border border-white/25 px-8 py-4 text-[13px] font-bold text-white  transition-all hover:border-white hover:bg-white hover:text-[#111111]" style={mono}>Get a fixed-scope quote</a>
              </div>
            </form>
            <p className="mt-8 text-[13px] text-white/35 " style={mono}><a href="/clients" className="underline-offset-2 hover:text-white/70 hover:underline">Fully insured builds ↗</a> · Six cities · One standard</p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
