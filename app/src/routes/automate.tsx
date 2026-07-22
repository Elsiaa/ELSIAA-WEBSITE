import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { AUTOSOFT } from "../components/HomeRows";
import { Seam, ProofDeck, Secretary } from "../components/automate-console";

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
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/automate" }],
  }),
  component: AutomatePage,
});

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

/* ------------------------------- process ------------------------------- */
const STEPS: Array<[string, string, string, boolean]> = [
  ["01", "Map the work", "We sit with the people doing it and trace every step, handoff, and workaround. The engagement begins as observation, not software.", false],
  ["02", "Find the waste", "The manual re-entry, the waiting, the double-booking. Where the business quietly pays a tax on human time — that becomes the spec.", false],
  ["03", "Build it live", "Working software from day one, inside your real workflow. We don't demo a mockup; we hand you the thing.", false],
  ["04", "Add the intelligence", "Voice agents, decision logic, anomaly detection — added only where they earn their place, never as a headline.", false],
  ["05", "Prove it", "Measured against the old way, in hours, not sprints. Anything slower or less reliable than the spreadsheet gets rebuilt until it holds.", true],
  ["06", "Run it", "It ships live and keeps improving against real use. Delivery is the beginning of the standard, not the end of it.", false],
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
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1"><span className="h-2 w-2 rounded-full bg-white/70" /><span className="truncate text-[8px] font-semibold text-white" style={inter}>ops_tracker_final_USE THIS ONE.xlsx</span></div>
        <div className="grid grid-cols-7">{Array.from({ length: 70 }).map((_, i) => (<div key={i} className={`h-3 border-r border-b border-black/[0.07] ${i % 7 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[9, 23, 37].includes(i) ? "bg-[#fecaca]/70" : ""} ${[15, 30, 44].includes(i) ? "bg-[#fde68a]/60" : ""}`} />))}</div>
      </div>
      <div className="absolute right-5 bottom-5 w-24 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[8px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>ask Karen — she's the only one who knows</p></div>
    </div>
  );
}
function MiniAfter() {
  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-black/[0.06] px-3 py-2"><span className="text-[11px] font-semibold" style={inter}>Operations OS</span><span className="flex items-center gap-1 rounded-full bg-[#1e6b3c]/10 px-2 py-0.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" /><span className="text-[8px] tracking-[0.16em] text-[#1e6b3c] uppercase" style={mono}>Live</span></span></div>
      <div className="grid grid-cols-3 gap-px border-b border-black/[0.06] bg-black/[0.05]">{[["Open jobs", "42"], ["Avg cycle", "3.1h"], ["SLA met", "99%"]].map(([l, v]) => (<div key={l} className="bg-white px-2.5 py-2"><p className="text-[7.5px] tracking-[0.16em] text-[#111111]/40 uppercase" style={mono}>{l}</p><p className="mt-0.5 text-[13px] font-semibold tabular-nums" style={inter}>{v}</p></div>))}</div>
      <div className="flex-1 p-3">{["Invoice batch · reconciled", "New order · routed to fulfilment", "Support ticket · auto-resolved", "Renewal · flagged to sales"].map((r, i) => (<div key={i} className="flex items-center gap-2 border-b border-black/[0.05] py-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" /><span className="text-[10px] text-[#111111]/70" style={inter}>{r}</span></div>))}</div>
    </div>
  );
}

