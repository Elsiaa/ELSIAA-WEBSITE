import { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

/*
  SoftwareDemos — the core-offering opener.
  A Before/After carousel: the fragmented reality most teams run on, then the
  custom software + AI systems ELSIAA builds to replace it — the operating
  layer for a business. Every "after" is a coded, pixel-crisp mock in the
  ELSIAA palette (no images, no iframes — crisp, legible, freeze-proof).
  Arrows + dots, autoplay paused on hover / interaction / off-screen.
*/

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const GREEN = "#1e6b3c";

/* ----------------------------- app chrome ----------------------------- */
function Chrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#1e6b3c]/50" />
        <span
          className="ml-3 truncate rounded-md bg-black/[0.04] px-3 py-1 text-[10px] tracking-[0.12em] text-[#111111]/45"
          style={mono}
        >
          {url}
        </span>
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">{children}</div>
    </div>
  );
}

/* a full dashboard: icon rail + header + KPI row + distinctive body */
function Dash({
  name,
  nav,
  active,
  kpis,
  children,
}: {
  name: string;
  nav: string[];
  active: number;
  kpis: Array<[string, string, "up" | "down" | "flat"]>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full text-[#111111]">
      {/* icon rail */}
      <div className="hidden w-12 flex-none flex-col items-center gap-4 border-r border-black/[0.06] bg-[#FBFBFA] py-4 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center">
          <span className="relative flex h-3.5 w-3.5 items-center justify-center">
            <span className="absolute inset-0 rotate-45 border border-[#111111]/80" />
            <span className="h-[3px] w-[3px] rotate-45 bg-[#1e6b3c]" />
          </span>
        </span>
        {nav.map((_, i) => (
          <span
            key={i}
            className={`h-5 w-5 rounded-md ${i === active ? "bg-[#1e6b3c]/15 ring-1 ring-[#1e6b3c]/40" : "bg-black/[0.05]"}`}
          />
        ))}
      </div>
      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[12px] font-semibold tracking-[-0.01em]" style={inter}>
              {name}
            </span>
            <span className="hidden text-[9px] tracking-[0.2em] text-[#111111]/35 uppercase md:inline" style={mono}>
              {nav[active]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden h-4 w-24 rounded bg-black/[0.05] md:block" />
            <span className="flex items-center gap-1.5 rounded-full bg-[#1e6b3c]/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" />
              <span className="text-[8px] tracking-[0.18em] text-[#1e6b3c] uppercase" style={mono}>
                Live
              </span>
            </span>
          </div>
        </div>
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-px border-b border-black/[0.06] bg-black/[0.05]">
          {kpis.map(([label, val, dir]) => (
            <div key={label} className="bg-white px-3 py-2.5">
              <p className="truncate text-[8px] tracking-[0.18em] text-[#111111]/40 uppercase" style={mono}>
                {label}
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-[15px] font-semibold tabular-nums tracking-[-0.02em]" style={inter}>
                {val}
                <span className={dir === "down" ? "text-[#b42318]" : "text-[#1e6b3c]"} style={{ fontSize: 9 }}>
                  {dir === "up" ? "▲" : dir === "down" ? "▼" : "—"}
                </span>
              </p>
            </div>
          ))}
        </div>
        {/* body */}
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

const bar = (w: string, cls = "bg-black/10", h = "h-1.5") => (
  <div className={`${h} ${w} rounded-full ${cls}`} />
);

function Pill({ tone, children }: { tone: "ok" | "warn" | "crit"; children: React.ReactNode }) {
  const map = {
    ok: "bg-[#1e6b3c]/10 text-[#1e6b3c]",
    warn: "bg-[#b7791f]/12 text-[#8a5a12]",
    crit: "bg-[#b42318]/10 text-[#b42318]",
  } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.12em] uppercase ${map[tone]}`} style={mono}>
      {children}
    </span>
  );
}

/* --------------------------- the "before" --------------------------- */
function MessyBefore() {
  return (
    <div className="relative h-full w-full bg-[#e9eaec] p-3">
      {/* cramped spreadsheet window */}
      <div className="absolute top-3 left-3 w-[62%] rotate-[-1.5deg] overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1">
          <span className="h-2 w-2 rounded-full bg-white/70" />
          <span className="text-[8px] font-semibold text-white" style={inter}>jobs_final_v7_USE THIS ONE.xlsx</span>
        </div>
        <div className="grid grid-cols-6">
          {Array.from({ length: 42 }).map((_, i) => (
            <div key={i} className={`h-3 border-r border-b border-black/[0.08] ${i % 6 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[7, 13, 19, 26].includes(i) ? "bg-[#fde68a]/60" : ""} ${[9, 22].includes(i) ? "bg-[#fecaca]/60" : ""}`} />
          ))}
        </div>
      </div>
      {/* paper form */}
      <div className="absolute top-6 right-4 w-[30%] rotate-[3deg] rounded-sm border border-black/15 bg-[#fffdf5] p-2 shadow-lg">
        <div className="mx-auto h-1.5 w-2/3 rounded bg-black/25" />
        <div className="mt-2 space-y-1.5">
          {["w-full", "w-full", "w-4/5", "w-full", "w-3/5"].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-[2px] border border-black/30" />
              {bar(w, "bg-black/15", "h-1")}
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-[7px] tracking-widest text-black/40" style={mono}>WORK ORDER · 3-PART</p>
      </div>
      {/* email thread */}
      <div className="absolute bottom-3 left-6 w-[46%] -rotate-1 overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="bg-[#f3f4f6] px-2 py-1 text-[8px] font-semibold text-black/60" style={inter}>Re: Re: Re: FWD: schedule?? (17)</div>
        <div className="space-y-1 p-2">
          {["w-full", "w-11/12", "w-3/4"].map((w, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-4 w-4 flex-none rounded-full bg-black/10" />
              {bar(w, "bg-black/12", "h-1.5")}
            </div>
          ))}
        </div>
      </div>
      {/* legacy tool */}
      <div className="absolute right-6 bottom-5 w-[34%] rotate-2 overflow-hidden rounded-sm border border-black/25 bg-[#0b2b2b] p-2 shadow-lg">
        <p className="text-[7px] leading-relaxed text-[#37d67a]" style={mono}>
          &gt; DISPATCH.EXE v3.1<br />
          &gt; F2=SCHEDULE F4=INVOICE<br />
          &gt; REC 1182 LOCKED BY: KAREN<br />
          &gt; _
        </p>
      </div>
      {/* sticky note */}
      <div className="absolute top-1/2 left-1/2 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[6deg] bg-[#fde68a] p-2 shadow-md">
        <p className="text-[8px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>
          call back the Delgado job — DON'T double book!!
        </p>
      </div>
    </div>
  );
}

/* --------------------------- hospital / clinic --------------------------- */
function HospitalBoard() {
  const rows = [
    ["4 · West", "Intake — triage", "ok", "Dr. Amir", "07:12"],
    ["4 · West", "Awaiting bed", "warn", "—", "00:48"],
    ["ICU · 2", "Post-op monitor", "ok", "Dr. Sood", "02:31"],
    ["ER · Bay 3", "Critical — hold", "crit", "Dr. Lee", "00:09"],
    ["3 · East", "Discharge ready", "ok", "Nurse Ola", "—"],
  ] as const;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2">
          <p className="text-[9px] tracking-[0.2em] text-[#111111]/45 uppercase" style={mono}>Live census · 214 beds</p>
          <div className="flex gap-1"><Pill tone="ok">Stable 186</Pill><Pill tone="warn">Watch 22</Pill><Pill tone="crit">Critical 6</Pill></div>
        </div>
        <div className="px-3">
          <div className="grid grid-cols-[1fr_1.4fr_auto_1fr_auto] gap-x-2 border-b border-black/[0.06] pb-1 text-[8px] tracking-[0.14em] text-[#111111]/35 uppercase" style={mono}>
            <span>Unit</span><span>Stage</span><span>Status</span><span>Clinician</span><span>Elapsed</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.4fr_auto_1fr_auto] items-center gap-x-2 border-b border-black/[0.04] py-[7px] text-[10px]" style={inter}>
              <span className="font-medium">{r[0]}</span>
              <span className="text-[#111111]/60">{r[1]}</span>
              <Pill tone={r[2] as "ok" | "warn" | "crit"}>{r[2] === "ok" ? "OK" : r[2] === "warn" ? "Wait" : "Now"}</Pill>
              <span className="text-[#111111]/60">{r[3]}</span>
              <span className="tabular-nums text-[#111111]/50" style={mono}>{r[4]}</span>
            </div>
          ))}
        </div>
      </div>
      {/* AI intake side */}
      <div className="hidden w-[38%] flex-none border-l border-black/[0.06] bg-[#FBFBFA] p-3 lg:block">
        <p className="text-[9px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>AI intake agent · call #2214</p>
        <div className="mt-2 space-y-2">
          <div className="rounded-lg bg-white p-2 shadow-sm">
            <p className="text-[9px] text-[#111111]/45" style={mono}>PATIENT</p>
            <p className="mt-0.5 text-[10px]" style={inter}>"...chest tightness since this morning, and I'm short of breath."</p>
          </div>
          <div className="rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2">
            <p className="text-[9px] tracking-[0.14em] text-[#1e6b3c] uppercase" style={mono}>Agent · triage</p>
            <p className="mt-0.5 text-[10px]" style={inter}>Flagged <b>urgent</b> · cardiac pathway · bed request sent to 4-West.</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {[3, 6, 4, 8, 5, 7, 3, 6, 9, 4, 6, 3].map((h, i) => (
            <span key={i} className="w-1 rounded-full bg-[#1e6b3c]/50" style={{ height: h * 2 }} />
          ))}
          <span className="ml-1 text-[8px] text-[#111111]/40" style={mono}>listening</span>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- automotive group --------------------------- */
function AutoInventory() {
  const cars = [
    ["EV Sedan", "Rooftop 12 · Austin", "In stock", "ok", "$—"],
    ["Crossover", "In transit · 2d", "warn", "warn", "reserved"],
    ["Pickup", "Service bay 4", "ok", "ok", "warranty"],
    ["Coupe", "Aging 74d", "crit", "crit", "markdown"],
  ] as const;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.2em] text-[#111111]/45 uppercase" style={mono}>Inventory · 42 rooftops</p>
          <Pill tone="ok">8,412 units synced</Pill>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {cars.map((c, i) => (
            <div key={i} className="rounded-lg border border-black/[0.07] p-2">
              <div className="flex h-10 items-center justify-center rounded bg-[#f3f4f6]">
                <div className="h-4 w-14 rounded-t-[10px] rounded-b-[3px] bg-[#111111]/70" />
              </div>
              <p className="mt-1.5 text-[10px] font-medium" style={inter}>{c[0]}</p>
              <p className="text-[8.5px] text-[#111111]/50" style={mono}>{c[1]}</p>
              <div className="mt-1"><Pill tone={c[3] as "ok" | "warn" | "crit"}>{c[4]}</Pill></div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden w-[36%] flex-none border-l border-black/[0.06] bg-[#FBFBFA] p-3 lg:block">
        <p className="text-[9px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>AI pricing engine</p>
        <div className="mt-2 rounded-lg bg-white p-2 shadow-sm">
          <p className="text-[10px]" style={inter}>Coupe · 74 days aging</p>
          <p className="mt-1 text-[9px] text-[#111111]/55" style={inter}>Recommend <b className="text-[#1e6b3c]">−$1,450</b> to clear in 8 days. Regional demand softening.</p>
          <button className="mt-2 w-full rounded-md bg-[#1e6b3c] py-1 text-[9px] font-bold tracking-[0.15em] text-white uppercase" style={mono}>Approve</button>
        </div>
        <div className="mt-3 space-y-1.5">
          <p className="text-[9px] tracking-[0.14em] text-[#111111]/40 uppercase" style={mono}>Leads → showroom</p>
          {["Financing pre-qual", "Trade-in valued", "Test drive booked"].map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
              <span className="text-[9.5px] text-[#111111]/65" style={inter}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- rental agency --------------------------- */
function RentalFleet() {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <p className="text-[9px] tracking-[0.2em] text-[#111111]/45 uppercase" style={mono}>Fleet board · 12,480 vehicles</p>
        <div className="flex gap-1"><Pill tone="ok">Available 3,102</Pill><Pill tone="warn">Cleaning 288</Pill><Pill tone="crit">Damage AI 14</Pill></div>
      </div>
      {/* gantt-style reservation grid */}
      <div className="mt-2 flex-1">
        {["Compact · A-fleet", "SUV · premium", "Van · commercial", "EV · airport"].map((label, r) => (
          <div key={r} className="grid grid-cols-[1.1fr_3fr] items-center gap-2 border-b border-black/[0.05] py-2">
            <span className="truncate text-[9.5px] text-[#111111]/70" style={inter}>{label}</span>
            <div className="relative h-4 rounded bg-black/[0.04]">
              {[[4, 22], [30, 26], [60, 14], [78, 18]].map(([l, w], i) => (
                <span
                  key={i}
                  className={`absolute top-0 h-4 rounded ${(r + i) % 4 === 3 ? "bg-[#b7791f]/70" : "bg-[#1e6b3c]/70"}`}
                  style={{ left: `${l}%`, width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2">
        <p className="text-[9px] tracking-[0.14em] text-[#1e6b3c] uppercase" style={mono}>AI return inspection</p>
        <p className="mt-0.5 text-[10px]" style={inter}>Unit EV-2231 · <b>2 new dents</b> detected from 6 photos · claim drafted, $840 estimated.</p>
      </div>
    </div>
  );
}

/* --------------------------- field / dispatch --------------------------- */
function FieldDispatch() {
  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-hidden bg-[#eef1f0]">
        {/* faux map */}
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(#00000010 1px,transparent 1px),linear-gradient(90deg,#00000010 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 200" preserveAspectRatio="none">
          <path d="M20 160 C 80 120, 120 150, 180 90 S 260 40, 285 55" fill="none" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
        </svg>
        {[[40, 150, "ok"], [150, 110, "warn"], [230, 60, "ok"], [90, 70, "crit"]].map(([x, y, t], i) => (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x as number) / 3}%`, top: `${(y as number) / 2}%` }}>
            <span className={`block h-3 w-3 rounded-full ring-2 ring-white ${t === "ok" ? "bg-[#1e6b3c]" : t === "warn" ? "bg-[#b7791f]" : "bg-[#b42318]"}`} />
          </span>
        ))}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[8px] tracking-[0.14em] text-[#111111]/55 uppercase backdrop-blur" style={mono}>18 techs · live</div>
      </div>
      <div className="w-[42%] flex-none border-l border-black/[0.06] p-3">
        <p className="text-[9px] tracking-[0.2em] text-[#111111]/45 uppercase" style={mono}>Dispatch queue</p>
        {[["Delgado · burst pipe", "crit", "assigned · 6m"], ["Okafor · water heater", "warn", "en route"], ["Kim · inspection", "ok", "scheduled"]].map((j, i) => (
          <div key={i} className="mt-2 rounded-lg border border-black/[0.07] p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium" style={inter}>{j[0]}</span>
              <Pill tone={j[1] as "ok" | "warn" | "crit"}>{j[1] === "crit" ? "Now" : j[1] === "warn" ? "Soon" : "Set"}</Pill>
            </div>
            <p className="mt-0.5 text-[8.5px] text-[#111111]/50" style={mono}>{j[2]}</p>
          </div>
        ))}
        <div className="mt-2 rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2">
          <p className="text-[9px] tracking-[0.14em] text-[#1e6b3c] uppercase" style={mono}>Voice agent</p>
          <p className="mt-0.5 text-[9.5px]" style={inter}>Booked the Delgado emergency, matched the nearest tech, and texted the ETA — no dispatcher.</p>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- finance ops --------------------------- */
function FinanceClose() {
  const rows = [
    ["Bank · Operating", "$4,182,904", "Matched", "ok"],
    ["AP · Vendors", "$1,004,220", "3 exceptions", "warn"],
    ["Intercompany", "$0", "Balanced", "ok"],
    ["Revenue · deferred", "$2,910,540", "Anomaly flagged", "crit"],
    ["Payroll accrual", "$688,110", "Matched", "ok"],
  ] as const;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.2em] text-[#111111]/45 uppercase" style={mono}>Close · Day 2 of 2</p>
          <Pill tone="ok">92% reconciled</Pill>
        </div>
        <div className="mt-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-2 border-b border-black/[0.04] py-[7px] text-[10px]" style={inter}>
              <span className="truncate font-medium">{r[0]}</span>
              <span className="tabular-nums text-[#111111]/60" style={mono}>{r[1]}</span>
              <Pill tone={r[3] as "ok" | "warn" | "crit"}>{r[2]}</Pill>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden w-[38%] flex-none border-l border-black/[0.06] bg-[#FBFBFA] p-3 lg:block">
        <p className="text-[9px] tracking-[0.2em] text-[#1e6b3c] uppercase" style={mono}>Anomaly · AI</p>
        <div className="mt-2 rounded-lg bg-white p-2 shadow-sm">
          <p className="text-[10px]" style={inter}>Deferred revenue · Contract #8841</p>
          <p className="mt-1 text-[9px] text-[#111111]/55" style={inter}>Recognition schedule off by <b className="text-[#b42318]">$41,200</b> vs. contract terms. Draft correcting entry ready.</p>
          <button className="mt-2 w-full rounded-md border border-[#111111]/20 py-1 text-[9px] font-bold tracking-[0.15em] uppercase" style={mono}>Review entry</button>
        </div>
        <p className="mt-3 text-[9px] tracking-[0.14em] text-[#111111]/40 uppercase" style={mono}>Audit trail</p>
        <div className="mt-1.5 space-y-1">{["Every entry sourced", "Approvals timestamped", "SOX-ready export"].map((t, i) => (
          <div key={i} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" /><span className="text-[9.5px] text-[#111111]/65" style={inter}>{t}</span></div>
        ))}</div>
      </div>
    </div>
  );
}

/* ------------------------------- slides ------------------------------- */
type Slide = {
  kind: "before" | "after";
  eyebrow: string;
  name: string;
  pitch: string;
  points?: string[];
  metrics?: string[];
  cost?: string; // the "before" hidden-cost line
  cta?: { label: string; href: string; external?: boolean };
  url: string;
  mock: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    kind: "before",
    eyebrow: "Before · The reality",
    name: "What most teams still run on.",
    pitch:
      "A spreadsheet nobody trusts, a paper form, a thread seventeen replies deep, and a legacy tool one person knows how to use. The work happens in the gaps between them.",
    cost: "The hidden cost: double-booked jobs, numbers that never reconcile, and a business that can't move faster than its busiest employee.",
    url: "the-way-it-was.xlsx",
    mock: <MessyBefore />,
  },
  {
    kind: "after",
    eyebrow: "Health system · Custom build",
    name: "Patient Flow OS",
    pitch: "Every bed, intake, and clinician on one live board — with an AI agent that answers the call, triages, and requests the bed before a human picks up.",
    metrics: ["−31% average intake time", "$2.4M/yr recovered capacity", "9 sites, one board"],
    cta: { label: "Request a walkthrough", href: "/contact" },
    url: "flow.health-system.internal",
    mock: <Dash name="Patient Flow OS" nav={["Census", "Intake", "Beds", "Staff", "Reports"]} active={0} kpis={[["Occupancy", "87%", "up"], ["Avg intake", "14m", "down"], ["ER wait", "22m", "down"], ["Discharges", "41", "up"]]}><HospitalBoard /></Dash>,
  },
  {
    kind: "after",
    eyebrow: "Automotive group · Custom build",
    name: "Dealership & Fleet OS",
    pitch: "Forty-two rooftops on one inventory, one lead pipeline, and an AI pricing engine that clears aging stock before it costs you — decisions, not dashboards.",
    metrics: ["$4.1M saved in year one", "42 rooftops unified", "−68% manual entry"],
    cta: { label: "Request a walkthrough", href: "/contact" },
    url: "ops.auto-group.internal",
    mock: <Dash name="Dealership & Fleet OS" nav={["Inventory", "Leads", "Service", "Pricing", "Fleet"]} active={0} kpis={[["Units", "8,412", "flat"], ["Avg age", "38d", "down"], ["Gross/unit", "$3,240", "up"], ["Lead → sale", "18%", "up"]]}><AutoInventory /></Dash>,
  },
  {
    kind: "after",
    eyebrow: "Rental group · Custom build",
    name: "Fleet & Reservations OS",
    pitch: "Twelve thousand vehicles, live: availability, dynamic pricing, and an AI that inspects every return from photos and drafts the damage claim itself.",
    metrics: ["+$1.8M ancillary revenue", "12,480 vehicles tracked", "99.2% utilization visibility"],
    cta: { label: "Request a walkthrough", href: "/contact" },
    url: "fleet.rental-group.internal",
    mock: <Dash name="Fleet & Reservations OS" nav={["Fleet", "Bookings", "Pricing", "Returns", "Sites"]} active={0} kpis={[["Utilization", "91%", "up"], ["Available", "3,102", "flat"], ["Rev/vehicle", "$54", "up"], ["Idle days", "1.8", "down"]]}><RentalFleet /></Dash>,
  },
  {
    kind: "after",
    eyebrow: "Field service · Live demo",
    name: "Dispatch OS",
    pitch: "A plumbing business run end to end — the map, the queue, the technician's day — with a voice agent that books the emergency and routes the nearest tech, no dispatcher.",
    metrics: ["14 form fields → one tap", "Voice agent you can call", "Office board, live"],
    cta: { label: "Open the live demo", href: "https://plumbing.demo.elsiaa.com", external: true },
    url: "dispatch.plumbingco.live",
    mock: <Dash name="Dispatch OS" nav={["Map", "Queue", "Techs", "Invoices", "Voice"]} active={0} kpis={[["Techs live", "18", "flat"], ["Jobs today", "63", "up"], ["Avg ETA", "26m", "down"], ["First-fix", "94%", "up"]]}><FieldDispatch /></Dash>,
  },
  {
    kind: "after",
    eyebrow: "Finance operations · Custom build",
    name: "Close & Reconciliation OS",
    pitch: "The month-end close, compressed: every account reconciled automatically, every anomaly flagged with a correcting entry drafted, every step audit-ready.",
    metrics: ["6-day close → 34 hours", "$920k leakage caught", "SOX-ready by construction"],
    cta: { label: "Request a walkthrough", href: "/contact" },
    url: "close.finance-ops.internal",
    mock: <Dash name="Close & Reconciliation OS" nav={["Close", "Recs", "Anomalies", "Journal", "Audit"]} active={0} kpis={[["Reconciled", "92%", "up"], ["Exceptions", "3", "down"], ["Days to close", "1.4", "down"], ["Caught", "$920k", "up"]]}><FinanceClose /></Dash>,
  },
];

export function SoftwareDemos() {
  const [idx, setIdx] = useState(0);
  const [inView, setInView] = useState(true);
  const paused = useRef(false);
  const interacted = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const s = SLIDES[idx];

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => {
      if (!paused.current && !interacted.current && inView) setIdx((i) => (i + 1) % SLIDES.length);
    }, 8000);
    return () => clearInterval(t);
  }, [inView]);

  const go = (d: number) => {
    interacted.current = true;
    setIdx((i) => (i + d + SLIDES.length) % SLIDES.length);
  };

  return (
    <section
      ref={sectionRef}
      id="automate"
      className="scroll-mt-24 border-b border-black/[0.06] bg-white pt-28 pb-12 md:pt-32 md:pb-16"
      aria-label="Automation & Software — the operating system for your business"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onTouchStart={() => (paused.current = true)}
      onTouchEnd={() => (paused.current = false)}
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-3xl">
              <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
                01 · Division · Automation & Software
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-[#111111] md:text-4xl" style={inter}>
                Don't take our word for it. Walk through what we actually ship.
              </h2>
              <p className="mt-3 text-[15px] text-[#111111]/60" style={inter}>
                Custom software and AI systems built to run a business — not sit beside it.
              </p>
              <p className="mt-3 text-[11px] leading-relaxed tracking-[0.04em] text-[#111111]/40" style={mono}>
                Client names, data, and branding shown here have been changed or removed to protect privacy.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button aria-label="Previous" onClick={() => go(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white">←</button>
              <button aria-label="Next" onClick={() => go(1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-[#111111] transition-all hover:border-[#1e6b3c] hover:bg-[#1e6b3c] hover:text-white">→</button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-7 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,360px)_1fr] md:gap-8">
            {/* copy rail */}
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] uppercase ${s.kind === "before" ? "bg-[#111111] text-white" : "bg-[#1e6b3c]/12 text-[#1e6b3c]"}`} style={mono}>
                  {s.kind === "before" ? "Before" : "After"}
                </span>
                <p className="text-[10px] tracking-[0.24em] text-[#111111]/40 uppercase" style={mono}>{s.eyebrow}</p>
              </div>
              <h3 className="mt-2.5 text-xl font-semibold tracking-[-0.02em] text-[#111111]" style={inter}>{s.name}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{s.pitch}</p>

              {s.cost && (
                <p className="mt-4 border-l-2 border-[#111111]/20 pl-3 text-[13px] leading-relaxed text-[#111111]/55" style={inter}>{s.cost}</p>
              )}

              {s.metrics && (
                <div className="mt-5 space-y-2">
                  {s.metrics.map((m) => (
                    <div key={m} className="flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#1e6b3c]" />
                      <span className="text-[13px] font-medium text-[#111111]" style={inter}>{m}</span>
                    </div>
                  ))}
                </div>
              )}

              {s.cta && (
                <a href={s.cta.href} {...(s.cta.external ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-6 inline-block text-[11px] tracking-[0.24em] text-[#1e6b3c] uppercase hover:underline" style={mono}>
                  {s.cta.label} ↗
                </a>
              )}

              {/* dots */}
              <div className="mt-6 flex items-center gap-2" role="tablist" aria-label="Demos">
                {SLIDES.map((d, i) => (
                  <button
                    key={d.name}
                    role="tab"
                    aria-selected={i === idx}
                    aria-label={`Show ${d.name}`}
                    onClick={() => { interacted.current = true; setIdx(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-[#1e6b3c]" : "w-3 bg-black/15 hover:bg-black/30"}`}
                  />
                ))}
              </div>
            </div>

            {/* the mock */}
            <div className="order-1 md:order-2">
              <Chrome url={s.url}>
                {SLIDES.map((d, i) => (
                  <div key={d.name} className={`absolute inset-0 transition-opacity duration-500 ${i === idx ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0"}`}>
                    {d.mock}
                  </div>
                ))}
              </Chrome>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
