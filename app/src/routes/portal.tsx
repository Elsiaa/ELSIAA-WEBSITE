import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Client Portal — ELSIAA" },
      { name: "robots", content: "noindex" },
      {
        name: "description",
        content: "Secure client portal — balances, purchase history, contracts, and project updates.",
      },
    ],
  }),
  component: Portal,
});

/* ─────────────────────────────────────────────────────────
   Client records — preview scaffold.
   Passwords stored as SHA-256; real auth moves server-side
   with the production backend.
   Demo password for every account: elsiaa2026
   2FA preview code: 111111 (real delivery wires in with backend)
   ───────────────────────────────────────────────────────── */
type Purchase = { date: string; item: string; amount: string; status: "Paid" | "Due" | "Processing" };
type Contract = { name: string; signed: string; status: "Active" | "Complete" | "In review" };
type Client = {
  id: string;
  company: string;
  first: string;
  accent: string;
  accentSoft: string;
  initials: string;
  balance: string;
  balanceNote: string;
  purchases: Purchase[];
  contracts: Contract[];
  projects: { name: string; status: string; pct: number }[];
};

const PASS_HASH = "2f9ac78eae85adf2da6ef7a4652eb8ecd689af238edd0be1727efe0698925664"; // elsiaa2026

const CLIENTS: Record<string, Client> = {
  dialog: {
    id: "dialog",
    company: "Dialog Healthcare",
    first: "Esther",
    accent: "#0e7490",
    accentSoft: "rgba(14,116,144,0.08)",
    initials: "DH",
    balance: "$0.00",
    balanceNote: "Account current — thank you.",
    purchases: [
      { date: "Jun 2026", item: "Website revitalization — Phase II", amount: "$4,800", status: "Paid" },
      { date: "Apr 2026", item: "Brand & marketing system", amount: "$2,400", status: "Paid" },
      { date: "Feb 2026", item: "Website revitalization — Phase I", amount: "$3,600", status: "Paid" },
    ],
    contracts: [
      { name: "Master Services Agreement", signed: "Feb 2026", status: "Active" },
      { name: "Phase II Statement of Work", signed: "May 2026", status: "Active" },
    ],
    projects: [
      { name: "Site relaunch", status: "In production", pct: 82 },
      { name: "Intake automation", status: "Scoping", pct: 15 },
    ],
  },
  psi: {
    id: "psi",
    company: "PSI Construction",
    first: "Team PSI",
    accent: "#b45309",
    accentSoft: "rgba(180,83,9,0.08)",
    initials: "PS",
    balance: "$1,200.00",
    balanceNote: "Invoice #014 due Aug 1.",
    purchases: [
      { date: "Jul 2026", item: "Website redesign — final milestone", amount: "$1,200", status: "Due" },
      { date: "May 2026", item: "Website redesign — milestone 2", amount: "$1,200", status: "Paid" },
      { date: "Mar 2026", item: "Website redesign — milestone 1", amount: "$1,200", status: "Paid" },
    ],
    contracts: [
      { name: "Website Redesign Agreement", signed: "Mar 2026", status: "Active" },
    ],
    projects: [{ name: "psiconstructionpa.com", status: "Final review", pct: 94 }],
  },
  mrbins: {
    id: "mrbins",
    company: "Mr. Bins",
    first: "Isya",
    accent: "#1d4ed8",
    accentSoft: "rgba(29,78,216,0.08)",
    initials: "MB",
    balance: "$0.00",
    balanceNote: "Account current — thank you.",
    purchases: [
      { date: "Jul 2026", item: "Multi-page site build", amount: "$5,200", status: "Paid" },
      { date: "Jun 2026", item: "Brand film & product staging", amount: "$1,800", status: "Paid" },
    ],
    contracts: [
      { name: "Design & Build Agreement", signed: "Jun 2026", status: "Active" },
      { name: "Content License", signed: "Jun 2026", status: "Complete" },
    ],
    projects: [{ name: "mrbins site", status: "Live — iterating", pct: 100 }],
  },
};

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "'Inter', sans-serif" } as const;

