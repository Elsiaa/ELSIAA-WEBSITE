import { useState } from "react";

/*
  Shared automation mock library — the live "after" software (coded, pixel-crisp
  ELSIAA dashboards) and the manual "before" each replaced. Plus BeforeAfter, an
  interactive toggle that puts the old way and the built system side by side and
  swaps the cost ledger between them.
*/

export const mono = { fontFamily: "var(--font-sans)" } as const;
export const inter = { fontFamily: "var(--font-sans)" } as const;
const GREEN = "#1e6b3c";

export function Pill({ tone, children }: { tone: "ok" | "warn" | "crit"; children: React.ReactNode }) {
  const map = { ok: "bg-[#1e6b3c]/10 text-[#1e6b3c]", warn: "bg-[#b7791f]/12 text-[#8a5a12]", crit: "bg-[#b42318]/10 text-[#b42318]" } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.12em]  ${map[tone]}`} style={mono}>{children}</span>;
}
const bar = (w: string, cls = "bg-black/10", h = "h-1.5") => <div className={`${h} ${w} rounded-full ${cls}`} />;

export function Chrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
      <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" /><span className="h-2.5 w-2.5 rounded-full bg-black/10" /><span className="h-2.5 w-2.5 rounded-full bg-[#1e6b3c]/50" />
        <span className="ml-3 truncate rounded-md bg-black/[0.04] px-3 py-1 text-[13px] tracking-[0.12em] text-[#111111]/45" style={mono}>{url}</span>
      </div>
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">{children}</div>
    </div>
  );
}

/* interactive dashboard — clickable nav tabs highlight, header label follows */
export function Dash({ name, nav, kpis, children }: { name: string; nav: string[]; kpis: Array<[string, string, "up" | "down" | "flat"]>; children: React.ReactNode }) {
  const [active, setActive] = useState(0);
  return (
    <div className="flex h-full w-full text-[#111111]">
      <div className="hidden w-12 flex-none flex-col items-center gap-4 border-r border-black/[0.06] bg-[#FBFBFA] py-4 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center">
          <span className="relative flex h-3.5 w-3.5 items-center justify-center"><span className="absolute inset-0 rotate-45 border border-[#111111]/80" /><span className="h-[3px] w-[3px] rotate-45 bg-[#1e6b3c]" /></span>
        </span>
        {nav.map((label, i) => (
          <button key={label} aria-label={label} onClick={() => setActive(i)} className={`h-5 w-5 rounded-md transition-all ${i === active ? "bg-[#1e6b3c]/15 ring-1 ring-[#1e6b3c]/40" : "bg-black/[0.05] hover:bg-black/10"}`} />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-2.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[13px] font-semibold tracking-[-0.01em]" style={inter}>{name}</span>
            <span className="hidden text-[13px] text-[#111111]/35  md:inline" style={mono}>{nav[active]}</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#1e6b3c]/10 px-2 py-0.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" /><span className="text-[13px] text-[#1e6b3c] " style={mono}>Live</span>
          </span>
        </div>
        <div className="grid grid-cols-4 gap-px border-b border-black/[0.06] bg-black/[0.05]">
          {kpis.map(([label, val, dir]) => (
            <div key={label} className="bg-white px-3 py-2.5">
              <p className="truncate text-[13px] text-[#111111]/40 " style={mono}>{label}</p>
              <p className="mt-1 flex items-baseline gap-1 text-[15px] font-semibold tabular-nums tracking-[-0.02em]" style={inter}>{val}<span className={dir === "down" ? "text-[#b42318]" : "text-[#1e6b3c]"} style={{ fontSize: 9 }}>{dir === "up" ? "▲" : dir === "down" ? "▼" : "—"}</span></p>
            </div>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

/* =========================== AFTER bodies =========================== */
export function HospitalBoard() {
  const rows = [["4 · West", "Intake — triage", "ok", "Dr. Amir", "07:12"], ["4 · West", "Awaiting bed", "warn", "—", "00:48"], ["ICU · 2", "Post-op monitor", "ok", "Dr. Sood", "02:31"], ["ER · Bay 3", "Critical — hold", "crit", "Dr. Lee", "00:09"], ["3 · East", "Discharge ready", "ok", "Nurse Ola", "—"]] as const;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2"><p className="text-[13px] text-[#111111]/45 " style={mono}>Live census · 214 beds</p><div className="flex gap-1"><Pill tone="ok">Stable 186</Pill><Pill tone="warn">Watch 22</Pill><Pill tone="crit">Critical 6</Pill></div></div>
        <div className="px-3">
          <div className="grid grid-cols-[1fr_1.4fr_auto_1fr_auto] gap-x-2 border-b border-black/[0.06] pb-1 text-[13px] text-[#111111]/35 " style={mono}><span>Unit</span><span>Stage</span><span>Status</span><span>Clinician</span><span>Elapsed</span></div>
          {rows.map((r, i) => (<div key={i} className="grid grid-cols-[1fr_1.4fr_auto_1fr_auto] items-center gap-x-2 border-b border-black/[0.04] py-[7px] text-[13px]" style={inter}><span className="font-medium">{r[0]}</span><span className="text-[#111111]/60">{r[1]}</span><Pill tone={r[2] as "ok" | "warn" | "crit"}>{r[2] === "ok" ? "OK" : r[2] === "warn" ? "Wait" : "Now"}</Pill><span className="text-[#111111]/60">{r[3]}</span><span className="tabular-nums text-[#111111]/50" style={mono}>{r[4]}</span></div>))}
        </div>
      </div>
      <div className="hidden w-[38%] flex-none border-l border-black/[0.06] bg-[#FBFBFA] p-3 lg:block">
        <p className="text-[13px] text-[#1e6b3c] " style={mono}>AI intake agent · call #2214</p>
        <div className="mt-2 space-y-2"><div className="rounded-lg bg-white p-2 shadow-sm"><p className="text-[13px] text-[#111111]/45" style={mono}>PATIENT</p><p className="mt-0.5 text-[13px]" style={inter}>"...chest tightness since this morning, and I'm short of breath."</p></div><div className="rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2"><p className="text-[13px] text-[#1e6b3c] " style={mono}>Agent · triage</p><p className="mt-0.5 text-[13px]" style={inter}>Flagged <b>urgent</b> · cardiac pathway · bed request sent to 4-West.</p></div></div>
        <div className="mt-3 flex items-center gap-1.5">{[3, 6, 4, 8, 5, 7, 3, 6, 9, 4, 6, 3].map((h, i) => (<span key={i} className="w-1 rounded-full bg-[#1e6b3c]/50" style={{ height: h * 2 }} />))}<span className="ml-1 text-[13px] text-[#111111]/40" style={mono}>listening</span></div>
      </div>
    </div>
  );
}

export function FieldDispatch() {
  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-hidden bg-[#eef1f0]">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(#00000010 1px,transparent 1px),linear-gradient(90deg,#00000010 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 200" preserveAspectRatio="none"><path d="M20 160 C 80 120, 120 150, 180 90 S 260 40, 285 55" fill="none" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" /></svg>
        {[[40, 150, "ok"], [150, 110, "warn"], [230, 60, "ok"], [90, 70, "crit"]].map(([x, y, t], i) => (<span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${(x as number) / 3}%`, top: `${(y as number) / 2}%` }}><span className={`block h-3 w-3 rounded-full ring-2 ring-white ${t === "ok" ? "bg-[#1e6b3c]" : t === "warn" ? "bg-[#b7791f]" : "bg-[#b42318]"}`} /></span>))}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[13px] text-[#111111]/55  backdrop-blur" style={mono}>18 techs · live</div>
      </div>
      <div className="w-[42%] flex-none border-l border-black/[0.06] p-3">
        <p className="text-[13px] text-[#111111]/45 " style={mono}>Dispatch queue</p>
        {[["Delgado · burst pipe", "crit", "assigned · 6m"], ["Okafor · water heater", "warn", "en route"], ["Kim · inspection", "ok", "scheduled"]].map((j, i) => (<div key={i} className="mt-2 rounded-lg border border-black/[0.07] p-2"><div className="flex items-center justify-between"><span className="text-[13px] font-medium" style={inter}>{j[0]}</span><Pill tone={j[1] as "ok" | "warn" | "crit"}>{j[1] === "crit" ? "Now" : j[1] === "warn" ? "Soon" : "Set"}</Pill></div><p className="mt-0.5 text-[8.5px] text-[#111111]/50" style={mono}>{j[2]}</p></div>))}
        <div className="mt-2 rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2"><p className="text-[13px] text-[#1e6b3c] " style={mono}>Voice agent</p><p className="mt-0.5 text-[9.5px]" style={inter}>Booked the Delgado emergency, matched the nearest tech, and texted the ETA — no dispatcher.</p></div>
      </div>
    </div>
  );
}

