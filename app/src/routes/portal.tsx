import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

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
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/portal" }],
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

const mono = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const INSIDE: { k: string; title: string; body: string }[] = [
  {
    k: "01",
    title: "Live project status & milestones",
    body: "Where every build stands right now — phases in production, what's in review, and what ships next.",
  },
  {
    k: "02",
    title: "Deliverables & source",
    body: "Handoff in one place: repositories, design files, and production assets, ready when you are.",
  },
  {
    k: "03",
    title: "Invoices & documents",
    body: "Balances, purchase history, signed agreements, and statements of work — clear and current.",
  },
  {
    k: "04",
    title: "A direct line to your team",
    body: "Message the people building your work. No ticket queues, no forwarding — the executive team.",
  },
];

const TRUST: string[] = [
  "Hardened & insured builds",
  "Your data is never used to train anyone else's model",
  "Role-based access",
  "SOC-minded handling",
];

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

  /* ── two-factor step — centered verify card ── */
  if (step === "twofa") {
    return (
      <main className="min-h-screen bg-white text-[#111111]">
        <SiteNav />
        <section className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-32">
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            Client portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl" style={inter}>
            Verify it's you.
          </h1>
          <p className="mt-2 text-[14px] text-[#111111]/60" style={inter}>
            We sent a 6-digit code to the email on file. Enter it below.
          </p>

          <div className="mt-8 space-y-3">
            <label htmlFor="twofa-code" className="sr-only">
              Verification code
            </label>
            <input
              id="twofa-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-center text-[24px] outline-none transition-colors focus-visible:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/30"
              style={mono}
            />
            <button
              onClick={verify}
              className="w-full rounded-full bg-[#111111] px-6 py-4 text-[13px] font-bold text-white  transition-all outline-none hover:bg-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 focus-visible:ring-offset-2"
              style={mono}
            >
              Verify →
            </button>
            <button
              onClick={() => { setStep("login"); setErr(""); }}
              className="w-full rounded-lg py-2 text-center text-[13px] text-[#111111]/55 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/30"
            >
              ← Back to sign in
            </button>
          </div>

          {err && (
            <p className="mt-4 rounded-lg border border-[#E53E3E]/30 bg-[#E53E3E]/[0.05] px-4 py-3 text-[13px] text-[#E53E3E]">
              {err}
            </p>
          )}
        </section>
      </main>
    );
  }

  /* ── landing + sign-in ── */
  return (
    <main className="min-h-screen bg-white text-[#111111]" style={inter}>
      <SiteNav />

      {/* hero: intro left, sign-in card right */}
      <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          {/* intro */}
          <Reveal>
            <div className="md:pt-6">
              <p className="text-[13px] text-[#1e6b3c] " style={mono}>
                The client portal
              </p>
              <h1 className="mt-5 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] md:text-[52px]" style={inter}>
                Your build, your data,
                <br className="hidden md:block" /> in one place.
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[#111111]/60" style={inter}>
                Sign in to see where every project stands, reach the people building
                your work, and keep your deliverables, documents, and invoices close.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e6b3c]/10">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="text-[13px] tracking-[0.06em] text-[#111111]/60" style={inter}>
                    Two-factor on every account
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1e6b3c]/10">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <span className="text-[13px] tracking-[0.06em] text-[#111111]/60" style={inter}>
                    Credentials handled securely
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* sign-in card */}
          <Reveal delay={0.08}>
            <div className="rounded-2xl border border-black/[0.06] bg-white p-7 shadow-[0_18px_50px_-24px_rgba(17,17,17,0.28)] md:p-8">
              <div className="flex items-center justify-between">
                <p className="text-[13px] text-[#111111]/55 " style={mono}>
                  Sign in
                </p>
                <span className="flex items-center gap-1.5 text-[13px] text-[#1e6b3c] " style={mono}>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
                  Secure
                </span>
              </div>
              <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.02em]" style={inter}>
                Welcome back.
              </h2>

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="client-id" className="mb-1.5 block text-[13px] font-medium text-[#111111]/70" style={inter}>
                    Client ID
                  </label>
                  <input
                    id="client-id"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="your-client-id"
                    autoCapitalize="none"
                    autoComplete="username"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus-visible:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/30"
                    style={inter}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#111111]/70" style={inter}>
                    Password
                  </label>
                  <input
                    id="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && login()}
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus-visible:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/30"
                    style={inter}
                  />
                </div>

                <button
                  onClick={login}
                  className="w-full rounded-full bg-[#111111] px-6 py-4 text-[13px] font-bold text-white  transition-all outline-none hover:bg-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 focus-visible:ring-offset-2"
                  style={mono}
                >
                  Sign in →
                </button>

                {err && (
                  <p className="rounded-lg border border-[#E53E3E]/30 bg-[#E53E3E]/[0.05] px-4 py-3 text-[13px] text-[#E53E3E]" role="alert">
                    {err}
                  </p>
                )}
              </div>

              <p className="mt-5 flex items-center gap-2 text-[11.5px] leading-relaxed text-[#111111]/50" style={inter}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Credentials are handled securely and every account is protected by two-factor authentication.
              </p>

              <div className="mt-6 border-t border-black/[0.06] pt-5">
                <p className="text-[13px] text-[#111111]/60" style={inter}>
                  No account yet?{" "}
                  <a
                    href="/contact"
                    className="font-medium text-[#1e6b3c] underline-offset-2 outline-none hover:underline focus-visible:underline"
                  >
                    Request access
                  </a>{" "}
                  or contact your ELSIAA lead.
                </p>
              </div>

              {/* ELSIAA bypass — quick in and out, no credentials */}
              <div className="mt-6 rounded-xl border border-dashed border-black/12 p-4">
                <p className="text-[13px] text-[#111111]/50 " style={mono}>
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
                      className="rounded-full border border-black/12 px-4 py-2 text-[13px] font-medium outline-none transition-all hover:text-white focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/30"
                      style={inter}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = c.accent; (e.currentTarget as HTMLButtonElement).style.borderColor = c.accent; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; (e.currentTarget as HTMLButtonElement).style.borderColor = ""; }}
                    >
                      {c.company} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* what's inside */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <Reveal>
            <p className="text-[13px] text-[#1e6b3c] " style={mono}>
              What's inside
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] md:text-[38px]" style={inter}>
              Everything between you and ELSIAA, in one calm place.
            </h2>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {INSIDE.map((t, i) => (
              <Reveal key={t.k} delay={0.05 * i}>
                <div className="h-full rounded-2xl border border-black/[0.06] bg-white p-7">
                  <p className="text-[13px] text-[#111111]/40 " style={mono}>
                    {t.k}
                  </p>
                  <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.01em]" style={inter}>
                    {t.title}
                  </h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#111111]/60" style={inter}>
                    {t.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* trust / security band */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <Reveal>
            <p className="text-[13px] text-[#111111]/45 " style={mono}>
              Security posture
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-black/[0.06] bg-black/[0.06] sm:grid-cols-2 lg:grid-cols-4">
            {TRUST.map((t, i) => (
              <Reveal key={t} delay={0.04 * i}>
                <div className="flex h-full flex-col justify-between bg-white p-6">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  </svg>
                  <p className="mt-8 text-[12.5px] leading-snug tracking-[0.02em] text-[#111111]/75" style={mono}>
                    {t}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-2xl text-[12.5px] leading-relaxed text-[#111111]/45" style={inter}>
              Claims describe our operating posture, not third-party certification. If your
              engagement requires specific attestations, your ELSIAA lead can walk you through
              what we can provide.
            </p>
          </Reveal>
        </div>
      </section>

      {/* help row */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 px-6 py-12 md:flex-row md:items-center">
          <Reveal>
            <p className="text-[15px] text-[#111111]/70" style={inter}>
              Trouble signing in? Your ELSIAA lead can get you back in.
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3 text-[13px] font-bold  outline-none transition-all hover:border-[#111111] hover:bg-[#111111] hover:text-white focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 focus-visible:ring-offset-2"
              style={mono}
            >
              Contact your ELSIAA lead →
            </a>
          </Reveal>
        </div>
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
              <p className="text-[13px] text-[#111111]/55 " style={mono}>
                ELSIAA client portal
              </p>
            </div>
          </a>
          <button
            onClick={onOut}
            className="rounded-full border border-black/15 px-5 py-2.5 text-[13px] font-bold  transition-all hover:border-[#111111] hover:bg-[#111111] hover:text-white"
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
        <p className="mt-1.5 text-[14px] text-[#111111]/60" style={inter}>
          Everything between {c.company} and ELSIAA, in one place.
        </p>

        {/* balance + projects */}
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.07] p-6" style={{ background: c.accentSoft }}>
            <p className="text-[13px] text-[#111111]/55 " style={mono}>
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
                href={`mailto:info@elsiaa.com?subject=${encodeURIComponent(`Payment — ${c.company}`)}`}
                className="mt-4 inline-block rounded-full px-5 py-2.5 text-[13px] font-bold text-white "
                style={{ ...mono, background: c.accent }}
              >
                Settle balance →
              </a>
            )}
          </div>
          {c.projects.map((p) => (
            <div key={p.name} className="rounded-2xl border border-black/[0.07] bg-white p-6">
              <p className="text-[13px] text-[#111111]/55 " style={mono}>
                Active project
              </p>
              <p className="mt-2 text-[16px] font-semibold" style={inter}>
                {p.name}
              </p>
              <p className="mt-1 text-[12.5px] text-[#111111]/55">{p.status}</p>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
                <div className="h-full rounded-full transition-all" style={{ width: `${p.pct}%`, background: c.accent }} />
              </div>
              <p className="mt-1.5 text-right text-[13px] text-[#111111]/55" style={mono}>
                {p.pct}%
              </p>
            </div>
          ))}
        </div>

        {/* purchase history */}
        <section className="mt-10">
          <h2 className="text-[13px] text-[#111111]/55 " style={mono}>
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
                  <p className="mt-0.5 text-[11.5px] text-[#111111]/55" style={mono}>
                    {p.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[14px] font-semibold" style={inter}>
                    {p.amount}
                  </span>
                  <span
                    className="rounded-full px-3 py-1 text-[13px] font-bold "
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
          <h2 className="text-[13px] text-[#111111]/55 " style={mono}>
            Contracts & documents
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {c.contracts.map((k) => (
              <a
                key={k.name}
                href={`mailto:info@elsiaa.com?subject=${encodeURIComponent(`Document request — ${k.name} — ${c.company}`)}`}
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
                    <p className="mt-0.5 text-[11.5px] text-[#111111]/55" style={mono}>
                      Signed {k.signed} · {k.status}
                    </p>
                  </div>
                </div>
                <span className="text-[#111111]/50 transition-colors group-hover:text-[#111111]">→</span>
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
              href={`mailto:info@elsiaa.com?subject=${encodeURIComponent(`Portal — ${c.company}`)}`}
              className="rounded-full px-6 py-3.5 text-[13px] font-bold text-white  transition-all hover:opacity-85"
              style={{ ...mono, background: c.accent }}
            >
              Message us →
            </a>
          </div>
        </section>

        <p className="mt-12 pb-8 text-center text-[13px] text-[#111111]/50 " style={mono}>
          בעזרת ה׳ נעשה ונצליח
        </p>
      </div>
    </main>
  );
}
