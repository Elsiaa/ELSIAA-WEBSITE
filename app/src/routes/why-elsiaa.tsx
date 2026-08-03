import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { absoluteUrl } from "../lib/site-url";

/*
  Why ELSIAA — the corporate case, stated plainly.
  Dark, precise, restrained: matches the /automate brand-lock (bg #070907,
  offices line, the Hebrew phrase) and answers the one real objection —
  "why not just use the big AI tools myself?" — without hype.
*/

export const Route = createFileRoute("/why-elsiaa")({
  head: () => ({
    meta: [
      { title: "Why ELSIAA — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "You know your business best — that's exactly why we partner with you. You teach us your process; we turn it into insured, production-ready systems and upgrade your business daily.",
      },
      { property: "og:title", content: "Why ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/why-elsiaa") }],
  }),
  component: WhyElsiaaPage,
});

const SANS =
  "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";
const HEBREW = "בעזרת ה׳ נעשה ונצליח";

/* Monochrome glyphs of the tools everyone knows — nominal, low-key, secondary. */
function AiMark({ kind }: { kind: "openai" | "claude" | "gemini" | "meta" | "grok" }) {
  const cls = "h-6 w-6 md:h-7 md:w-7";
  if (kind === "openai") {
    // hexagonal knot approximation — six petals
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse key={i} cx="12" cy="7.2" rx="2.5" ry="5.2" transform={`rotate(${i * 60} 12 12)`} />
        ))}
      </svg>
    );
  }
  if (kind === "claude") {
    // the Claude starburst
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="12" y1="12" x2={12 + 8 * Math.cos((i * Math.PI) / 6)} y2={12 + 8 * Math.sin((i * Math.PI) / 6)} />
        ))}
      </svg>
    );
  }
  if (kind === "gemini") {
    // four-point sparkle
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
        <path d="M12 2c.6 5.4 4.6 9.4 10 10-5.4.6-9.4 4.6-10 10-.6-5.4-4.6-9.4-10-10 5.4-.6 9.4-4.6 10-10z" />
      </svg>
    );
  }
  if (kind === "meta") {
    // the Meta loop
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 16c0-4.5 2-9 4.6-9C10.5 7 13 17 16.4 17 19 17 21 12.5 21 8" strokeLinecap="round" />
      </svg>
    );
  }
  // grok / xAI
  return (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

const AI_TOOLS: Array<{ kind: "openai" | "claude" | "gemini" | "meta" | "grok"; name: string }> = [
  { kind: "openai", name: "ChatGPT" },
  { kind: "claude", name: "Claude" },
  { kind: "gemini", name: "Gemini" },
  { kind: "meta", name: "Meta AI" },
  { kind: "grok", name: "Grok" },
];

/* Corporate reason icons — restrained line art, emerald on dark. */
function ReasonArt({ kind }: { kind: string }) {
  const p = { width: 44, height: 44, viewBox: "0 0 44 44", fill: "none", stroke: "#1e6b3c", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (kind) {
    case "insured":
      return (
        <svg {...p} aria-hidden>
          <path d="M22 5l13 5v9c0 8.5-5.5 14.5-13 18-7.5-3.5-13-9.5-13-18v-9l13-5z" />
          <path d="M16 22l4.5 4.5L29 18" />
        </svg>
      );
    case "leaks":
      return (
        <svg {...p} aria-hidden>
          <rect x="8" y="17" width="28" height="19" rx="4" />
          <path d="M14 17v-4a8 8 0 0116 0v4" />
          <circle cx="22" cy="26" r="2.6" />
          <line x1="22" y1="28.5" x2="22" y2="31.5" />
        </svg>
      );
    case "bugs":
      return (
        <svg {...p} aria-hidden>
          <ellipse cx="22" cy="25" rx="9" ry="11" />
          <path d="M22 14v-4M13 25H6M38 25h-7M15 16l-4-4M29 16l4-4M15 33l-5 4M29 33l5 4" />
          <line x1="22" y1="19" x2="22" y2="31" />
        </svg>
      );
    case "hacks":
      return (
        <svg {...p} aria-hidden>
          <rect x="7" y="9" width="30" height="22" rx="3" />
          <path d="M14 16l5 4-5 4M22 26h8" />
          <path d="M17 36h10M22 31v5" />
        </svg>
      );
    case "hipaa":
      return (
        <svg {...p} aria-hidden>
          <rect x="10" y="7" width="24" height="30" rx="3" />
          <path d="M17 7.5V6a3 3 0 013-3h4a3 3 0 013 3v1.5" />
          <path d="M22 15v10M17 20h10" />
          <path d="M16 31h12" strokeOpacity="0.6" />
        </svg>
      );
    default: // team
      return (
        <svg {...p} aria-hidden>
          <circle cx="15" cy="15" r="5" />
          <circle cx="30" cy="17" r="4" />
          <path d="M6 34c0-5.5 4-9 9-9s9 3.5 9 9M24 34c.5-4.5 3-7.5 7-7.5 3.4 0 6 2.2 7 5.5" />
        </svg>
      );
  }
}

const REASONS: Array<{ num: string; kind: string; title: string; body: string; solo: string }> = [
  {
    num: "01",
    kind: "leaks",
    title: "Your data stays yours",
    body: "Client data is isolated, encrypted, and never used to train any model. We decide exactly what the AI can see — and what it never can.",
    solo: "Going solo: an employee pastes your customer list into a public chatbot. It is now outside your control and possibly in the next training run.",
  },
  {
    num: "02",
    kind: "bugs",
    title: "Protected against bugs",
    body: "Every system is tested, monitored, and maintained by engineers. Failures are caught in staging — not by your customers.",
    solo: "Going solo: AI-generated code with a silent bug quietly corrupts three months of invoices before anyone notices.",
  },
  {
    num: "03",
    kind: "hacks",
    title: "Hardened against hacks",
    body: "Keys, permissions, and infrastructure locked to professional standards and kept patched as threats evolve.",
    solo: "Going solo: one exposed API key in a script and an attacker runs up your accounts — or walks through your systems.",
  },
  {
    num: "04",
    kind: "hipaa",
    title: "HIPAA & compliance ready",
    body: "Healthcare groups run on ELSIAA systems because we build to regulatory standards: HIPAA-conscious architecture, audit trails, retention rules.",
    solo: "Going solo: an untracked AI tool touches patient data. That is a reportable breach, federal fines, and a headline.",
  },
  {
    num: "05",
    kind: "insured",
    title: "Fully insured",
    body: "Every engagement is insured for real business use. If it runs your operation, it carries coverage — not a disclaimer.",
    solo: "Going solo: when a DIY automation makes a costly mistake, there is no coverage and no one accountable. The loss is yours alone.",
  },
  {
    num: "06",
    kind: "team",
    title: "AI maximised by a professional team",
    body: "Operators from every industry + frontier engineers extracting everything the tools can actually do — applied directly to your process.",
    solo: "Going solo: the tools are capable of ten times what most people get out of them. Without the team, that value stays on the table.",
  },
];

function WhyElsiaaPage() {
  return (
    <main style={{ fontFamily: SANS }} className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* header meta — offices + the Hebrew line, tight under the nav */}
      <div className="border-b border-black/[0.06] pt-[68px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2.5">
          <span className="text-[12px] tracking-[0.01em] text-[#111111]/45">{OFFICES}</span>
          <span dir="rtl" className="text-[13px] text-[#111111]/55">{HEBREW}</span>
        </div>
      </div>

      {/* ── hero — meet the objection head-on ── */}
      <section className="relative overflow-hidden px-6 pt-14 pb-12 md:pt-28 md:pb-24">
        <div className="relative mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[13px] font-semibold tracking-[0.02em] text-[#1e6b3c]">Why ELSIAA</p>
            <h1 className="mt-5 text-[1.9rem] font-semibold leading-[1.06] tracking-[-0.04em] sm:text-4xl md:text-6xl">
              "Why not just use Claude?
              <br />
              I know my business best."
            </h1>

            {/* the tools everyone already knows — present, quiet, secondary */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-[#111111]/35 sm:gap-x-9 sm:gap-y-4">
              {AI_TOOLS.map((t) => (
                <span key={t.kind} className="flex items-center gap-2.5 transition-colors hover:text-[#111111]/55">
                  <AiMark kind={t.kind} />
                  <span className="text-[13px] font-medium tracking-[0.04em]">{t.name}</span>
                </span>
              ))}
            </div>

            <p className="mx-auto mt-9 max-w-2xl text-[17px] leading-relaxed text-[#111111]/70 md:text-[19px]">
              Exactly. That is why we partner with you.
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-relaxed text-[#111111]/55 md:text-[16px]">
              You teach us your real process. We turn it into production-ready systems — built,
              secured, tested, and run to a standard no general-purpose tool
              delivers on its own.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── differentiators ── */}
      <section className="border-t border-black/[0.06] px-6 py-12 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.03em] md:text-4xl">
              What ELSIAA adds
            </h2>
          </Reveal>
          {/* reason → reason workflow: a connected rail, one reason at a time */}
          <div className="relative mt-12">
            <div aria-hidden className="absolute top-2 bottom-2 left-[21px] hidden w-px bg-black/[0.08] sm:block" />
            <div className="space-y-10 md:space-y-12">
              {REASONS.map((d, i) => (
                <Reveal key={d.num} delay={Math.min(i * 0.04, 0.16)}>
                  <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-7">
                    <div className="relative z-10 hidden h-[44px] w-[44px] place-items-center rounded-xl border border-black/[0.1] bg-[#F5F5F3] sm:grid">
                      <ReasonArt kind={d.kind} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-black/[0.1] bg-[#F5F5F3] sm:hidden">
                          <ReasonArt kind={d.kind} />
                        </span>
                        <p className="text-[12px] font-semibold tracking-[0.16em] text-[#1e6b3c]">{d.num}</p>
                        <h3 className="text-[19px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[22px]">
                          {d.title}
                        </h3>
                      </div>
                      <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-[#111111]/60 md:text-[15.5px]">
                        {d.body}
                      </p>
                      <p className="mt-3 max-w-2xl border-l-2 border-[#b4543a]/70 pl-3.5 text-[13.5px] leading-relaxed text-[#111111]/45">
                        {d.solo}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── about ELSIAA — who is behind the systems ── */}
      <section className="border-t border-black/[0.06] px-6 py-12 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[13px] font-semibold tracking-[0.02em] text-[#1e6b3c]">About ELSIAA</p>
            <h2 className="mt-4 text-2xl font-semibold leading-[1.15] tracking-[-0.03em] md:text-4xl">
              Operators who have run businesses like yours.
              <br />
              Engineers who build at the frontier of AI.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-[#111111]/55 md:text-[16px]">
              ELSIAA turns that combined expertise into working systems for your exact
              process — one standard, full ownership, fully insured.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-[13.5px] leading-relaxed text-[#111111]/45">
              On the ground in {OFFICES} — with regional U.S. offices in Baltimore,
              Montvale, and Kingston.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            <a
              href="/team"
              className="mt-7 inline-flex items-center text-[14px] font-medium text-[#1e6b3c] transition-colors hover:text-[#111111]"
            >
              Meet the team →
            </a>
            <a
              href="/quote"
              className="inline-flex items-center text-[14px] font-medium text-[#1e6b3c] transition-colors hover:text-[#111111]"
            >
              Get a quote →
            </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── outcome + CTA ── */}
      <section className="border-t border-black/[0.06] px-6 pt-16 pb-24 text-center md:pt-24 md:pb-32">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
            We upgrade your business daily.
          </h2>
          <a
            href="/quote"
            className="mt-10 inline-flex min-h-[54px] items-center rounded-full bg-[#1e6b3c] px-10 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#111111]"
          >
            Get a quote →
          </a>
        </Reveal>
      </section>
    </main>
  );
}