export function FinanceClose() {
  const rows = [["Bank · Operating", "$4,182,904", "Matched", "ok"], ["AP · Vendors", "$1,004,220", "3 exceptions", "warn"], ["Intercompany", "$0", "Balanced", "ok"], ["Revenue · deferred", "$2,910,540", "Anomaly flagged", "crit"], ["Payroll accrual", "$688,110", "Matched", "ok"]] as const;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 p-3">
        <div className="flex items-center justify-between"><p className="text-[13px] text-[#111111]/45 " style={mono}>Close · Day 2 of 2</p><Pill tone="ok">92% reconciled</Pill></div>
        <div className="mt-2">{rows.map((r, i) => (<div key={i} className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-2 border-b border-black/[0.04] py-[7px] text-[13px]" style={inter}><span className="truncate font-medium">{r[0]}</span><span className="tabular-nums text-[#111111]/60" style={mono}>{r[1]}</span><Pill tone={r[3] as "ok" | "warn" | "crit"}>{r[2]}</Pill></div>))}</div>
      </div>
      <div className="hidden w-[38%] flex-none border-l border-black/[0.06] bg-[#FBFBFA] p-3 lg:block">
        <p className="text-[13px] text-[#1e6b3c] " style={mono}>Anomaly · AI</p>
        <div className="mt-2 rounded-lg bg-white p-2 shadow-sm"><p className="text-[13px]" style={inter}>Deferred revenue · Contract #8841</p><p className="mt-1 text-[13px] text-[#111111]/55" style={inter}>Recognition schedule off by <b className="text-[#b42318]">$41,200</b> vs. contract terms. Draft correcting entry ready.</p><button className="mt-2 w-full rounded-md border border-[#111111]/20 py-1 text-[13px] font-bold " style={mono}>Review entry</button></div>
        <p className="mt-3 text-[13px] text-[#111111]/40 " style={mono}>Audit trail</p>
        <div className="mt-1.5 space-y-1">{["Every entry sourced", "Approvals timestamped", "SOX-ready export"].map((t, i) => (<div key={i} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" /><span className="text-[9.5px] text-[#111111]/65" style={inter}>{t}</span></div>))}</div>
      </div>
    </div>
  );
}

export function RentalFleet() {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between"><p className="text-[13px] text-[#111111]/45 " style={mono}>Fleet board · 12,480 vehicles</p><div className="flex gap-1"><Pill tone="ok">Available 3,102</Pill><Pill tone="warn">Cleaning 288</Pill><Pill tone="crit">Damage AI 14</Pill></div></div>
      <div className="mt-2 flex-1">{["Compact · A-fleet", "SUV · premium", "Van · commercial", "EV · airport"].map((label, r) => (<div key={r} className="grid grid-cols-[1.1fr_3fr] items-center gap-2 border-b border-black/[0.05] py-2"><span className="truncate text-[9.5px] text-[#111111]/70" style={inter}>{label}</span><div className="relative h-4 rounded bg-black/[0.04]">{[[4, 22], [30, 26], [60, 14], [78, 18]].map(([l, w], i) => (<span key={i} className={`absolute top-0 h-4 rounded ${(r + i) % 4 === 3 ? "bg-[#b7791f]/70" : "bg-[#1e6b3c]/70"}`} style={{ left: `${l}%`, width: `${w}%` }} />))}</div></div>))}</div>
      <div className="rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2"><p className="text-[13px] text-[#1e6b3c] " style={mono}>AI return inspection</p><p className="mt-0.5 text-[13px]" style={inter}>Unit EV-2231 · <b>2 new dents</b> detected from 6 photos · claim drafted, $840 estimated.</p></div>
    </div>
  );
}

/* =========================== BEFORE bodies (the manual way) =========================== */
export function BeforeField() {
  return (
    <div className="relative h-full w-full bg-[#e9eaec] p-3">
      <div className="absolute top-3 left-3 w-[62%] rotate-[-1.5deg] overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1"><span className="h-2 w-2 rounded-full bg-white/70" /><span className="text-[13px] font-semibold text-white" style={inter}>jobs_final_v7_USE THIS ONE.xlsx</span></div>
        <div className="grid grid-cols-6">{Array.from({ length: 42 }).map((_, i) => (<div key={i} className={`h-3 border-r border-b border-black/[0.08] ${i % 6 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[7, 13, 19, 26].includes(i) ? "bg-[#fde68a]/60" : ""} ${[9, 22].includes(i) ? "bg-[#fecaca]/60" : ""}`} />))}</div>
      </div>
      <div className="absolute top-6 right-4 w-[30%] rotate-[3deg] rounded-sm border border-black/15 bg-[#fffdf5] p-2 shadow-lg"><div className="mx-auto h-1.5 w-2/3 rounded bg-black/25" /><div className="mt-2 space-y-1.5">{["w-full", "w-full", "w-4/5", "w-full", "w-3/5"].map((w, i) => (<div key={i} className="flex items-center gap-1"><span className="h-2 w-2 rounded-[2px] border border-black/30" />{bar(w, "bg-black/15", "h-1")}</div>))}</div><p className="mt-2 text-center text-[7px] tracking-widest text-black/40" style={mono}>WORK ORDER · 3-PART</p></div>
      <div className="absolute bottom-3 left-6 w-[46%] -rotate-1 overflow-hidden rounded-md border border-black/15 bg-white shadow-lg"><div className="bg-[#f3f4f6] px-2 py-1 text-[13px] font-semibold text-black/60" style={inter}>Re: Re: Re: FWD: schedule?? (17)</div><div className="space-y-1 p-2">{["w-full", "w-11/12", "w-3/4"].map((w, i) => (<div key={i} className="flex items-center gap-1.5"><span className="h-4 w-4 flex-none rounded-full bg-black/10" />{bar(w, "bg-black/12", "h-1.5")}</div>))}</div></div>
      <div className="absolute right-6 bottom-5 w-[34%] rotate-2 overflow-hidden rounded-sm border border-black/25 bg-[#0b2b2b] p-2 shadow-lg"><p className="text-[7px] leading-relaxed text-[#37d67a]" style={mono}>&gt; DISPATCH.EXE v3.1<br />&gt; F2=SCHEDULE F4=INVOICE<br />&gt; REC 1182 LOCKED BY: KAREN<br />&gt; _</p></div>
      <div className="absolute top-1/2 left-1/2 w-24 -translate-x-1/2 -translate-y-1/2 rotate-[6deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>call back the Delgado job — DON'T double book!!</p></div>
    </div>
  );
}

export function BeforeWhiteboard() {
  const scrawl = { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" } as const;
  return (
    <div className="relative h-full w-full bg-[#eef0ef] p-3">
      {/* dry-erase bed board */}
      <div className="absolute inset-3 rounded-md border-2 border-[#c9cdcb] bg-white shadow-inner">
        <div className="flex items-center justify-between border-b-2 border-[#e2e5e3] px-3 py-1.5"><span className="text-[13px] font-bold tracking-wide text-[#1f3a5f]" style={scrawl}>BED BOARD — 4 WEST</span><span className="text-[13px] text-[#b42318]" style={scrawl}>?? = who knows</span></div>
        <div className="grid grid-cols-3 gap-px bg-[#e2e5e3]">
          {[["401", "Amir?", "#1f3a5f"], ["402", "DISCH?", "#b42318"], ["403", "—", "#8a5a12"], ["404", "ICU xfer", "#1f3a5f"], ["405", "clean??", "#b42318"], ["406", "Lee - hold", "#111"]].map(([bed, note, c], i) => (
            <div key={i} className="bg-white px-2 py-2"><p className="text-[13px] font-bold text-[#111111]/70" style={mono}>{bed}</p><p className="mt-0.5 text-[13px] leading-none" style={{ ...scrawl, color: c as string }}>{note}</p></div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2"><span className="text-[13px] text-black/50" style={scrawl}>erase + rewrite every shift · phone for the rest</span></div>
      </div>
      {/* phone-tree sticky + fax */}
      <div className="absolute top-6 right-6 w-24 rotate-[5deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={scrawl}>intake line ringing — page Dr. on call?? ext 4021</p></div>
      <div className="absolute bottom-4 left-8 w-28 -rotate-2 rounded-sm border border-black/15 bg-[#fffdf5] p-1.5 shadow"><p className="text-center text-[7px] tracking-widest text-black/40" style={mono}>FAX — INTAKE FORM<br />pg 1 of 3</p></div>
    </div>
  );
}

export function BeforeSpreadsheet() {
  return (
    <div className="relative h-full w-full bg-[#e9eaec] p-3">
      {/* the mega spreadsheet */}
      <div className="absolute inset-x-3 top-3 h-[64%] overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1"><span className="h-2 w-2 rounded-full bg-white/70" /><span className="text-[13px] font-semibold text-white" style={inter}>CLOSE_Q3_final_FINAL_v12 (Rana's copy).xlsx</span></div>
        <div className="grid grid-cols-8">{Array.from({ length: 96 }).map((_, i) => (<div key={i} className={`h-3 border-r border-b border-black/[0.07] ${i % 8 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[11, 27, 43].includes(i) ? "bg-[#fecaca]/70" : ""} ${[18, 34, 52, 61].includes(i) ? "bg-[#fde68a]/60" : ""}`} />))}</div>
      </div>
      {/* calculator */}
      <div className="absolute bottom-4 left-6 w-20 rotate-[-3deg] rounded-md border border-black/20 bg-[#1a1a1a] p-1.5 shadow-lg"><div className="mb-1 h-3 rounded-sm bg-[#9fd8a6] px-1 text-right text-[7px] leading-3 text-black/70" style={mono}>41,200</div><div className="grid grid-cols-4 gap-0.5">{Array.from({ length: 12 }).map((_, i) => (<span key={i} className="h-2 rounded-[1px] bg-white/25" />))}</div></div>
      {/* sticky + printout */}
      <div className="absolute right-6 bottom-6 w-24 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>doesn't tie out by $41k — DO NOT SEND yet</p></div>
      <div className="absolute right-28 bottom-4 w-20 -rotate-2 rounded-sm border border-black/15 bg-white p-1.5 shadow"><div className="space-y-1">{["w-full", "w-4/5", "w-full", "w-3/5"].map((w, i) => bar(w, "bg-black/12", "h-1"))}</div><p className="mt-1 text-center text-[6.5px] tracking-widest text-black/40" style={mono}>RECON — PRINTED</p></div>
    </div>
  );
}

/* =========================== interactive Before / After =========================== */
export type Ledger = { label: string; value: string }[];
export type Vertical = {
  id: string;
  sector: string;
  name: string;
  line: string;
  before: { title: string; mock: React.ReactNode; ledger: Ledger };
  after: { url: string; mock: React.ReactNode; ledger: Ledger };
  live?: { label: string; href: string };
};

export function BeforeAfter({ v, defaultSide = "after" }: { v: Vertical; defaultSide?: "before" | "after" }) {
  const [side, setSide] = useState<"before" | "after">(defaultSide);
  const isAfter = side === "after";
  const active = isAfter ? v.after : v.before;
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,360px)_1fr] md:gap-10">
      {/* copy + ledger */}
      <div className="md:pt-2">
        <p className="text-[13px] text-[#111111]/40 " style={mono}>{v.sector}</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#111111]" style={inter}>{v.name}</h3>
        <p className="mt-2.5 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>{v.line}</p>

        {/* toggle */}
        <div className="mt-5 inline-flex rounded-full border border-black/10 bg-white p-1">
          <button onClick={() => setSide("before")} className={`rounded-full px-4 py-1.5 text-[13px] font-bold  transition-all ${!isAfter ? "bg-[#111111] text-white" : "text-[#111111]/55"}`} style={mono}>The old way</button>
          <button onClick={() => setSide("after")} className={`rounded-full px-4 py-1.5 text-[10px] font-bold tracking-[0.16em] uppercase transition-all ${isAfter ? "bg-[#1e6b3c] text-white" : "text-[#111111]/55"}`} style={mono}>With ELSIAA</button>
        </div>

        {/* ledger swaps with the toggle */}
        <div className="mt-5 space-y-2.5">
          {active.ledger.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-black/[0.06] pb-2">
              <span className="text-[13px] tracking-[0.06em] text-[#111111]/45 " style={mono}>{row.label}</span>
              <span className={`text-[14px] font-semibold tabular-nums ${isAfter ? "text-[#1e6b3c]" : "text-[#b42318]"}`} style={inter}>{row.value}</span>
            </div>
          ))}
        </div>

        {v.live && (
          <a href={v.live.href} target="_blank" rel="noreferrer" className="mt-5 inline-block text-[13px] text-[#1e6b3c]  hover:underline" style={mono}>
            {v.live.label} ↗
          </a>
        )}
      </div>

      {/* the framed view — crossfades between before and after */}
      <div>
        <Chrome url={isAfter ? v.after.url : "the-old-way.xlsx"}>
          <div className={`absolute inset-0 transition-opacity duration-500 ${isAfter ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>{v.after.mock}</div>
          <div className={`absolute inset-0 transition-opacity duration-500 ${!isAfter ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}>{v.before.mock}</div>
        </Chrome>
        <p className="mt-3 text-[13px] tracking-[0.04em] text-[#111111]/40" style={mono}>
          {isAfter ? "The system, running live. Click the tabs — it's real." : "What it replaced: spreadsheets, paper, and the phone."}
        </p>
      </div>
    </div>
  );
}