function Portal() {
  const [step, setStep] = useState<"login" | "twofa" | "dash">("login");
  const [clientId, setClientId] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const client = CLIENTS[clientId];

  // bypass for HTML preview: /portal?bypass=<clientid|1>
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const b = p.get("bypass") || p.get("demo");
    if (b) {
      setClientId(CLIENTS[b] ? b : "dialog");
      setStep("dash");
    }
  }, []);

  const login = async () => {
    setErr("");
    const c = CLIENTS[clientId.trim().toLowerCase()];
    if (!c) return setErr("Unknown client ID.");
    if ((await sha256(pw)) !== PASS_HASH) return setErr("Incorrect password.");
    setClientId(c.id);
    setStep("twofa");
  };

  const verify = () => {
    setErr("");
    if (code.trim() !== "111111") return setErr("Invalid code — check the message we sent you.");
    setStep("dash");
  };

  if (step === "dash" && client) return <Dashboard c={client} onOut={() => { setStep("login"); setPw(""); setCode(""); }} />;

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-32">
        <p className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase" style={mono}>
          Client portal
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
          {step === "login" ? "Sign in." : "Verify it's you."}
        </h1>
        <p className="mt-2 text-[14px] text-[#111111]/50" style={inter}>
          {step === "login"
            ? "Balances, purchase history, contracts, and live project status."
            : "We sent a 6-digit code to the email on file. Enter it below."}
        </p>

        {step === "login" ? (
          <div className="mt-8 space-y-3">
            <input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Client ID"
              autoCapitalize="none"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#1e6b3c]"
            />
            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              type="password"
              placeholder="Password"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none transition-colors focus:border-[#1e6b3c]"
            />
            <button
              onClick={login}
              className="w-full rounded-full bg-[#111111] px-6 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#1e6b3c]"
              style={mono}
            >
              Continue →
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              inputMode="numeric"
              placeholder="••••••"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-center text-[24px] tracking-[0.5em] outline-none transition-colors focus:border-[#1e6b3c]"
              style={mono}
            />
            <button
              onClick={verify}
              className="w-full rounded-full bg-[#111111] px-6 py-4 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:bg-[#1e6b3c]"
              style={mono}
            >
              Verify →
            </button>
            <button
              onClick={() => setStep("login")}
              className="w-full text-center text-[12px] text-[#111111]/45 hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        )}

        {err && <p className="mt-4 rounded-lg border border-[#E53E3E]/30 bg-[#E53E3E]/[0.05] px-4 py-3 text-[13px] text-[#E53E3E]">{err}</p>}

        {/* ELSIAA bypass — quick in and out, no credentials */}
        <div className="mt-10 rounded-xl border border-dashed border-black/15 p-4">
          <p className="text-[10px] tracking-[0.24em] text-[#111111]/40 uppercase" style={mono}>
            ELSIAA bypass
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {Object.values(CLIENTS).map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setClientId(c.id);
                  setStep("dash");
                }}
                className="rounded-full border border-black/12 px-4 py-2 text-[11px] font-medium transition-all hover:text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = c.accent; (e.currentTarget as HTMLButtonElement).style.borderColor = c.accent; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = ""; }}
              >
                {c.company} →
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 text-[11.5px] leading-relaxed text-[#111111]/35" style={inter}>
          Trouble signing in? Email{" "}
          <a className="underline" href="mailto:isya@elsiaa.com">
            isya@elsiaa.com
          </a>
          . Two-factor authentication protects every account.
        </p>
      </section>
    </main>
  );
}

/* ───────────────────────── dashboard ───────────────────────── */
function Dashboard({ c, onOut }: { c: Client; onOut: () => void }) {
  const due = useMemo(() => c.purchases.some((p) => p.status === "Due"), [c]);
  return (
    <main className="min-h-screen bg-white text-[#111111]">
      {/* themed header — custom to each client */}
      <header className="border-b border-black/[0.06]" style={{ background: c.accentSoft }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[13px] font-bold text-white"
              style={{ ...mono, background: c.accent }}
            >
              {c.initials}
            </span>
            <div>
              <p className="text-[14px] font-semibold leading-tight" style={inter}>
                {c.company}
              </p>
              <p className="text-[10px] tracking-[0.24em] text-[#111111]/40 uppercase" style={mono}>
                ELSIAA client portal
              </p>
            </div>
          </a>
          <button
            onClick={onOut}
            className="rounded-full border border-black/15 px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-all hover:border-[#111111] hover:bg-[#111111] hover:text-white"
            style={mono}
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* welcome — by first name */}
        <h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>
          Welcome back, <span style={{ color: c.accent }}>{c.first}</span>.
        </h1>
        <p className="mt-1.5 text-[14px] text-[#111111]/50" style={inter}>
          Everything between {c.company} and ELSIAA, in one place.
        </p>

        {/* balance + projects */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.07] p-6" style={{ background: c.accentSoft }}>
            <p className="text-[10px] tracking-[0.24em] text-[#111111]/45 uppercase" style={mono}>
              Current balance
            </p>
            <p className="mt-2 text-4xl font-semibold tracking-[-0.03em]" style={{ ...inter, color: due ? "#E53E3E" : c.accent }}>
              {c.balance}
            </p>
            <p className="mt-1.5 text-[12.5px] text-[#111111]/55" style={inter}>
              {c.balanceNote}
            </p>
            {due && (
              <a
                href={`mailto:isya@elsiaa.com?subject=${encodeURIComponent(`Payment — ${c.company}`)}`}
                className="mt-4 inline-block rounded-full px-5 py-2.5 text-[10px] font-bold tracking-[0.2em] text-white uppercase"
                style={{ ...mono, background: c.accent }}
              >
                Settle balance →
              </a>
            )}
          </div>
          {c.projects.map((p) => (
            <div key={p.name} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <p className="text-[10px] tracking-[0.24em] text-[#111111]/45 uppercase" style={mono}>
                Active project
              </p>
              <p className="mt-2 text-[16px] font-semibold" style={inter}>
                {p.name}
              </p>
              <p className="mt-1 text-[12.5px] text-[#111111]/55">{p.status}</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: c.accent }} />
              </div>
              <p className="mt-1.5 text-right text-[11px] text-[#111111]/40" style={mono}>
                {p.pct}%
              </p>
            </div>
          ))}
        </div>

        {/* purchase history */}
        <section className="mt-10">
          <h2 className="text-[11px] tracking-[0.28em] text-[#111111]/40 uppercase" style={mono}>
            Purchase history
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-black/[0.07]">
            {c.purchases.map((p, i) => (
              <div
                key={p.item}
                className={`flex flex-wrap items-center justify-between gap-2 px-5 py-4 ${i > 0 ? "border-t border-black/[0.05]" : ""}`}
              >
                <div>
                  <p className="text-[14px] font-medium" style={inter}>
                    {p.item}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#111111]/40" style={mono}>
                    {p.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold" style={inter}>
                    {p.amount}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.16em] uppercase"
                    style={{
                      ...mono,
                      color: p.status === "Due" ? "#E53E3E" : c.accent,
                      background: p.status === "Due" ? "rgba(229,62,62,0.08)" : c.accentSoft,
                    }}
                  >
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* contracts */}
        <section className="mt-10">
          <h2 className="text-[11px] tracking-[0.28em] text-[#111111]/40 uppercase" style={mono}>
            Contracts & documents
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {c.contracts.map((k) => (
              <a
                key={k.name}
                href={`mailto:isya@elsiaa.com?subject=${encodeURIComponent(`Document request — ${k.name} — ${c.company}`)}`}
                className="group flex items-center justify-between rounded-2xl border border-black/[0.07] bg-white p-5 transition-all hover:-translate-y-0.5"
                style={{ borderColor: undefined }}
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: c.accentSoft }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.accent} strokeWidth="1.8" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[14px] font-medium" style={inter}>
                      {k.name}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-[#111111]/40" style={mono}>
                      Signed {k.signed} · {k.status}
                    </p>
                  </div>
                </div>
                <span className="text-[#111111]/30 transition-colors group-hover:text-[#111111]">→</span>
              </a>
            ))}
          </div>
        </section>

        {/* concierge */}
        <section className="mt-10 rounded-2xl p-7 text-white" style={{ background: "#0c0c0c" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[16px] font-semibold" style={inter}>
                Need anything, {c.first}?
              </p>
              <p className="mt-1 text-[13px] text-white/55" style={inter}>
                Your account is handled directly by the executive team — no ticket queues.
              </p>
            </div>
            <a
              href={`mailto:isya@elsiaa.com?subject=${encodeURIComponent(`Portal — ${c.company}`)}`}
              className="rounded-full px-6 py-3.5 text-[10px] font-bold tracking-[0.22em] text-white uppercase transition-all hover:opacity-85"
              style={{ ...mono, background: c.accent }}
            >
              Message us →
            </a>
          </div>
        </section>

        <p className="mt-12 pb-8 text-center text-[11px] tracking-[0.2em] text-[#111111]/30 uppercase" style={mono}>
          בעזרת ה׳ נעשה ונצליח
        </p>
      </div>
    </main>
  );
}