/* closing comparison — one relatable process: the after-hours call */
function CallBefore() {
  return (
    <div className="relative h-full w-full bg-[#eef0ef] p-4">
      <div className="absolute inset-4 rounded-lg border border-black/10 bg-white p-3 shadow-inner">
        <p className="text-[9px] tracking-[0.2em] text-[#111111]/40 uppercase" style={mono}>Voicemail · after hours</p>
        <div className="mt-3 space-y-2.5">
          {["Missed call · 9:14pm", "Missed call · 9:41pm", "Voicemail · 10:02pm (0:38)"].map((r, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-black/[0.06] pb-2"><span className="h-2 w-2 rounded-full bg-[#b42318]/70" /><span className="text-[11px] text-[#111111]/60" style={inter}>{r}</span></div>
          ))}
        </div>
      </div>
      <div className="absolute right-6 bottom-6 w-28 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[8px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>call them back first thing — hope they didn't book elsewhere</p></div>
    </div>
  );
}
function CallAfter() {
  return (
    <div className="flex h-full w-full flex-col bg-white p-4">
      <p className="text-[9px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>Agent · 9:14pm · booked in 40s</p>
      <div className="mt-3 space-y-2">
        <div className="max-w-[85%] rounded-2xl bg-black/[0.04] px-3 py-2 text-[11.5px] text-[#111111]/75" style={inter}>"My water heater's leaking — can someone come tonight?"</div>
        <div className="ml-auto max-w-[85%] rounded-2xl bg-[#1e6b3c]/[0.08] px-3 py-2 text-[11.5px]" style={inter}>Booked. A technician is 22 minutes out — I've texted you the ETA and a photo of who's coming.</div>
      </div>
      <div className="mt-auto grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-black/[0.07] bg-black/[0.05]">
        {[["Answered", "24/7"], ["Booked", "40s"], ["Lost", "0"]].map(([l, v]) => (
          <div key={l} className="bg-white px-2 py-2 text-center"><p className="text-[7.5px] tracking-[0.14em] text-[#111111]/40 uppercase" style={mono}>{l}</p><p className="mt-0.5 text-[13px] font-semibold" style={inter}>{v}</p></div>
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

      {/* ---------- hero ---------- */}
      <section className="mx-auto max-w-6xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>Automate · The layer your business runs on</p>
            <h1 className="mt-5 font-semibold tracking-[-0.045em]" style={{ ...inter, fontSize: "clamp(2.5rem, 5.5vw, 4.75rem)", lineHeight: 0.99 }}>
              Before AI, the business<br />waited on a person.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#111111]/60" style={inter}>
              A spreadsheet nobody trusted. A phone that had to be answered. A step only one person knew. We replace that layer with software — and prove it, side by side.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#proof" className="rounded-full bg-[#1e6b3c] px-7 py-3.5 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[#111111]" style={mono}>See it run ↓</a>
              <a href="/contact" className="rounded-full border border-[#111111]/20 px-7 py-3.5 text-[12px] font-bold tracking-[0.2em] text-[#111111] uppercase transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]" style={mono}>Book a call</a>
            </div>
          </Reveal>
          <Reveal delay={0.12}>
            <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
              <Seam before={<MiniBefore />} after={<MiniAfter />} height="aspect-[4/3]" labelLeft="Before" labelRight="After" />
            </div>
            <p className="mt-3 text-center text-[10px] tracking-[0.16em] text-[#111111]/40 uppercase" style={mono}>Drag the line ↔ the whole thesis, in one tile</p>
          </Reveal>
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
                  <span className="text-[11px] tracking-[0.1em] text-[#111111]/50 uppercase" style={mono}>{a}</span>
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
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The proof</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>The old way, and what we built next to it.</h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Real systems, running live. Pick one, drag the seam between the manual reality and the software that replaced it, then run it — every decision the system makes is shown.
            </p>
            <p className="mt-3 text-[11px] leading-relaxed tracking-[0.04em] text-[#111111]/40" style={mono}>
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
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The secretary</p>
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

      {/* ---------- process spine ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The ELSIAA process</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>Every automation runs the same road.</h2>
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
                      <p className="mt-6 text-[10px] tracking-[0.3em] text-[#1e6b3c]" style={mono}>{n}</p>
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
                    <p className="text-[10px] tracking-[0.3em] text-[#1e6b3c]" style={mono}>{n}</p>
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
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>Everything the division ships</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>From the first wireframe to the cloud it runs on.</h2>
          </Reveal>
          {/* filter row */}
          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`flex-none rounded-full border px-4 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-all ${filter === f ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/12 text-[#111111]/55 hover:border-[#1e6b3c]/40"}`} style={mono}>{f}</button>
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
                    <span className="text-[8px] tracking-[0.16em] text-[#1e6b3c]/70 uppercase" style={mono}>{cat}</span>
                  </div>
                  <ul className="mt-2.5 space-y-1">
                    {s.items.slice(0, 3).map((it) => (<li key={it} className="text-[12px] leading-snug text-[#111111]/55" style={inter}>{it}</li>))}
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
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The difference, in one call</p>
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
              <div key={l} className="bg-white px-3 py-5 text-center"><p className="text-[8px] tracking-[0.16em] text-[#111111]/40 uppercase" style={mono}>{l}</p><p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#1e6b3c]" style={inter}>{v}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- final CTA (operable) ---------- */}
      <section className="bg-[#0c0c0c] px-6 py-24 text-white md:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-6xl" style={inter}>Show us the step that waits on a person.</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/60" style={inter}>
              We'll build the system that does it instead — and show you the before and after before you commit a dollar.
            </p>
            <form action="/contact" method="get" className="mx-auto mt-9 max-w-xl">
              <label className="block text-left text-[10px] tracking-[0.24em] text-white/45 uppercase" style={mono}>The step that waits on a person is…</label>
              <input
                name="step"
                value={step}
                onChange={(e) => setStep(e.target.value)}
                placeholder="e.g. someone re-keys every invoice by hand"
                className="mt-2 w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 focus:border-[#2e9e58] focus:ring-2 focus:ring-[#2e9e58]/40 focus:outline-none"
                style={inter}
              />
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button type="submit" className="rounded-full bg-[#2e9e58] px-9 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-white hover:text-[#111111]" style={mono}>Book a strategy call →</button>
                <a href="/quote" className="rounded-full border border-white/25 px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:border-white hover:bg-white hover:text-[#111111]" style={mono}>Get a quote</a>
              </div>
            </form>
            <p className="mt-8 text-[10px] tracking-[0.24em] text-white/35 uppercase" style={mono}>Fully insured builds · Six cities · One standard</p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
