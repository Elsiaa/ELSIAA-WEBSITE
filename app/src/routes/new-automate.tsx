import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { absoluteUrl } from "../lib/site-url";

/*
  ELSIAA Automate — a tight, dark product gallery of solution systems.
  The Secretary (embedded demo) is the only interactive system; the systems
  below it are premium empty placeholders the CTO fills in later. Brand-locked:
  ELSIAA green, dark surfaces, the offices line and the Hebrew phrase.
*/

export const Route = createFileRoute("/new-automate")({
  head: () => ({
    meta: [
      { title: "Automate — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "ELSIAA Secretary — a live voice-and-chat customer-service agent — and the systems that take ownership of the problems every business has.",
      },
      { property: "og:title", content: "Automate — ELSIAA" },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/new-automate") }],
  }),
  component: AutomatePage,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";
const HEBREW = "בעזרת ה׳ נעשה ונצליח";

/* each later system: a universal problem → the solution, over an empty frame */
const SYSTEMS: Array<{ problem: string; solution: string }> = [
  { problem: "Missed after-hours calls", solution: "Answered 24/7" },
  { problem: "Slow lead follow-up", solution: "Instant response & routing" },
  { problem: "Manual dispatch", solution: "Live automatic board" },
  { problem: "Invoice chaos", solution: "Automatic reconciliation" },
];

/* premium empty desktop monitor — visual variety after the phones */
function Monitor() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-[18px] border border-white/[0.08] bg-[#0c0e0d] p-2 shadow-[0_50px_110px_-60px_rgba(0,0,0,0.9)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] ring-1 ring-inset ring-white/[0.06]"
          style={{ background: "radial-gradient(120% 90% at 50% 0%, #14181600 0%, #090b0a 60%), linear-gradient(180deg,#101312,#0a0c0b)" }}>
          {/* faint screen sheen only — intentionally empty, ready for the real system */}
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.035), transparent 40%)" }} />
        </div>
      </div>
      {/* stand */}
      <div className="mx-auto mt-2 h-5 w-16 rounded-b-[3px]" style={{ background: "linear-gradient(180deg,#171a19,#0d0f0e)" }} />
      <div className="mx-auto h-[6px] w-40 rounded-full" style={{ background: "linear-gradient(180deg,#191c1b,#0c0e0d)" }} />
    </div>
  );
}

function AutomatePage() {
  return (
    <main style={{ background: "#070907", color: "#f4f4f2", fontFamily: SANS }} className="min-h-screen">
      <SiteNav />

      {/* header meta — offices + the Hebrew line, tight under the nav */}
      <div className="border-b border-white/[0.06] pt-[68px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2.5">
          <span className="text-[12px] tracking-[0.01em] text-white/45">{OFFICES}</span>
          <span dir="rtl" className="text-[13px] text-white/55">{HEBREW}</span>
        </div>
      </div>

      {/* 2 · ELSIAA SECRETARY — the one live system, strongest focus, tight */}
      <section className="px-4 pt-6 md:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[13px] font-semibold tracking-[0.02em] text-[#2e9e58]">ELSIAA Secretary</p>
          <div className="mt-3 overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#070907] shadow-[0_60px_140px_-70px_rgba(0,0,0,0.9)]">
            <iframe
              src="/elsiaa-secretary.html?embed=1"
              aria-label="ELSIAA Secretary — live voice & chat"
              allow="microphone; autoplay"
              style={{ border: 0, width: "100%", height: "min(92vh, 900px)", display: "block", background: "#070907" }}
            />
          </div>
          {/* the two buttons — tight, right under the system */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <a href="#systems" className="rounded-full border border-white/20 px-7 py-3 text-[14px] font-semibold text-white/90 transition-all hover:border-[#2e9e58] hover:text-white">
              Unpack it
            </a>
            <a href="/quote" className="rounded-full bg-[#2e9e58] px-7 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#1e6b3c]">
              I want it
            </a>
          </div>
        </div>
      </section>

      {/* 3 · placeholder systems — tight vertical sequence, empty premium frames */}
      <section id="systems" className="scroll-mt-24 px-4 pt-10 md:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {SYSTEMS.map((s) => (
            <div key={s.problem}>
              <p className="mb-3 text-center text-[15px] font-semibold tracking-[-0.01em] md:text-[16px]">
                <span className="text-white/45">{s.problem}</span>
                <span className="px-2 text-[#2e9e58]">→</span>
                <span className="text-white">{s.solution}</span>
              </p>
              <Monitor />
            </div>
          ))}
        </div>
      </section>

      {/* 4 · closing — two factual lines, one button */}
      <section className="px-6 pb-16 pt-12 text-center">
        <p className="text-[14px] text-white/60">Fully insured · Fixed scope · You own the finished system.</p>
        <p className="mt-1 text-[14px] text-white/45">info@elsiaa.com</p>
        <a href="/quote" className="mt-6 inline-flex items-center rounded-full bg-[#2e9e58] px-9 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#1e6b3c]">
          Get a quote →
        </a>
      </section>
    </main>
  );
}
