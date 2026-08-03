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
  "var(--font-sans)";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";

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
const REASONS: Array<{ num: string; art: string; title: string; body: string; solo: string }> = [
  {
    num: "01",
    art: "/assets/why/data.png",
    title: "Your data stays yours",
    body: "Isolated, encrypted, never used to train a model. We decide exactly what the AI can see.",
    solo: "Going solo: an employee pastes your customer list into a public chatbot. It is now outside your control and possibly in the next training run.",
  },
  {
    num: "02",
    art: "/assets/why/bugs.png",
    title: "Protected against bugs",
    body: "Engineers test and monitor every system. Failures surface in staging, not in front of your customers.",
    solo: "Going solo: AI-generated code with a silent bug quietly corrupts three months of invoices before anyone notices.",
  },
  {
    num: "03",
    art: "/assets/why/hacks.png",
    title: "Hardened against hacks",
    body: "Keys, permissions, and infrastructure locked to professional standards and kept patched.",
    solo: "Going solo: one exposed API key in a script and an attacker runs up your accounts — or walks through your systems.",
  },
  {
    num: "04",
    art: "/assets/why/hipaa.png",
    title: "HIPAA & compliance ready",
    body: "Built to regulatory standards — audit trails, retention rules, and a signed BAA where one is required.",
    solo: "Going solo: an untracked AI tool touches patient data. That is a reportable breach, federal fines, and a headline.",
  },
  {
    num: "05",
    art: "/assets/why/insured.png",
    title: "Fully insured",
    body: "ELSIAA carries professional liability and cyber cover on every engagement.",
    solo: "Going solo: when a DIY automation makes a costly mistake, there is no coverage and no one accountable. The loss is yours alone.",
  },
  {
    num: "06",
    art: "/assets/why/team.png",
    title: "AI maximised by a professional team",
    body: "Operators who know the work plus engineers who know the tools, applied to your process.",
    solo: "Going solo: the tools are capable of ten times what most people get out of them. Without the team, that value stays on the table.",
  },
];

function WhyElsiaaPage() {
  return (
    <main style={{ fontFamily: SANS }} className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* ── hero — the objection, then the answer ── */}
      <section className="px-6 pt-36 pb-14 md:pt-44 md:pb-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* the objection, as a real pull quote */}
          <Reveal>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase">
              Why ELSIAA
            </p>
            <div className="relative mt-6">
              <span
                aria-hidden
                className="absolute -top-8 -left-2 text-[110px] leading-none font-semibold text-[#1e6b3c]/10 select-none md:-top-10 md:text-[150px]"
              >
                &ldquo;
              </span>
              <h1 className="relative text-[2rem] leading-[1.08] font-semibold tracking-[-0.04em] sm:text-[2.6rem] md:text-[3.4rem]">
                Why not just use Claude?
                <br />
                I know my business best.
              </h1>
            </div>
            <div className="mt-8 border-l-2 border-[#1e6b3c] pl-5">
              <p className="text-[19px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[22px]">
                Exactly. That is why we partner with you.
              </p>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]">
                You teach us your real process. We turn it into production-ready systems —
                built, secured, tested, and run to a standard no general-purpose tool
                delivers on its own.
              </p>
            </div>
          </Reveal>

          {/* the tools everyone already has, framed as the comparison */}
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-black/[0.08] bg-[#F5F5F3] p-7 md:p-9">
              <p className="text-[12px] font-semibold tracking-[0.12em] text-[#111111]/40 uppercase">
                The tools you already have
              </p>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-2">
                {AI_TOOLS.map((t) => (
                  <span
                    key={t.kind}
                    className="flex items-center gap-2.5 text-[#111111]/45 transition-colors hover:text-[#111111]/70"
                  >
                    <AiMark kind={t.kind} />
                    <span className="text-[13.5px] font-medium">{t.name}</span>
                  </span>
                ))}
              </div>
              <p className="mt-7 border-t border-black/[0.08] pt-5 text-[14.5px] leading-relaxed text-[#111111]/60">
                Powerful. Also generic, uninsured, and only as good as the hands running them.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── the six reasons ── */}
      <section className="border-t border-black/[0.06] bg-[#FBFBFA] px-6 py-14 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.035em] md:text-4xl">
              What ELSIAA adds
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#111111]/55">
              Six things a general-purpose tool cannot give you on its own.
            </p>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
            {REASONS.map((d, i) => (
              <Reveal key={d.num} className="h-full" delay={Math.min((i % 2) * 0.06, 0.12)}>
                <article className="group flex h-full flex-col rounded-3xl border border-black/[0.08] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.3)] md:p-8">
                  <div className="flex items-start gap-4">
                    <img
                      src={d.art}
                      alt=""
                      loading="lazy"
                      width={160}
                      height={160}
                      className="h-16 w-16 shrink-0 object-contain transition-transform duration-300 group-hover:scale-105 md:h-20 md:w-20"
                    />
                    <div className="min-w-0 pt-1">
                      <p className="text-[11.5px] font-bold tracking-[0.16em] text-[#1e6b3c]">{d.num}</p>
                      <h3 className="mt-1 text-[18px] leading-tight font-semibold tracking-[-0.02em] text-[#111111] md:text-[20px]">
                        {d.title}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-5 text-[14.5px] leading-relaxed text-[#111111]/65 md:text-[15px]">
                    {d.body}
                  </p>

                  {/* the risk, as one line — a labelled box on all six read as boilerplate */}
                  <p className="mt-auto flex gap-2.5 pt-6 text-[13.5px] leading-relaxed text-[#111111]/55">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#b4543a]" />
                    <span>
                      <span className="font-semibold text-[#b4543a]">Alone:</span>{" "}
                      {d.solo.replace(/^Going solo:\s*/, "")}
                    </span>
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── about ELSIAA ── */}
      <section className="border-t border-black/[0.06] px-6 py-16 md:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <Reveal>
            <p className="text-[12px] font-semibold tracking-[0.14em] text-[#1e6b3c] uppercase">
              About ELSIAA
            </p>
            <h2 className="mt-5 text-2xl font-semibold leading-[1.15] tracking-[-0.035em] md:text-4xl">
              Young and experienced professionals,
              <br className="hidden sm:block" />
              at one table.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-[#111111]/65 md:text-[16px]">
              ELSIAA brings you the cutting edge of what the AI industry actually has to
              offer — at the best price. Operators who have run businesses like yours,
              engineers who build at the frontier, working on your process together.
            </p>

            <p className="mx-auto mt-8 max-w-2xl border-t border-black/[0.08] pt-6 text-[13.5px] leading-relaxed text-[#111111]/50">
              On the ground in {OFFICES} — with regional U.S. offices in Baltimore,
              Montvale, and Kingston.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
              <a
                href="/team"
                className="inline-flex items-center text-[14px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
              >
                Meet the team →
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── outcome + CTA ── */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-16 text-center md:py-16">
        <Reveal>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.035em] md:text-5xl">
            Bring us the process. We will build it.
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/quote"
              className="inline-flex min-h-[54px] items-center rounded-full bg-[#1e6b3c] px-10 text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-[#111111]"
            >
              Get a quote →
            </a>
            <a
              href="/consultation"
              className="inline-flex min-h-[54px] items-center rounded-full border border-black/15 px-8 text-[15px] font-semibold text-[#111111] transition-colors duration-300 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Free 20-minute call
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
