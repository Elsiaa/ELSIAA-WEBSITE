import { useEffect, useRef, useState } from "react";

/*
  ABA Operations Automation — the second system block on /automate.

  Sits directly under the ELSIAA Secretary and reuses that page's language:
  white ground, #1e6b3c accent, black/[0.08] hairlines, the same
  problem -> solution heading pattern.

  Layout differs by size on purpose, and the monitor stays a correct 16:9
  at every width so the frame never reads as a portrait display:

    md+     Before panel pinned left, live system right, module rail inside
            the screen — the contrast is visible in one glance.
    mobile  One view at a time. The Before/After switch and the module rail
            live BELOW the monitor, where they can be 44px tap targets
            instead of 20px rows inside a 193px-tall screen.

  Everything is CSS and SVG — no image or video assets to ship.
*/

const GREEN = "#1e6b3c";

type ModKey = "compliance" | "auth" | "audit" | "fixes" | "assistant";

const MODULES: Array<{ key: ModKey; label: string; short: string }> = [
  { key: "compliance", label: "Compliance", short: "Compliance" },
  { key: "auth", label: "Authorizations", short: "Auth" },
  { key: "audit", label: "Audit", short: "Audit" },
  { key: "fixes", label: "Data fixes", short: "Fixes" },
  { key: "assistant", label: "Assistant", short: "Assistant" },
];

/* Systems the build actually reaches into. The last entry is the point:
   it drives browser-based software that exposes no API at all. */
const INTEGRATIONS = [
  "CentralReach",
  "Email",
  "SMS",
  "Phone",
  "Scheduling",
  "CRM",
  "Cloud storage",
  "Databases",
  "Browser-only systems",
];

/* ─────────────────────────── small shared pieces ─────────────────────────── */

