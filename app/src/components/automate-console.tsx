import { useEffect, useRef, useState, useCallback } from "react";
import { mono, inter, Pill } from "./automate-mocks";

/*
  Automate — the interactive proof surface.
  A draggable before/after seam (Seam), one console with four selectable systems
  each with live KPIs, clickable views, a visible reasoning trace and an edge-case
  path (ProofDeck), and the multilingual AI Secretary (Secretary). No third-party
  iframes; one interval drives live state; everything honours reduced-motion.
*/

const GREEN = "#1e6b3c";
const SPRING = "cubic-bezier(0.2,0.8,0.2,1)";

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return r;
}

/* number that rolls to its target — the "live" pulse. Static under reduced motion. */
function LiveNum({ value, fmt = (n: number) => String(Math.round(n)) }: { value: number; fmt?: (n: number) => string }) {
  const reduced = useReduced();
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    if (reduced) { setShown(value); return; }
    const start = performance.now();
    const a = from.current;
    const dur = 520;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) raf.current = requestAnimationFrame(step);
      else from.current = value;
    };
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, reduced]);
  return <span className="tabular-nums">{fmt(shown)}</span>;
}

/* ============================ the seam ============================ */
export function Seam({
  before,
  after,
  height = "aspect-[16/10]",
  labelLeft = "Before",
  labelRight = "After",
}: {
  before: React.ReactNode;
  after: React.ReactNode;
  height?: string;
  labelLeft?: string;
  labelRight?: string;
}) {
  const reduced = useReduced();
  const wrap = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);
  const swept = useRef(false);

  const setFromClientX = useCallback((clientX: number) => {
    const el = wrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const p = ((clientX - r.left) / r.width) * 100;
    setPos(Math.max(2, Math.min(98, p)));
  }, []);

  // demonstrate once: a single left→right sweep when it first enters view
  useEffect(() => {
    if (reduced) { setPos(50); return; }
    const el = wrap.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      if (swept.current) return;
      swept.current = true;
      const start = performance.now();
      const dur = 1400;
      const tick = (t: number) => {
        if (dragging.current) return;
        const k = Math.min(1, (t - start) / dur);
        const e = 1 - Math.pow(1 - k, 3);
        // 15 → 85 → settle 50
        const p = k < 0.6 ? 15 + (85 - 15) * (e / (1 - Math.pow(0.4, 3))) : 85 + (50 - 85) * ((k - 0.6) / 0.4);
        setPos(Math.max(4, Math.min(96, p)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [reduced]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    swept.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromClientX(e.clientX);
  };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) setFromClientX(e.clientX); };
  const onUp = () => { dragging.current = false; };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") setPos((p) => Math.max(2, p - 4));
    if (e.key === "ArrowRight") setPos((p) => Math.min(98, p + 4));
  };

  return (
    <div
      ref={wrap}
      className={`relative w-full overflow-hidden ${height} touch-pan-y select-none`}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      {/* before — full bleed */}
      <div className="absolute inset-0">{before}</div>
      {/* after — clipped to the right of the seam */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>{after}</div>

      {/* corner labels fade with position */}
      <span
        className="pointer-events-none absolute top-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-[8.5px] font-bold text-[#b42318]  backdrop-blur"
        style={{ ...mono, opacity: Math.max(0, (pos - 20) / 40) }}
      >
        {labelLeft}
      </span>
      <span
        className="pointer-events-none absolute top-2 right-2 rounded-full bg-white/85 px-2 py-0.5 text-[8.5px] font-bold  backdrop-blur"
        style={{ ...mono, color: GREEN, opacity: Math.max(0, (80 - pos) / 40) }}
      >
        {labelRight}
      </span>

      {/* the divider + handle */}
      <div className="absolute inset-y-0" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        <div className="h-full w-[2px] bg-[#1e6b3c]" />
      </div>
      <button
        aria-label="Drag to compare before and after"
        role="slider"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onPointerDown={onDown}
        onKeyDown={onKey}
        className="absolute top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-full border border-[#1e6b3c]/40 bg-white shadow-[0_6px_20px_-8px_rgba(17,17,17,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]"
        style={{ left: `${pos}%` }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={GREEN} strokeWidth="1.5">
          <path d="M6 4L3 8l3 4M10 4l3 4-3 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

/* browser chrome with a host that retypes when the system changes */
function ChromeBar({ host }: { host: string }) {
  const reduced = useReduced();
  const [typed, setTyped] = useState(host);
  useEffect(() => {
    if (reduced) { setTyped(host); return; }
    let i = 0;
    setTyped("");
    const id = window.setInterval(() => {
      i += 1;
      setTyped(host.slice(0, i));
      if (i >= host.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [host, reduced]);
  return (
    <div className="flex items-center gap-2 border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
      <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
      <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
      <span className="h-2.5 w-2.5 rounded-full bg-[#1e6b3c]/50" />
      <span className="ml-3 flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-black/[0.04] px-3 py-1">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="2.4"><path d="M6 10V8a6 6 0 1112 0v2" /><rect x="4" y="10" width="16" height="10" rx="2" fill="#1e6b3c" stroke="none" opacity="0.15" /></svg>
        <span className="truncate text-[13px] tracking-[0.12em] text-[#111111]/50" style={mono}>{typed}<span className="text-[#1e6b3c]">{typed.length < host.length ? "▏" : ""}</span></span>
      </span>
      <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-[#1e6b3c]/10 px-2 py-0.5 sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" />
        <span className="text-[13px] text-[#1e6b3c] " style={mono}>Live</span>
      </span>
    </div>
  );
}

/* ===================== system model + live boards ===================== */
type Kpi = { label: string; val: number; fmt?: (n: number) => string; dir: "up" | "down" | "flat" };
type SysState = Record<string, number>;

type Trace = { title: string; lines: string[]; tone: "ok" | "warn" };

type System = {
  id: string;
  name: string;
  sector: string;
  host: string;
  tabs: string[];
  init: SysState;
  tick: (s: SysState, beat: number) => SysState;
  kpis: (s: SysState) => Kpi[];
  ledger: Array<[string, string, string]>; // label, old, new
  actionLabel: string;
  edgeLabel: string;
  run: (s: SysState, edge: boolean) => { next: SysState; trace: Trace };
  board: (s: SysState, tab: number) => React.ReactNode;
  live?: { label: string; href: string };
};

const clampBand = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* — small board primitives — */
function Row({ cols, children }: { cols: string; children: React.ReactNode }) {
  return <div className="grid items-center gap-x-2 border-b border-black/[0.04] py-[7px] text-[13px]" style={{ gridTemplateColumns: cols }}>{children}</div>;
}

function DispatchBoard({ s }: { s: SysState }) {
  const techs = [[40, 150, "ok"], [150, 110, "warn"], [230, 60, "ok"], [90, 70, "crit"]] as const;
  const jobs: Array<[string, "crit" | "warn" | "ok", string]> = [
    ["Delgado · burst pipe", "crit", s.assigned ? (s.override ? "Tech #3 · manual" : "Tech #7 · 4.2km") : "assigning…"],
    ["Okafor · water heater", "warn", "en route"],
    ["Kim · inspection", "ok", "scheduled"],
  ];
  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-hidden bg-[#eef1f0]">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: "linear-gradient(#00000010 1px,transparent 1px),linear-gradient(90deg,#00000010 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 200" preserveAspectRatio="none"><path d="M20 160 C 80 120, 120 150, 180 90 S 260 40, 285 55" fill="none" stroke={GREEN} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" /></svg>
        {techs.map(([x, y, t], i) => (
          <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700" style={{ left: `${(x + (i === 3 && s.assigned ? (s.beatX ?? 0) : 0)) / 3}%`, top: `${y / 2}%`, transitionTimingFunction: SPRING }}>
            <span className={`block h-3 w-3 rounded-full ring-2 ring-white ${t === "ok" ? "bg-[#1e6b3c]" : t === "warn" ? "bg-[#b7791f]" : "bg-[#b42318]"}`} />
          </span>
        ))}
        <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[13px] text-[#111111]/55  backdrop-blur" style={mono}>18 techs · live</div>
      </div>
      <div className="w-[44%] flex-none border-l border-black/[0.06] p-3">
        <p className="text-[13px] text-[#111111]/45 " style={mono}>Dispatch queue</p>
        {jobs.map((j, i) => (
          <div key={i} className={`mt-2 rounded-lg border p-2 transition-all duration-500 ${i === 0 && s.assigned ? "border-[#1e6b3c]/40 bg-[#1e6b3c]/[0.05]" : "border-black/[0.07]"}`} style={{ transitionTimingFunction: SPRING }}>
            <div className="flex items-center justify-between"><span className="text-[13px] font-medium" style={inter}>{j[0]}</span><Pill tone={j[1]}>{j[1] === "crit" ? "Now" : j[1] === "warn" ? "Soon" : "Set"}</Pill></div>
            <p className="mt-0.5 text-[8.5px] text-[#111111]/50" style={mono}>{j[2]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HealthBoard({ s }: { s: SysState }) {
  const base: Array<[string, string, "ok" | "warn" | "crit", string, string]> = [
    ["4 · West", "Intake — triage", "ok", "Dr. Amir", "07:12"],
    ["4 · West", "Awaiting bed", "warn", "—", "00:48"],
    ["ICU · 2", "Post-op monitor", "ok", "Dr. Sood", "02:31"],
    ["ER · Bay 3", "Critical — hold", "crit", "Dr. Lee", "00:09"],
  ];
  const rows = s.intake ? [["ER · Bay 5", s.edge ? "Cardiac — reprioritized" : "Cardiac — priority bed", "crit", "Agent → Dr. Lee", "00:02"] as [string, string, "ok" | "warn" | "crit", string, string], ...base] : base;
  return (
    <div className="flex h-full">
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2"><p className="text-[13px] text-[#111111]/45 " style={mono}>Live census · 214 beds</p><div className="flex gap-1"><Pill tone="ok">Stable</Pill><Pill tone="warn">Watch</Pill><Pill tone="crit">Crit</Pill></div></div>
        <div className="px-3">
          <div className="grid grid-cols-[1fr_1.5fr_auto_1.1fr_auto] gap-x-2 border-b border-black/[0.06] pb-1 text-[13px] text-[#111111]/35 " style={mono}><span>Unit</span><span>Stage</span><span>St</span><span>Clinician</span><span>Elap</span></div>
          {rows.map((r, i) => (
            <div key={i} className={`grid grid-cols-[1fr_1.5fr_auto_1.1fr_auto] items-center gap-x-2 border-b border-black/[0.04] py-[6px] text-[13px] ${i === 0 && s.intake ? "bg-[#1e6b3c]/[0.05]" : ""}`} style={inter}>
              <span className="font-medium">{r[0]}</span><span className="truncate text-[#111111]/60">{r[1]}</span><Pill tone={r[2]}>{r[2] === "ok" ? "OK" : r[2] === "warn" ? "Wait" : "Now"}</Pill><span className="truncate text-[#111111]/60">{r[3]}</span><span className="tabular-nums text-[#111111]/50" style={mono}>{r[4]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FinanceBoard({ s }: { s: SysState }) {
  const rows: Array<[string, string, string, "ok" | "warn" | "crit"]> = [
    ["Bank · Operating", "$4,182,904", "Matched", "ok"],
    ["AP · Vendors", "$1,004,220", s.reconciled >= 80 ? "Matched" : "3 exceptions", s.reconciled >= 80 ? "ok" : "warn"],
    ["Intercompany", "$0", "Balanced", "ok"],
    ["Revenue · deferred", "$2,910,540", s.ran ? (s.edge ? "Uncertain — review" : "Anomaly flagged") : "Pending", s.ran ? (s.edge ? "warn" : "crit") : "warn"],
    ["Payroll accrual", "$688,110", "Matched", "ok"],
  ];
  return (
    <div className="h-full p-3">
      <div className="flex items-center justify-between"><p className="text-[13px] text-[#111111]/45 " style={mono}>Close · Day 2 of 2</p><Pill tone="ok"><LiveNum value={s.reconciled} fmt={(n) => `${Math.round(n)}% reconciled`} /></Pill></div>
      <div className="mt-2">{rows.map((r, i) => (<Row key={i} cols="1.4fr 1fr auto"><span className="truncate font-medium" style={inter}>{r[0]}</span><span className="tabular-nums text-[#111111]/60" style={mono}>{r[1]}</span><Pill tone={r[3]}>{r[2]}</Pill></Row>))}</div>
    </div>
  );
}

function FleetBoard({ s }: { s: SysState }) {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between"><p className="text-[13px] text-[#111111]/45 " style={mono}>Fleet board · 12,480 vehicles</p><div className="flex gap-1"><Pill tone="ok">Avail 3,102</Pill><Pill tone="crit">Damage AI {s.claims}</Pill></div></div>
      <div className="mt-2 flex-1">{["Compact · A-fleet", "SUV · premium", "Van · commercial", "EV · airport"].map((label, r) => (
        <div key={r} className="grid grid-cols-[1.1fr_3fr] items-center gap-2 border-b border-black/[0.05] py-2"><span className="truncate text-[9.5px] text-[#111111]/70" style={inter}>{label}</span><div className="relative h-4 rounded bg-black/[0.04]">{[[4, 22], [30, 26], [60, 14], [78, 18]].map(([l, w], i) => (<span key={i} className={`absolute top-0 h-4 rounded ${(r + i) % 4 === 3 ? "bg-[#b7791f]/70" : "bg-[#1e6b3c]/70"}`} style={{ left: `${l}%`, width: `${w}%` }} />))}</div></div>
      ))}</div>
      {s.returned ? (
        <div className="rounded-lg border border-[#1e6b3c]/25 bg-[#1e6b3c]/[0.06] p-2">
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-16 flex-none overflow-hidden rounded bg-[#dfe3e1]">
              <span className="absolute inset-0" style={{ backgroundImage: "linear-gradient(120deg,#c9cecb 0%,#e7eae8 60%)" }} />
              {!s.edge && <span className="absolute top-3 left-6 h-3 w-3 rounded-full border-2 border-[#b42318]" />}
              {s.edge && <span className="absolute top-2 left-4 h-5 w-7 rounded border border-dashed border-[#b7791f]" />}
            </div>
            <p className="text-[9.5px]" style={inter}>{s.edge ? <>Ambiguous mark · <b className="text-[#8a5a12]">more photos requested</b> before drafting.</> : <>Unit EV-2231 · <b>2 dents</b> from 6 photos · claim drafted, $840.</>}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-black/[0.07] p-2"><p className="text-[9.5px] text-[#111111]/45" style={mono}>Awaiting return · AI inspection idle</p></div>
      )}
    </div>
  );
}

const SYSTEMS: System[] = [
  {
    id: "dispatch",
    name: "Dispatch OS",
    sector: "Field service · Live demo",
    host: "dispatch.plumbingco.live",
    tabs: ["Map", "Queue", "Techs"],
    init: { assigned: 0, override: 0, jobs: 63, eta: 26, dispatch: 11, beatX: 0 },
    tick: (s, beat) => ({ ...s, eta: clampBand(s.assigned ? 24 : 26 + (beat % 2 === 0 ? 1 : 0), 22, 29), beatX: s.assigned ? -18 : 0 }),
    kpis: (s) => [
      { label: "Jobs today", val: s.jobs, dir: "up" },
      { label: "Avg ETA", val: s.eta, fmt: (n) => `${Math.round(n)}m`, dir: "down" },
      { label: "Time to dispatch", val: s.dispatch, fmt: (n) => (n < 1 ? "0s" : `${Math.round(n)}m`), dir: "down" },
    ],
    ledger: [["Time to dispatch a job", "~11 min on the phone", "0 — the agent books it"], ["Double-booked / week", "6–9 jobs", "0"], ["After-hours calls", "1 in 3 missed", "Answered 24/7"]],
    actionLabel: "Simulate emergency call",
    edgeLabel: "Override the AI",
    run: (s, edge) => edge
      ? { next: { ...s, assigned: 1, override: 1, jobs: s.jobs + 1, dispatch: 0.4, eta: 33 }, trace: { title: "Manual override accepted", tone: "warn", lines: ["You reassigned to Tech #3.", "Recalculated: 9.1km away · +7 min ETA.", "System held the booking and re-notified the customer."] } }
      : { next: { ...s, assigned: 1, override: 0, jobs: s.jobs + 1, dispatch: 0.2, eta: 24 }, trace: { title: "Chose Tech #7", tone: "ok", lines: ["4.2 km from the job — nearest available.", "Holds pipe-repair certification.", "Lowest current load (1 open job).", "Booked · ETA texted to customer · no dispatcher."] } },
    board: (s) => <DispatchBoard s={s} />,
    live: { label: "Open the live demo", href: "https://plumbing.demo.elsiaa.com" },
  },
  {
    id: "health",
    name: "Patient Flow OS",
    sector: "Health system · Custom build",
    host: "flow.health-system.internal",
    tabs: ["Census", "Intake", "Beds"],
    init: { intake: 0, edge: 0, occ: 87, wait: 22, abandoned: 22 },
    tick: (s, beat) => ({ ...s, occ: clampBand(s.intake ? 88 : 87 + (beat % 3 === 0 ? 1 : 0), 84, 90), wait: clampBand(s.intake ? 18 : 22 - (beat % 2), 16, 24) }),
    kpis: (s) => [
      { label: "Occupancy", val: s.occ, fmt: (n) => `${Math.round(n)}%`, dir: "up" },
      { label: "ER wait", val: s.wait, fmt: (n) => `${Math.round(n)}m`, dir: "down" },
      { label: "Calls abandoned", val: s.intake ? 0 : s.abandoned, fmt: (n) => `${Math.round(n)}%`, dir: "down" },
    ],
    ledger: [["Average intake time", "~31 min, mostly hold", "14 min"], ["Bed board accuracy", "Whoever updated last", "Live, to the minute"], ["Calls abandoned", "22%", "0 — the agent answers"]],
    actionLabel: "Simulate intake call",
    edgeLabel: "No beds available",
    run: (s, edge) => edge
      ? { next: { ...s, intake: 1, edge: 1 }, trace: { title: "No priority bed free — re-prioritized", tone: "warn", lines: ["Chest pain + shortness of breath → cardiac pathway.", "No bed on 4-West: bumped a stable discharge-ready patient.", "Bed freed in ER Bay 5 · charge nurse notified to confirm."] } }
      : { next: { ...s, intake: 1, edge: 0 }, trace: { title: "Triaged: cardiac · urgent", tone: "ok", lines: ["Symptoms: chest tightness, short of breath.", "Urgency: high → cardiac pathway.", "Priority bed requested from 4-West · Dr. Lee paged."] } },
    board: (s) => <HealthBoard s={s} />,
  },
  {
    id: "finance",
    name: "Close & Reconciliation OS",
    sector: "Finance operations · Custom build",
    host: "close.finance-ops.internal",
    tabs: ["Close", "Recs", "Audit"],
    init: { ran: 0, edge: 0, reconciled: 61, exceptions: 7, caught: 0 },
    tick: (s) => (s.ran && s.reconciled < 92 ? { ...s, reconciled: clampBand(s.reconciled + 9, 0, 92) } : s),
    kpis: (s) => [
      { label: "Reconciled", val: s.reconciled, fmt: (n) => `${Math.round(n)}%`, dir: "up" },
      { label: "Exceptions", val: s.ran ? (s.edge ? 1 : 3) : s.exceptions, dir: "down" },
      { label: "Caught", val: s.caught, fmt: (n) => (n ? `$${Math.round(n)}k` : "—"), dir: "up" },
    ],
    ledger: [["Time to close the books", "6 days + weekend", "34 hours"], ["Reconciliation", "By hand, cell by cell", "Automatic, every account"], ["Errors caught", "After statements shipped", "Before close — $920k flagged"]],
    actionLabel: "Run reconciliation",
    edgeLabel: "Uncertain anomaly",
    run: (s, edge) => edge
      ? { next: { ...s, ran: 1, edge: 1, reconciled: Math.max(s.reconciled, 70), caught: 0 }, trace: { title: "Low confidence — held for human review", tone: "warn", lines: ["Deferred revenue · Contract #8841.", "Timing difference could be a valid early renewal.", "Confidence 61% < 80% threshold → not auto-corrected.", "Flagged to controller with both interpretations."] } }
      : { next: { ...s, ran: 1, edge: 0, reconciled: Math.max(s.reconciled, 70), caught: 920 }, trace: { title: "Anomaly flagged · entry drafted", tone: "ok", lines: ["Deferred revenue off by $41,200 vs. contract terms.", "Recognition schedule mis-keyed in month 3.", "Correcting journal entry drafted, audit-linked.", "$920k in timing errors caught before close."] } },
    board: (s) => <FinanceBoard s={s} />,
  },
  {
    id: "fleet",
    name: "Fleet & Reservations OS",
    sector: "Rental group · Custom build",
    host: "fleet.rental-group.internal",
    tabs: ["Fleet", "Returns", "Pricing"],
    init: { returned: 0, edge: 0, util: 91, idle: 1.8, claims: 14 },
    tick: (s, beat) => ({ ...s, util: clampBand(91 + (beat % 4 === 0 ? 1 : 0), 88, 93) }),
    kpis: (s) => [
      { label: "Utilization", val: s.util, fmt: (n) => `${Math.round(n)}%`, dir: "up" },
      { label: "Idle days", val: s.idle, fmt: (n) => n.toFixed(1), dir: "down" },
      { label: "Claims (AI)", val: s.claims, dir: "up" },
    ],
    ledger: [["Fleet you can see now", "Yesterday's spreadsheet", "12,480, live"], ["Damage claims", "Days later, if at all", "Minutes — AI drafts them"], ["Idle vehicles", "Nobody's counting", "Down to 1.8 days"]],
    actionLabel: "Simulate vehicle return",
    edgeLabel: "Ambiguous damage",
    run: (s, edge) => edge
      ? { next: { ...s, returned: 1, edge: 1 }, trace: { title: "Ambiguous — more photos requested", tone: "warn", lines: ["Return EV-2231 · 6 photos analyzed.", "Possible scuff on rear panel, low confidence.", "Could be shadow or pre-existing wear.", "Auto-requested 2 close-ups before drafting a claim."] } }
      : { next: { ...s, returned: 1, edge: 0, claims: s.claims + 1 }, trace: { title: "Damage detected · claim drafted", tone: "ok", lines: ["Return EV-2231 · 6 photos analyzed.", "2 new dents localized on the rear-left panel.", "Matched against check-out photos — both are new.", "Claim drafted at $840, sent for one-tap approval."] } },
    board: (s) => <FleetBoard s={s} />,
  },
];

/* the manual "before" for each system, shown on the left of the seam */
function BeforeArtifact({ id }: { id: string }) {
  const scrawl = { fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" } as const;
  if (id === "dispatch" || id === "health") {
    const title = id === "dispatch" ? "BOARD — TODAY'S JOBS" : "BED BOARD — 4 WEST";
    const cells = id === "dispatch"
      ? [["Delgado", "?? double", "#b42318"], ["Okafor", "en route?", "#1f3a5f"], ["Kim", "2pm", "#111"], ["—", "who's free", "#8a5a12"], ["Ruiz", "call back", "#b42318"], ["—", "", "#111"]]
      : [["401", "Amir?", "#1f3a5f"], ["402", "DISCH?", "#b42318"], ["403", "—", "#8a5a12"], ["404", "ICU xfer", "#1f3a5f"], ["405", "clean??", "#b42318"], ["406", "hold", "#111"]];
    return (
      <div className="relative h-full w-full bg-[#eef0ef] p-3">
        <div className="absolute inset-3 rounded-md border-2 border-[#c9cdcb] bg-white shadow-inner">
          <div className="flex items-center justify-between border-b-2 border-[#e2e5e3] px-3 py-1.5"><span className="text-[13px] font-bold tracking-wide text-[#1f3a5f]" style={scrawl}>{title}</span><span className="text-[13px] text-[#b42318]" style={scrawl}>?? = who knows</span></div>
          <div className="grid grid-cols-3 gap-px bg-[#e2e5e3]">
            {cells.map(([a, b, c], i) => (<div key={i} className="bg-white px-2 py-2"><p className="text-[13px] font-bold text-[#111111]/70" style={mono}>{a}</p><p className="mt-0.5 text-[13px] leading-none" style={{ ...scrawl, color: c as string }}>{b}</p></div>))}
          </div>
          <div className="px-3 py-2"><span className="text-[13px] text-black/50" style={scrawl}>erase + rewrite every shift · phone for the rest</span></div>
        </div>
        <div className="absolute top-6 right-6 w-24 rotate-[5deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={scrawl}>{id === "dispatch" ? "DON'T double-book Delgado!!" : "intake line ringing — page on-call?? ext 4021"}</p></div>
      </div>
    );
  }
  // finance + fleet: the mega-spreadsheet
  const fname = id === "finance" ? "CLOSE_Q3_final_FINAL_v12 (Rana's copy).xlsx" : "fleet_tracker_MASTER_do-not-edit.xlsx";
  const note = id === "finance" ? "doesn't tie out by $41k — DO NOT SEND" : "this sheet is a day old, at least";
  return (
    <div className="relative h-full w-full bg-[#e9eaec] p-3">
      <div className="absolute inset-x-3 top-3 h-[64%] overflow-hidden rounded-md border border-black/15 bg-white shadow-lg">
        <div className="flex items-center gap-1 bg-[#1f7a45] px-2 py-1"><span className="h-2 w-2 rounded-full bg-white/70" /><span className="truncate text-[13px] font-semibold text-white" style={inter}>{fname}</span></div>
        <div className="grid grid-cols-8">{Array.from({ length: 96 }).map((_, i) => (<div key={i} className={`h-3 border-r border-b border-black/[0.07] ${i % 8 === 0 ? "bg-[#f3f4f6]" : "bg-white"} ${[11, 27, 43].includes(i) ? "bg-[#fecaca]/70" : ""} ${[18, 34, 52, 61].includes(i) ? "bg-[#fde68a]/60" : ""}`} />))}</div>
      </div>
      <div className="absolute right-6 bottom-6 w-24 rotate-[4deg] bg-[#fde68a] p-2 shadow-md"><p className="text-[13px] leading-tight text-black/70" style={scrawl}>{note}</p></div>
    </div>
  );
}

/* ============================ the proof deck ============================ */
export function ProofDeck() {
  const reduced = useReduced();
  const [idx, setIdx] = useState(0);
  const [tab, setTab] = useState(0);
  const [edge, setEdge] = useState(false);
  const [trace, setTrace] = useState<Trace | null>(null);
  const [states, setStates] = useState<Record<string, SysState>>(() => Object.fromEntries(SYSTEMS.map((s) => [s.id, { ...s.init }])));
  const beat = useRef(0);
  const sys = SYSTEMS[idx];
  const st = states[sys.id];

  // one interval drives believable live movement on the active system only
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      beat.current += 1;
      setStates((prev) => ({ ...prev, [sys.id]: sys.tick(prev[sys.id], beat.current) }));
    }, 3200);
    return () => window.clearInterval(id);
  }, [sys, reduced]);

  const select = (i: number) => { setIdx(i); setTab(0); setEdge(false); setTrace(null); };
  const runAction = (e: boolean) => {
    const { next, trace: tr } = sys.run(states[sys.id], e);
    setStates((prev) => ({ ...prev, [sys.id]: next }));
    setTrace(tr);
  };
  const resetSys = () => { setStates((prev) => ({ ...prev, [sys.id]: { ...sys.init } })); setTrace(null); setEdge(false); };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[210px_1fr] lg:gap-8">
      {/* rail */}
      <div className="lg:pt-1">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
          {SYSTEMS.map((s, i) => {
            const on = i === idx;
            return (
              <button key={s.id} onClick={() => select(i)} className={`flex-none rounded-lg border px-3 py-2 text-left transition-all lg:w-full lg:rounded-none lg:border-0 lg:border-l-2 lg:px-3 lg:py-3 ${on ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05] lg:bg-transparent" : "border-black/10 lg:border-black/[0.08]"}`} style={{ transitionTimingFunction: SPRING }}>
                <span className={`block text-[13px] font-semibold tracking-[-0.01em] ${on ? "text-[#111111]" : "text-[#111111]/55"}`} style={inter}>{s.name}</span>
                <span className={`mt-0.5 block text-[13px]  ${on ? "text-[#1e6b3c]" : "text-[#111111]/35"}`} style={mono}>{s.sector.split(" · ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* console */}
      <div>
        <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
          <ChromeBar key={sys.id} host={sys.host} />
          {/* tabs */}
          <div className="flex items-center gap-1 border-b border-black/[0.06] bg-[#FBFBFA] px-3 py-1.5">
            {sys.tabs.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`rounded-md px-2.5 py-1 text-[13px] tracking-[0.08em] transition-all ${i === tab ? "bg-[#1e6b3c]/12 text-[#1e6b3c]" : "text-[#111111]/45 hover:text-[#111111]/70"}`} style={mono}>{t}</button>
            ))}
            <span className="ml-auto text-[13px] text-[#111111]/30 " style={mono}>{sys.name}</span>
          </div>
          {/* live KPI strip */}
          <div className="grid grid-cols-3 gap-px border-b border-black/[0.06] bg-black/[0.05]">
            {sys.kpis(st).map((k) => (
              <div key={k.label} className="bg-white px-3 py-2.5">
                <p className="truncate text-[13px] text-[#111111]/40 " style={mono}>{k.label}</p>
                <p className="mt-1 flex items-baseline gap-1 text-[15px] font-semibold tracking-[-0.02em]" style={inter}><LiveNum value={k.val} fmt={k.fmt} /><span className={k.dir === "down" ? "text-[#b42318]" : "text-[#1e6b3c]"} style={{ fontSize: 9 }}>{k.dir === "up" ? "▲" : k.dir === "down" ? "▼" : "—"}</span></p>
              </div>
            ))}
          </div>
          {/* the seam: manual artifact ↔ live board */}
          <Seam
            key={sys.id + tab}
            height="aspect-[16/10]"
            labelLeft="The old way"
            labelRight="Live system"
            before={<BeforeArtifact id={sys.id} />}
            after={<div className="h-full w-full bg-white">{sys.board(st, tab)}</div>}
          />
        </div>

        {/* controls + reasoning + ledger */}
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => runAction(false)} className="rounded-full bg-[#1e6b3c] px-4 py-2 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]" style={{ ...mono, transitionTimingFunction: SPRING }}>{sys.actionLabel}</button>
              <button onClick={() => { setEdge(true); runAction(true); }} className="rounded-full border border-black/15 px-4 py-2 text-[13px] font-bold text-[#111111]/70  transition-all hover:border-[#b7791f] hover:text-[#8a5a12]" style={mono}>{sys.edgeLabel}</button>
              {trace && <button onClick={resetSys} aria-label="Reset" className="text-[13px] text-[#111111]/40  hover:text-[#111111]/70" style={mono}>Reset</button>}
            </div>
            {/* reasoning trace */}
            <div className="mt-3 min-h-[132px] rounded-xl border border-black/[0.08] bg-[#FBFBFA] p-3">
              {trace ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${trace.tone === "ok" ? "bg-[#1e6b3c]" : "bg-[#b7791f]"}`} />
                    <p className={`text-[13px] font-bold  ${trace.tone === "ok" ? "text-[#1e6b3c]" : "text-[#8a5a12]"}`} style={mono}>{trace.title}</p>
                  </div>
                  <ol className="mt-2 space-y-1">
                    {trace.lines.map((l, i) => (
                      <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-[#111111]/70" style={inter}>
                        <span className="mt-[3px] text-[13px] text-[#111111]/30" style={mono}>{String(i + 1)}</span>{l}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-[#111111]/40" style={mono}>Reasoning trace — run the system above. Every decision it makes is shown here: what it saw, and why it acted.</p>
              )}
            </div>
          </div>
          {/* ledger */}
          <div className="md:pt-1">
            <p className="text-[13px] text-[#111111]/40 " style={mono}>Old way → the system</p>
            <div className="mt-2.5 space-y-2">
              {sys.ledger.map(([label, o, n]) => (
                <div key={label} className="border-b border-black/[0.06] pb-2">
                  <p className="text-[13px] tracking-[0.06em] text-[#111111]/45 " style={mono}>{label}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[12.5px]" style={inter}><span className="text-[#b42318]/70 line-through" style={mono}>{o}</span><span className="text-[#111111]/25">→</span><span className="font-semibold text-[#1e6b3c]">{n}</span></p>
                </div>
              ))}
            </div>
            {sys.live ? (
              <a href={sys.live.href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] text-[#1e6b3c]  hover:underline" style={mono}>{sys.live.label} ↗</a>
            ) : (
              <a href="/contact" className="mt-3 inline-block text-[13px] text-[#111111]/50  hover:text-[#1e6b3c]" style={mono}>Request a walkthrough →</a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ the AI secretary ============================ */
type Lang = "en" | "he" | "ru";
type Turn = { who: "caller" | "agent"; text: string };
type Action = string;
type Script = { badge: string; conv: Turn[]; actions: Action[]; trace: string[]; metrics: [string, string]; };

const SECRETARY: Record<Lang, { name: string; dir: "ltr" | "rtl"; label: string; scripts: Record<string, Script> }> = {
  en: {
    name: "English", dir: "ltr", label: "EN",
    scripts: {
      book: {
        badge: "Detected: English",
        conv: [
          { who: "caller", text: "Hi — can you book me a meeting with Dr. Levin next week?" },
          { who: "agent", text: "Of course. Dr. Levin has Tuesday 10:00 or Thursday 15:00 open. Which suits you?" },
          { who: "caller", text: "Thursday works." },
          { who: "agent", text: "Booked for Thursday 15:00. I've sent you a confirmation and added it to Dr. Levin's calendar." },
        ],
        actions: ["Checked Dr. Levin's calendar", "Held Thu 15:00", "CRM record updated · contact #4471", "Confirmation SMS sent"],
        trace: ["Intent: schedule meeting with a named person.", "Resolved 'Dr. Levin' → provider #12, matched two open slots.", "Caller chose Thursday → wrote the event, no double-book.", "Closed the loop with an SMS confirmation."],
        metrics: ["Resolution time", "38s"],
      },
      conflict: {
        badge: "Edge case: conflicting info",
        conv: [
          { who: "caller", text: "Move my Monday appointment to Monday at 4." },
          { who: "agent", text: "Your appointment is on Tuesday, not Monday — did you mean to move the Tuesday one to Monday 16:00, or keep Tuesday and change the time?" },
          { who: "caller", text: "Oh right, Tuesday. Just change it to 4pm." },
          { who: "agent", text: "Done — Tuesday moved to 16:00. Confirmation sent." },
        ],
        actions: ["Detected date mismatch", "Asked one clarifying question", "Rescheduled Tue → 16:00", "Confirmation SMS sent"],
        trace: ["Request referenced 'Monday' but no Monday booking existed.", "Did not guess — surfaced the mismatch to the caller.", "Confirmed intent, then made the single change."],
        metrics: ["Clarification", "1 question"],
      },
    },
  },
  he: {
    name: "עברית", dir: "rtl", label: "HE",
    scripts: {
      book: {
        badge: "זוהתה שפה: עברית",
        conv: [
          { who: "caller", text: "שלום, אפשר לקבוע לי פגישה עם ד״ר לוין בשבוע הבא?" },
          { who: "agent", text: "בוודאי. לד״ר לוין יש פנוי ביום שלישי ב-10:00 או חמישי ב-15:00. מה מתאים לך?" },
          { who: "caller", text: "חמישי מצוין." },
          { who: "agent", text: "נקבע ליום חמישי 15:00. שלחתי לך אישור והוספתי ליומן של ד״ר לוין." },
        ],
        actions: ["נבדק היומן של ד״ר לוין", "נשמר חמישי 15:00", "עודכן רשומת CRM · איש קשר 4471", "נשלח אישור ב-SMS"],
        trace: ["כוונה: קביעת פגישה עם אדם מזוהה.", "‏'ד״ר לוין' → ספק #12, נמצאו שני זמנים פנויים.", "המתקשר בחר חמישי → נכתב האירוע, ללא כפילות.", "נסגר המעגל עם אישור."],
        metrics: ["זמן טיפול", "38 שנ׳"],
      },
    },
  },
  ru: {
    name: "Русский", dir: "ltr", label: "RU",
    scripts: {
      switch: {
        badge: "Язык: Русский → English",
        conv: [
          { who: "caller", text: "Здравствуйте, мне нужно перенести приём." },
          { who: "agent", text: "Конечно. Ваш приём в четверг в 15:00. На какое время перенести?" },
          { who: "caller", text: "Actually, let's just keep it but add my wife to the appointment." },
          { who: "agent", text: "No problem — I've kept Thursday 15:00 and added a second attendee. Confirmation sent to both of you." },
        ],
        actions: ["Detected mid-call language switch → English", "Kept Thu 15:00", "Added second attendee", "Confirmations sent to both"],
        trace: ["Opened in Russian; caller switched to English mid-turn.", "Continued seamlessly — no restart, no lost context.", "Interpreted 'keep it but add my wife' → same slot, +1 attendee."],
        metrics: ["Language switch", "handled live"],
      },
      escalate: {
        badge: "Edge case: escalation",
        conv: [
          { who: "caller", text: "Мне нужно оспорить счёт на 12 000." },
          { who: "agent", text: "Это вопрос для биллинг-менеджера. Я передаю его Анне с вашими данными и historyю звонка — она свяжется с вами сегодня. Хотите, чтобы я также отправила письменное подтверждение?" },
          { who: "caller", text: "Да, пожалуйста." },
          { who: "agent", text: "Готово. Анна уведомлена, подтверждение отправлено." },
        ],
        actions: ["Classified: billing dispute > threshold", "Escalated to Anna (billing)", "Attached call summary + context", "Written confirmation sent"],
        trace: ["Amount and dispute type exceed auto-handling policy.", "Did not attempt to resolve — escalated with full context.", "Explained why it was escalating, in the caller's language."],
        metrics: ["Escalation rate", "handled by policy"],
      },
    },
  },
};

const SCRIPT_ORDER: Record<Lang, string[]> = {
  en: ["book", "conflict"],
  he: ["book"],
  ru: ["switch", "escalate"],
};

export function Secretary() {
  const reduced = useReduced();
  const [lang, setLang] = useState<Lang>("en");
  const [scriptKey, setScriptKey] = useState("book");
  const [step, setStep] = useState(0); // how many turns revealed
  const cfg = SECRETARY[lang];
  const script = cfg.scripts[scriptKey] ?? Object.values(cfg.scripts)[0];
  const timer = useRef<number>(0);

  const start = useCallback((l: Lang, key: string) => {
    setLang(l); setScriptKey(key); setStep(reduced ? 99 : 1);
  }, [reduced]);

  // reveal the conversation turn by turn (purposeful, not looping)
  useEffect(() => {
    window.clearTimeout(timer.current);
    if (reduced) { setStep(script.conv.length); return; }
    if (step > 0 && step < script.conv.length) {
      timer.current = window.setTimeout(() => setStep((s) => s + 1), script.conv[step - 1].who === "caller" ? 700 : 1100);
    }
    return () => window.clearTimeout(timer.current);
  }, [step, script, reduced]);

  const revealed = Math.min(step, script.conv.length);
  const done = revealed >= script.conv.length;
  const shownActions = done ? script.actions : script.actions.slice(0, Math.max(0, revealed - 1));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      {/* conversation */}
      <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
        <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1e6b3c]/10"><span className="relative flex h-3 w-3 items-center justify-center"><span className="absolute inset-0 rotate-45 border border-[#1e6b3c]" /><span className="h-[3px] w-[3px] rotate-45 bg-[#1e6b3c]" /></span></span>
            <span className="text-[13px] font-semibold" style={inter}>AI Secretary</span>
          </div>
          <span className="rounded-full bg-[#1e6b3c]/10 px-2 py-0.5 text-[8.5px] font-semibold text-[#1e6b3c] " style={mono}>{script.badge}</span>
        </div>

        {/* language + scenario controls */}
        <div className="flex flex-wrap items-center gap-2 border-b border-black/[0.06] px-4 py-2.5">
          <span className="text-[13px] text-[#111111]/35 " style={mono}>Call in</span>
          {(["en", "he", "ru"] as Lang[]).map((l) => (
            <button key={l} onClick={() => start(l, SCRIPT_ORDER[l][0])} className={`rounded-full px-3 py-1 text-[13px] font-bold tracking-[0.1em] transition-all ${lang === l ? "bg-[#111111] text-white" : "border border-black/12 text-[#111111]/60"}`} style={mono}>{SECRETARY[l].label}</button>
          ))}
          <span className="mx-1 h-4 w-px bg-black/10" />
          {SCRIPT_ORDER[lang].map((k) => (
            <button key={k} onClick={() => start(lang, k)} className={`rounded-full px-3 py-1 text-[13px] tracking-[0.06em] transition-all ${scriptKey === k ? "bg-[#1e6b3c]/12 text-[#1e6b3c]" : "text-[#111111]/45 hover:text-[#111111]/70"}`} style={mono}>{cfg.scripts[k] ? scenarioLabel(k) : k}</button>
          ))}
        </div>

        {/* messages */}
        <div dir={cfg.dir} className="min-h-[300px] space-y-3 px-4 py-4" style={{ fontFeatureSettings: '"ss01"' }}>
          {script.conv.slice(0, revealed).map((t, i) => (
            <div key={i} className={`flex ${t.who === "agent" ? (cfg.dir === "rtl" ? "justify-start" : "justify-end") : cfg.dir === "rtl" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${t.who === "agent" ? "bg-[#1e6b3c]/[0.08] text-[#111111]" : "bg-black/[0.04] text-[#111111]/80"}`} style={inter}>
                <span className={`mb-0.5 block text-[13px]  ${t.who === "agent" ? "text-[#1e6b3c]" : "text-[#111111]/35"}`} style={mono}>{t.who === "agent" ? "Secretary" : "Caller"}</span>
                {t.text}
              </div>
            </div>
          ))}
          {!done && revealed > 0 && !reduced && (
            <div className="flex gap-1 px-1"><Dot /><Dot d={0.15} /><Dot d={0.3} /></div>
          )}
          {revealed === 0 && <p className="text-[13px] text-[#111111]/40" style={mono}>Pick a language above to place a call.</p>}
        </div>
      </div>

      {/* backend actions + reasoning + metrics */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-black/[0.08] bg-[#FBFBFA] p-4">
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>Actions · running in the background</p>
          <div className="mt-3 space-y-2">
            {script.actions.map((a, i) => {
              const on = shownActions.length > i;
              return (
                <div key={i} className="flex items-center gap-2.5" style={{ opacity: on ? 1 : 0.28, transition: `opacity .4s ${SPRING}` }}>
                  <span className={`flex h-4 w-4 flex-none items-center justify-center rounded-full ${on ? "bg-[#1e6b3c]" : "bg-black/10"}`}>{on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}</span>
                  <span className="text-[13px] text-[#111111]/75" style={inter}>{a}</span>
                </div>
              );
            })}
          </div>
        </div>

        <details className="group rounded-2xl border border-black/[0.08] bg-white p-4" open>
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="text-[13px] text-[#111111]/45 " style={mono}>Reasoning trace</span>
            <span className="text-[13px] text-[#111111]/35 group-open:rotate-180" style={mono}>▾</span>
          </summary>
          <ol className="mt-2.5 space-y-1.5">
            {script.trace.map((l, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-[#111111]/70" style={inter}><span className="mt-[3px] text-[13px] text-[#111111]/30" style={mono}>{String(i + 1)}</span>{l}</li>
            ))}
          </ol>
        </details>

        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-black/[0.08] bg-black/[0.05]">
          {[["Tasks autonomous", "89%"], [script.metrics[0], script.metrics[1]], ["Escalation rate", "6%"]].map(([l, v]) => (
            <div key={l} className="bg-white px-3 py-3"><p className="truncate text-[13px] text-[#111111]/40 " style={mono}>{l}</p><p className="mt-1 text-[15px] font-semibold tracking-[-0.02em] text-[#111111]" style={inter}>{v}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function scenarioLabel(k: string) {
  const map: Record<string, string> = { book: "Book a meeting", conflict: "Conflicting info", switch: "Switch language", escalate: "Escalate" };
  return map[k] ?? k;
}
function Dot({ d = 0 }: { d?: number }) {
  return <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]/50" style={{ animation: `elsiaaDot 1s ${d}s infinite ease-in-out` }} />;
}
