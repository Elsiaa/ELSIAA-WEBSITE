import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { AUTOSOFT } from "../components/HomeRows";
import {
  BeforeAfter,
  Dash,
  BeforeField,
  BeforeWhiteboard,
  BeforeSpreadsheet,
  FieldDispatch,
  HospitalBoard,
  FinanceClose,
  RentalFleet,
  type Vertical,
} from "../components/automate-mocks";

export const Route = createFileRoute("/automate")({
  head: () => ({
    meta: [
      { title: "Automate — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Before AI, the business waited on a person. See the custom software and AI systems ELSIAA builds to run it instead — real, live, before and after.",
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

/* ------------------------------- the walkthroughs ------------------------------- */
const VERTICALS: Vertical[] = [
  {
    id: "field",
    sector: "Field service · Live demo",
    name: "Dispatch OS",
    line: "A plumbing business used to run on a whiteboard, a phone, and a spreadsheet named USE THIS ONE. Now a voice agent books the emergency and routes the nearest tech — no dispatcher.",
    before: {
      title: "the old way",
      mock: <BeforeField />,
      ledger: [
        { label: "Time to dispatch a job", value: "~11 min on the phone" },
        { label: "Double-booked / week", value: "6–9 jobs" },
        { label: "After-hours calls", value: "1 in 3 missed" },
      ],
    },
    after: {
      url: "dispatch.plumbingco.live",
      mock: (
        <Dash name="Dispatch OS" nav={["Map", "Queue", "Techs", "Invoices", "Voice"]} kpis={[["Techs live", "18", "flat"], ["Jobs today", "63", "up"], ["Avg ETA", "26m", "down"], ["First-fix", "94%", "up"]]}>
          <FieldDispatch />
        </Dash>
      ),
      ledger: [
        { label: "Time to dispatch a job", value: "0 — the agent books it" },
        { label: "Double-booked / week", value: "0" },
        { label: "After-hours calls", value: "Answered 24/7" },
      ],
    },
    live: { label: "Open the live demo", href: "https://plumbing.demo.elsiaa.com" },
  },
  {
    id: "health",
    sector: "Health system · Custom build",
    name: "Patient Flow OS",
    line: "A dry-erase bed board and an intake line on hold. Now every bed, intake, and clinician sits on one live board — and an AI agent answers, triages, and requests the bed before a human picks up.",
    before: {
      title: "the old way",
      mock: <BeforeWhiteboard />,
      ledger: [
        { label: "Average intake time", value: "~31 min, mostly hold" },
        { label: "Bed board accuracy", value: "Whoever updated last" },
        { label: "Calls abandoned", value: "22%" },
      ],
    },
    after: {
      url: "flow.health-system.internal",
      mock: (
        <Dash name="Patient Flow OS" nav={["Census", "Intake", "Beds", "Staff", "Reports"]} kpis={[["Occupancy", "87%", "up"], ["Avg intake", "14m", "down"], ["ER wait", "22m", "down"], ["Discharges", "41", "up"]]}>
          <HospitalBoard />
        </Dash>
      ),
      ledger: [
        { label: "Average intake time", value: "14 min" },
        { label: "Bed board accuracy", value: "Live, to the minute" },
        { label: "Calls abandoned", value: "0 — agent answers" },
      ],
    },
  },
  {
    id: "finance",
    sector: "Finance operations · Custom build",
    name: "Close & Reconciliation OS",
    line: "The month-end close lived in CLOSE_Q3_final_FINAL_v12 and three late nights. Now every account reconciles itself, every anomaly is flagged with a correcting entry drafted, every step audit-ready.",
    before: {
      title: "the old way",
      mock: <BeforeSpreadsheet />,
      ledger: [
        { label: "Time to close the books", value: "6 days + weekend" },
        { label: "Reconciliation", value: "By hand, cell by cell" },
        { label: "Errors caught", value: "After statements shipped" },
      ],
    },
    after: {
      url: "close.finance-ops.internal",
      mock: (
        <Dash name="Close & Reconciliation OS" nav={["Close", "Recs", "Anomalies", "Journal", "Audit"]} kpis={[["Reconciled", "92%", "up"], ["Exceptions", "3", "down"], ["Days to close", "1.4", "down"], ["Caught", "$920k", "up"]]}>
          <FinanceClose />
        </Dash>
      ),
      ledger: [
        { label: "Time to close the books", value: "34 hours" },
        { label: "Reconciliation", value: "Automatic, every account" },
        { label: "Errors caught", value: "Before close — $920k flagged" },
      ],
    },
  },
  {
    id: "fleet",
    sector: "Rental group · Custom build",
    name: "Fleet & Reservations OS",
    line: "Twelve thousand vehicles tracked in a spreadsheet that was always a day old. Now the fleet is live, pricing moves itself, and an AI inspects every return from photos and drafts the claim.",
    before: {
      title: "the old way",
      mock: <BeforeSpreadsheet />,
      ledger: [
        { label: "Fleet you can see now", value: "Yesterday's spreadsheet" },
        { label: "Damage claims", value: "Days later, if at all" },
        { label: "Idle vehicles", value: "Nobody's counting" },
      ],
    },
    after: {
      url: "fleet.rental-group.internal",
      mock: (
        <Dash name="Fleet & Reservations OS" nav={["Fleet", "Bookings", "Pricing", "Returns", "Sites"]} kpis={[["Utilization", "91%", "up"], ["Available", "3,102", "flat"], ["Rev/vehicle", "$54", "up"], ["Idle days", "1.8", "down"]]}>
          <RentalFleet />
        </Dash>
      ),
      ledger: [
        { label: "Fleet you can see now", value: "12,480, live" },
        { label: "Damage claims", value: "Minutes — AI drafts them" },
        { label: "Idle vehicles", value: "Down to 1.8 days" },
      ],
    },
  },
];

/* ------------------------------- the process ------------------------------- */
const STEPS: Array<[string, string, string]> = [
  ["01", "Map the work", "We sit with the people doing it and trace every step, handoff, and workaround. The engagement begins as observation, not software."],
  ["02", "Find the waste", "The manual re-entry, the waiting, the double-booking. Where the business quietly pays a tax on human time — that becomes the spec."],
  ["03", "Build it live", "Working software from day one, inside your real workflow, reviewed in the real medium. We don't demo a mockup; we hand you the thing."],
  ["04", "Add the intelligence", "Voice agents, decision logic, anomaly detection — added only where they earn their place, never as a headline."],
  ["05", "Prove it", "Measured against the old way, in hours, not sprints. Anything slower or less reliable than the spreadsheet gets rebuilt until it holds."],
  ["06", "Run it", "It ships live and keeps improving against real use. Delivery is the beginning of the standard, not the end of it."],
];

function AutomatePage() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* ---------- hero ---------- */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 md:pt-44 md:pb-28">
        <Reveal>
          <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>
            Automate · The operating system for your business
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.045em] md:text-8xl" style={inter}>
            Before AI, the business
            <br />
            waited on a person.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#111111]/60 md:text-xl" style={inter}>
            A spreadsheet nobody trusted. A phone that had to be answered. A step that only Karen knew how to do.
            We replace the manual layer of a business with software that runs it — and prove it, side by side.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="#walkthroughs" className="rounded-full bg-[#1e6b3c] px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-[#111111]" style={mono}>
              See it, before and after ↓
            </a>
            <a href="/contact" className="rounded-full border border-[#111111]/20 px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-[#111111] uppercase transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]" style={mono}>
              Book a call
            </a>
          </div>
        </Reveal>
      </section>

      {/* ---------- the belief ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
              Every manual step is a tax.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-[#111111]/65" style={inter}>
              The old way wasn't slow because people were slow. It was slow because the work waited on them — to
              be free, to be awake, to remember. It broke quietly: a number keyed twice, a job booked over, a call
              that rang out at 9pm. And it never scaled past its busiest employee.
            </p>
            <p className="mt-5 border-l-2 border-[#1e6b3c] pl-5 text-lg leading-relaxed font-medium text-[#111111]/80" style={inter}>
              Automation isn't a tool the team uses. It's the layer the business runs on — so the work happens
              whether anyone is at their desk or not.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ---------- the before/after walkthroughs ---------- */}
      <section id="walkthroughs" className="scroll-mt-24 bg-white px-6 pt-24 pb-8 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The walkthroughs</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
              The old way, and what we built next to it.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
              Real systems, running live. Flip each one between the way it used to be done and the software that
              replaced it — the tabs are clickable; it's the actual interface.
            </p>
            <p className="mt-3 text-[11px] leading-relaxed tracking-[0.04em] text-[#111111]/40" style={mono}>
              Client names, data, and branding shown here have been changed or removed to protect privacy.
            </p>
          </Reveal>
        </div>
      </section>

      {VERTICALS.map((v, i) => (
        <section key={v.id} className={`px-6 py-16 md:py-20 ${i % 2 === 1 ? "bg-[#F5F5F3]" : "bg-white"}`}>
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <BeforeAfter v={v} />
            </Reveal>
          </div>
        </section>
      ))}

      {/* ---------- process ---------- */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>The ELSIAA process</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-5xl" style={inter}>
              Every automation runs the same road.
            </h2>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(([n, t, d], i) => (
              <Reveal key={n} delay={(i % 3) * 0.06}>
                <div className="border-t border-black/10 pt-5">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold tracking-[-0.02em]" style={inter}>{t}</h3>
                    <span className="text-[11px] tracking-[0.3em] text-[#1e6b3c]" style={mono}>{n}</span>
                  </div>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- capability catalog ---------- */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase" style={mono}>Everything the division ships</p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>
              From the first wireframe to the cloud it runs on.
            </h2>
          </Reveal>
          <div className="mt-9 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {AUTOSOFT.map((s, i) => (
              <Reveal key={`${s.name}-${i}`} delay={(i % 4) * 0.04}>
                <div className="h-full rounded-xl border border-black/[0.07] bg-white p-4">
                  <h3 className="text-[13.5px] font-semibold tracking-[-0.01em]" style={inter}>{s.name}</h3>
                  <ul className="mt-2.5 space-y-1">
                    {s.items.map((it) => (
                      <li key={it} className="text-[12px] leading-snug text-[#111111]/55" style={inter}>{it}</li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- final CTA ---------- */}
      <section className="bg-[#0c0c0c] px-6 py-24 text-white md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold tracking-[-0.045em] md:text-6xl" style={inter}>
              Show us the step that waits on a person.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-white/60" style={inter}>
              We'll build the system that does it instead — and show you the before and after before you commit a dollar.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <a href="/contact" className="rounded-full bg-[#2e9e58] px-10 py-5 text-[13px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-white hover:text-[#111111]" style={mono}>
                Book Free Strategy Call →
              </a>
              <a href="/quote" className="rounded-full border border-white/25 px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:border-white hover:bg-white hover:text-[#111111]" style={mono}>
                Get a Quote
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