function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-[6px] w-[6px] shrink-0 ${className}`}>
      <span
        className="absolute inset-0 rounded-full motion-safe:animate-ping"
        style={{ background: GREEN, opacity: 0.55, animationDuration: "2.4s" }}
      />
      <span className="relative h-[6px] w-[6px] rounded-full" style={{ background: GREEN }} />
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) {
  const color = tone === "green" ? GREEN : tone === "amber" ? "#d7a13b" : "#111111";
  return (
    <div className="min-w-0 rounded-[5px] border border-black/[0.08] bg-black/[0.02] px-2 py-1.5">
      <p className="truncate text-[8.5px] tracking-[0.06em] text-[#111111]/45 uppercase md:text-[9px]">
        {label}
      </p>
      <p
        className="mt-0.5 truncate text-[12px] font-semibold tabular-nums md:text-[14px]"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}

/* A finding / row inside a module panel. */
function Row({
  title,
  meta,
  right,
  tone = "amber",
  hideOnMobile = false,
}: {
  title: string;
  meta: string;
  right?: string;
  tone?: "amber" | "green" | "mute";
  /* The phone screen is 193px tall — extra rows would only be clipped, so the
     deeper ones exist on md+ where there is room to fill. */
  hideOnMobile?: boolean;
}) {
  const bar = tone === "green" ? GREEN : tone === "amber" ? "#d7a13b" : "rgba(17,17,17,0.18)";
  return (
    <div
      className={`${hideOnMobile ? "hidden md:flex" : "flex"} items-start gap-2 border-t border-black/[0.06] py-[5px] first:border-t-0 md:py-[7px]`}
    >
      <span
        className="mt-[3px] h-[11px] w-[2px] shrink-0 rounded-full md:h-[13px]"
        style={{ background: bar }}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9.5px] leading-tight font-medium text-[#111111]/85 md:text-[11.5px]">
          {title}
        </p>
        <p className="mt-[1px] truncate text-[8.5px] leading-tight text-[#111111]/45 md:text-[10px]">
          {meta}
        </p>
      </div>
      {right && (
        <span
          className="shrink-0 pt-[1px] text-[9px] font-semibold tabular-nums md:text-[11px]"
          style={{ color: GREEN }}
        >
          {right}
        </span>
      )}
    </div>
  );
}

function PanelHead({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <p className="truncate text-[10px] font-semibold tracking-[-0.01em] text-[#111111] md:text-[12px]">
        {title}
      </p>
      <p className="shrink-0 text-[8px] text-[#111111]/40 md:text-[9.5px]">{note}</p>
    </div>
  );
}

/* ───────────────────────────── module panels ───────────────────────────── */

function Compliance({ scanned }: { scanned: number }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead title="Continuous compliance" note="CentralReach · live" />
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Records scanned" value={scanned.toLocaleString()} />
        <Stat label="Open findings" value="3" tone="amber" />
        <Stat label="Auto-resolved" value="27" tone="green" />
      </div>
      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
        <Row
          title="Missing supervision note — BCBA session 04/12"
          meta="Aetna: 1 supervision note per 10 service hrs · assigned M. Torres · due 2d"
        />
        <Row
          title="Treatment plan expires in 9 days — client #4471"
          meta="Blue Cross · renewal packet not started · assigned C. Webb"
        />
        <Row
          title="Session note signed outside 24h window — 3 records"
          meta="Internal policy P-114 · staff notified 11 min ago"
        />
        <Row
          title="Credential expiry — RBT J. Alvarez, 22 days"
          meta="Auto-resolved · renewal task created, supervisor notified"
          tone="green"
        />
        <Row
          title="Diagnosis code missing on intake — client #5311"
          meta="Auto-resolved · pulled from referral packet, verified against payer"
          tone="green"
          hideOnMobile
        />
        <Row
          title="Parent consent unsigned — 2 clients"
          meta="Tricare requires signature before session 1 · front desk notified"
          hideOnMobile
        />
        <Row
          title="Telehealth modifier absent — 8 sessions"
          meta="Auto-resolved · modifier 95 applied, claims re-queued"
          tone="green"
          hideOnMobile
        />
      </div>
    </div>
  );
}

function Authorizations() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead title="Authorization & revenue protection" note="real time" />
      <div className="grid grid-cols-3 gap-1.5">
        <Stat label="Auths tracked" value="128" />
        <Stat label="Under-utilized" value="6" tone="amber" />
        <Stat label="Recoverable" value="$18,400" tone="green" />
      </div>
      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
        <Row
          title="#4471 · 97153 — 312 of 480 units · 65%"
          meta="Root cause: 2 RBTs unassigned since 03/28 · scheduling@ notified"
          right="$9,200"
        />
        <Row
          title="#3902 · 97155 — 61 of 96 units · 64%"
          meta="Root cause: supervision sessions never scheduled · BCBA notified"
          right="$4,100"
        />
        <Row
          title="#5120 · 97153 — 249 of 320 units · 78%"
          meta="Root cause: 6 client cancellations not rescheduled"
          right="$3,100"
        />
        <Row
          title="#2288 · 97151 — 14 of 24 units · 58%"
          meta="Assessment hours expire 04/30 · billing@ notified 6 min ago"
          right="$2,000"
        />
        <Row
          title="#4610 · 97153 — 402 of 440 units · 91%"
          meta="On track · reauthorization packet auto-started 04/14"
          tone="green"
          hideOnMobile
        />
        <Row
          title="#3377 · 97156 — 18 of 24 units · 75%"
          meta="Root cause: parent training sessions declined twice, not rebooked"
          right="$900"
          hideOnMobile
        />
        <Row
          title="#5044 · 97153 — 288 of 300 units · 96%"
          meta="On track · units exhaust in 11 days, renewal already filed"
          tone="green"
          hideOnMobile
        />
      </div>
    </div>
  );
}

function Audit({ verifiedAgo }: { verifiedAgo: string }) {
  const CHECKS: Array<[string, string, boolean]> = [
    ["Documentation complete", "2,146 / 2,146", false],
    ["Encrypted at rest & in transit", "AES-256", false],
    ["HIPAA retention policy", "7 yr · enforced", false],
    ["Access logs complete", "no gaps", false],
    ["Signature chain verified", "2,146 signed", true],
    ["Payer-specific note format", "4 payers · passing", true],
    ["Session times match schedule", "0 discrepancies", true],
    ["PHI stored in approved systems only", "verified", true],
  ];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead title="Audit readiness" note={`full pass ${verifiedAgo}`} />
      <div
        className="flex items-center gap-2 rounded-[5px] border px-2 py-1.5"
        style={{ borderColor: "rgba(46,158,88,0.28)", background: "rgba(46,158,88,0.07)" }}
      >
        <LiveDot />
        <p className="text-[10.5px] font-semibold md:text-[12.5px]" style={{ color: GREEN }}>
          Audit-ready
        </p>
        <p className="ml-auto truncate text-[8.5px] text-[#111111]/45 md:text-[10px]">
          continuously verified
        </p>
      </div>
      <div className="mt-1.5 min-h-0 flex-1 overflow-hidden">
        {CHECKS.map(([k, v, mdOnly]) => (
          <div
            key={k}
            className={`${mdOnly ? "hidden md:flex" : "flex"} items-center gap-2 border-t border-black/[0.06] py-[5px] first:border-t-0 md:py-[6px]`}
          >
            <svg
              viewBox="0 0 12 12"
              className="h-[9px] w-[9px] shrink-0 md:h-[11px] md:w-[11px]"
              aria-hidden
            >
              <path
                d="M2.5 6.4l2.3 2.3 4.7-5"
                fill="none"
                stroke={GREEN}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="min-w-0 flex-1 truncate text-[9.5px] text-[#111111]/80 md:text-[11.5px]">
              {k}
            </p>
            <p className="shrink-0 text-[8.5px] tabular-nums text-[#111111]/45 md:text-[10px]">
              {v}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataFixes() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead title="Data validation & correction" note="deterministic auto · complex routed" />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <div className="min-w-0">
          <p className="mb-1 text-[8px] tracking-[0.08em] text-[#111111]/40 uppercase md:text-[9px]">
            Corrected automatically
          </p>
          <Row
            title="Timesheet overlap — J. Alvarez 04/11"
            meta="trimmed to scheduled window"
            tone="green"
          />
          <Row title="Service location standardized" meta="14 records → 03 (School)" tone="green" />
          <Row title="Invalid NPI format" meta="2 records reformatted" tone="green" />
        </div>
        {/* Human-in-the-loop: below the confidence bar it never self-applies. */}
        <div className="min-w-0">
          <p className="mb-1 text-[8px] tracking-[0.08em] text-[#111111]/40 uppercase md:text-[9px]">
            Awaiting your approval
          </p>
          <div className="rounded-[5px] border border-black/[0.10] bg-black/[0.02] p-1.5">
            <p className="text-[9.5px] leading-tight font-medium text-[#111111]/85 md:text-[11px]">
              Session 04/09 billed 97153 — note describes 97155
            </p>
            <p className="mt-[2px] text-[8.5px] leading-tight text-[#111111]/45 md:text-[10px]">
              Recommend code change. Confidence 71% — below the 90% auto-apply bar, so it waits.
            </p>
            <p className="mt-1 text-[8.5px] text-[#111111]/40 md:text-[9.5px]">
              Routed to Billing Lead · 2 pending
            </p>
            <div className="mt-1.5 flex gap-1">
              <span
                className="rounded-[3px] px-2 py-[3px] text-[8.5px] font-semibold text-white md:text-[10px]"
                style={{ background: GREEN }}
              >
                Approve
              </span>
              <span className="rounded-[3px] border border-black/15 px-2 py-[3px] text-[8.5px] font-semibold text-[#111111]/65 md:text-[10px]">
                Review
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Assistant() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead
        title="Company-trained assistant"
        note="84 policies · 31 templates · 12 payer manuals"
      />
      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        <div className="ml-auto w-fit max-w-[82%] rounded-[6px] rounded-br-[2px] bg-black/[0.04] px-2 py-1.5">
          <p className="text-[9.5px] leading-snug text-[#111111]/80 md:text-[11px]">
            Parent is requesting their child's records. What's our process?
          </p>
        </div>
        <div className="w-fit max-w-[92%] rounded-[6px] rounded-bl-[2px] border border-black/[0.08] bg-black/[0.02] px-2 py-1.5">
          <p className="text-[9.5px] leading-snug text-[#111111]/80 md:text-[11px]">
            Policy P-032: verify guardian on file, then release within 30 days. Records go out
            through the encrypted portal — never email attachment.
          </p>
          <p className="mt-1 text-[8.5px] leading-snug text-[#111111]/45 md:text-[10px]">
            Source: Records Release Policy v4 · HIPAA §164.524
          </p>
          <p className="mt-1 text-[8.5px] font-medium md:text-[10px]" style={{ color: GREEN }}>
            Drafted the response in your clinic's voice — ready to send.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── the manual "before" ─────────────────────────── */

function BeforePanel({ dense = false }: { dense?: boolean }) {
  const PAIN: Array<[string, string, boolean]> = [
    ["Auth utilization checked monthly", "in arrears — after the units expire", false],
    ["3 staff chasing missing notes", "email threads, sticky notes, reminders", false],
    ["Audit prep", "~40 hrs pulled from billable work", false],
    ["Compliance found at claim denial", "not before the session", false],
    ["Payer rules live in people's heads", "4 payers, 4 different note requirements", true],
    ["Timesheet errors caught at payroll", "corrected by hand, one row at a time", true],
  ];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-black/20" />
        <p className="text-[10px] font-semibold text-[#111111]/55 md:text-[12px]">
          Before — manual
        </p>
      </div>

      {/* a spreadsheet, mid-edit, standing in for the whole manual stack */}
      <div className="overflow-hidden rounded-[4px] border border-black/[0.08] bg-black/[0.015]">
        <div className="flex items-center gap-1 border-b border-black/[0.06] px-1.5 py-1">
          <span className="h-[4px] w-[4px] rounded-full bg-black/18" />
          <p className="truncate text-[8px] text-[#111111]/40 md:text-[9px]">
            auth_tracking_APRIL_final_v3.xlsx
          </p>
        </div>
        {[
          ["#4471", "480", "?", "check CR"],
          ["#3902", "96", "?", "ask Dana"],
          ["#5120", "320", "249", ""],
        ].map((r, i) => (
          <div
            key={r[0]}
            className={`grid grid-cols-4 gap-1 px-1.5 py-[3px] text-[8px] tabular-nums md:text-[9.5px] ${
              i % 2 ? "bg-black/[0.015]" : ""
            }`}
          >
            <span className="truncate text-[#111111]/55">{r[0]}</span>
            <span className="truncate text-[#111111]/45">{r[1]}</span>
            <span
              className="truncate"
              style={{ color: r[2] === "?" ? "#d7a13b" : "rgba(255,255,255,0.4)" }}
            >
              {r[2]}
            </span>
            <span className="truncate text-[#111111]/35 italic">{r[3]}</span>
          </div>
        ))}
      </div>

      <div className={`mt-1.5 min-h-0 flex-1 overflow-hidden ${dense ? "" : ""}`}>
        {PAIN.map(([k, v, mdOnly]) => (
          <div
            key={k}
            className={`${mdOnly ? "hidden md:block" : "block"} border-t border-black/[0.06] py-[5px] first:border-t-0 md:py-[6px]`}
          >
            <p className="truncate text-[9.5px] leading-tight text-[#111111]/65 md:text-[11px]">
              {k}
            </p>
            <p className="mt-[1px] truncate text-[8.5px] leading-tight text-[#111111]/40 md:text-[10px]">
              {v}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-1.5 rounded-[4px] border border-[#d7a13b]/25 bg-[#d7a13b]/[0.07] px-2 py-1.5">
        <p className="text-[8px] tracking-[0.06em] text-[#111111]/45 uppercase md:text-[9px]">
          Unbilled — authorizations expiring
        </p>
        <p
          className="mt-0.5 text-[12px] font-semibold tabular-nums md:text-[15px]"
          style={{ color: "#d7a13b" }}
        >
          $18,400
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── system chrome (shared) ───────────────────────── */

function ChromeBar({ pending }: { pending: number }) {
  return (
    <div className="flex items-center gap-2 border-b border-black/[0.08] px-2 py-[5px] md:px-3 md:py-1.5">
      <LiveDot />
      <p className="truncate text-[9px] font-semibold tracking-[-0.01em] text-[#111111] md:text-[11px]">
        ELSIAA Operations
      </p>
      <p className="hidden truncate text-[9px] text-[#111111]/40 sm:block md:text-[10px]">
        CentralReach · connected
      </p>
      <p className="ml-auto shrink-0 text-[8.5px] text-[#111111]/50 md:text-[10px]">
        <span style={{ color: "#d7a13b" }}>{pending}</span> awaiting approval
      </p>
    </div>
  );
}

function IntegrationStrip() {
  return (
    <div className="flex items-center gap-1 overflow-hidden border-t border-black/[0.08] px-2 py-[4px] md:px-3 md:py-[5px]">
      <p className="shrink-0 text-[7.5px] tracking-[0.06em] text-[#111111]/35 uppercase md:text-[8.5px]">
        Connected
      </p>
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
        {INTEGRATIONS.map((n) => (
          <span
            key={n}
            className="shrink-0 rounded-[3px] border border-black/[0.08] px-1.5 py-[1px] text-[7.5px] whitespace-nowrap text-[#111111]/45 md:text-[9px]"
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function ModulePanel({
  mod,
  scanned,
  verifiedAgo,
}: {
  mod: ModKey;
  scanned: number;
  verifiedAgo: string;
}) {
  if (mod === "compliance") return <Compliance scanned={scanned} />;
  if (mod === "auth") return <Authorizations />;
  if (mod === "audit") return <Audit verifiedAgo={verifiedAgo} />;
  if (mod === "fixes") return <DataFixes />;
  return <Assistant />;
}

/* ───────────────────────────── the display ───────────────────────────── */

function Display({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* aluminium frame — thin, uniform, hairline highlight top and bottom */}
      <div
        className="rounded-[14px] p-[6px] md:rounded-[20px] md:p-[9px]"
        style={{
          background: "linear-gradient(180deg,#e8e9e8 0%,#cdd0ce 45%,#b3b7b4 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.16), 0 45px 90px -55px rgba(17,17,17,0.45)",
        }}
      >
        <div
          /* 16:9 — the real Pro Display XDR and Studio Display ratio. */
          className="relative aspect-[16/9] overflow-hidden rounded-[9px] ring-1 ring-inset ring-black/[0.09] md:rounded-[13px]"
          style={{ background: "linear-gradient(180deg,#ffffff,#f7f8f6)" }}
        >
          {children}
          {/* glass sheen — a narrow band only. On a light screen anything
              stronger washes the content underneath it. */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(118deg, rgba(255,255,255,0.5), transparent 16%)",
            }}
          />
        </div>
      </div>
      {/* stand — neck flares into a wide flat foot */}
      <div
        className="mx-auto h-6 w-[64px] md:h-9 md:w-[92px]"
        style={{
          background: "linear-gradient(90deg,#b7bab8,#dcdedc 26%,#e9eae9 50%,#dcdedc 74%,#b7bab8)",
          clipPath: "polygon(16% 0, 84% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        className="mx-auto h-[7px] w-[150px] rounded-[4px] md:h-[9px] md:w-[230px]"
        style={{
          background: "linear-gradient(180deg,#e4e6e4,#c2c5c3 60%,#a9adaa)",
          boxShadow: "0 14px 22px -12px rgba(17,17,17,0.4)",
        }}
      />
    </div>
  );
}

/* ─────────────────────────────── the block ─────────────────────────────── */

export function AbaOperations() {
  const [mod, setMod] = useState<ModKey>("compliance");
  const [view, setView] = useState<"before" | "after">("after");

  /* Live-ish counters. Seeded with fixed values so SSR and the first client
     render agree, then they start moving once mounted. */
  const [scanned, setScanned] = useState(4812);
  const [mins, setMins] = useState(6);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const a = setInterval(() => setScanned((n) => n + 1 + Math.floor(n % 3)), 3200);
    const b = setInterval(() => setMins((m) => (m >= 14 ? 1 : m + 1)), 9000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);
  const verifiedAgo = `${mins} min ago`;

  /* Roving arrow keys across the module rail, as a real tablist behaves. */
  const railRef = useRef<HTMLDivElement | null>(null);
  const onRailKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = MODULES.findIndex((m) => m.key === mod);
    const next =
      e.key === "ArrowRight" ? (i + 1) % MODULES.length : (i - 1 + MODULES.length) % MODULES.length;
    setMod(MODULES[next]!.key);
    railRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };

  return (
    <section id="aba-operations" className="scroll-mt-[136px] px-4 pt-7 md:px-6 md:pt-10">
      <div className="mx-auto max-w-6xl">
        <p
          className="text-center text-[13px] font-semibold tracking-[0.02em]"
          style={{ color: GREEN }}
        >
          02 · ABA Operations Automation
        </p>
        <h2 className="mt-1.5 text-center text-[15px] font-semibold tracking-[-0.01em] md:text-[16px]">
          <span className="text-[#111111]/50">Manual compliance &amp; lost revenue</span>
          <span className="px-2" style={{ color: GREEN }}>
            →
          </span>
          <span className="text-[#111111]">Continuous protection</span>
        </h2>
      </div>

      <div className="mx-auto mt-3 max-w-6xl md:mt-4">
        <Display>
          <div className="flex h-full flex-col">
            <ChromeBar pending={2} />

            {/* ── md+ : before pinned left, live system right ── */}
            <div className="hidden min-h-0 flex-1 md:flex">
              <div className="w-[32%] min-w-0 border-r border-black/[0.08] p-2.5">
                <BeforePanel />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div
                  ref={railRef}
                  role="tablist"
                  aria-label="ELSIAA Operations modules"
                  onKeyDown={onRailKey}
                  className="flex shrink-0 items-center gap-0.5 border-b border-black/[0.08] px-2"
                >
                  {MODULES.map((m) => {
                    const on = m.key === mod;
                    return (
                      <button
                        key={m.key}
                        role="tab"
                        type="button"
                        aria-selected={on}
                        tabIndex={on ? 0 : -1}
                        onClick={() => setMod(m.key)}
                        className="relative px-2 py-[7px] text-[10.5px] font-medium transition-colors"
                        style={{ color: on ? "#111111" : "rgba(17,17,17,0.45)" }}
                      >
                        {m.label}
                        {on && (
                          <span
                            className="absolute inset-x-1.5 -bottom-px h-[1.5px] rounded-full"
                            style={{ background: GREEN }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="min-h-0 flex-1 p-2.5">
                  <ModulePanel mod={mod} scanned={scanned} verifiedAgo={verifiedAgo} />
                </div>
              </div>
            </div>

            {/* ── mobile : one view, driven from the controls below ── */}
            <div className="min-h-0 flex-1 p-2 md:hidden">
              {view === "before" ? (
                <BeforePanel dense />
              ) : (
                <ModulePanel mod={mod} scanned={scanned} verifiedAgo={verifiedAgo} />
              )}
            </div>

            <IntegrationStrip />
          </div>
        </Display>
      </div>

      {/* Mobile controls. Outside the glass so they can be real tap targets —
          inside a 214px-tall screen they would be 20px rows. */}
      <div className="mx-auto mt-3 max-w-6xl md:hidden">
        <div className="flex rounded-full border border-black/[0.10] p-[3px]">
          {(["before", "after"] as const).map((v) => {
            const on = view === v;
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => setView(v)}
                className="min-h-[40px] flex-1 rounded-full text-[13px] font-semibold transition-colors"
                style={{
                  background: on ? GREEN : "transparent",
                  color: on ? "#fff" : "rgba(17,17,17,0.55)",
                }}
              >
                {v === "before" ? "Before — manual" : "ELSIAA system"}
              </button>
            );
          })}
        </div>

        {view === "after" && (
          <div
            role="tablist"
            aria-label="ELSIAA Operations modules"
            className="mt-2 flex snap-x snap-mandatory gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {MODULES.map((m) => {
              const on = m.key === mod;
              return (
                <button
                  key={m.key}
                  role="tab"
                  type="button"
                  aria-selected={on}
                  onClick={() => setMod(m.key)}
                  className="min-h-[44px] shrink-0 snap-start rounded-full border px-4 text-[13px] font-medium transition-colors"
                  /* Ink on the tint, not white — white on a 14% green wash is
                     only 3.4:1. */
                  style={{
                    borderColor: on ? GREEN : "rgba(17,17,17,0.14)",
                    color: on ? GREEN : "rgba(17,17,17,0.55)",
                    background: on ? "rgba(30,107,60,0.10)" : "transparent",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
