import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { AbaOperations } from "../components/AbaOperations";
import { absoluteUrl } from "../lib/site-url";

/*
  Automate — one page, four numbered stops held together by a sticky index:
  01 the live ELSIAA Secretary, 02 the ABA Operations build, the four screens
  still in build, and the quote. White ground like every other page; this was
  the last dark page on the site.
*/

export const Route = createFileRoute("/automate")({
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
    links: [{ rel: "canonical", href: absoluteUrl("/automate") }],
  }),
  component: AutomatePage,
});

const SANS = "var(--font-sans)";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";
const HEBREW = "בעזרת ה׳ נעשה ונצליח";

const SYSTEMS: Array<{ problem: string; solution: string }> = [
  { problem: "Missed after-hours calls", solution: "Answered 24/7" },
  { problem: "Slow lead follow-up", solution: "Instant response & routing" },
  { problem: "Manual dispatch", solution: "Live automatic board" },
  { problem: "Invoice chaos", solution: "Automatic reconciliation" },
];

/* premium empty desktop monitor — a screen waiting to be filled as each build
   goes live. Aluminium frame, pale screen, so it sits on the white page. */
function Monitor() {
  return (
    <div className="mx-auto w-full">
      <div
        className="rounded-[18px] p-[7px]"
        style={{
          background: "linear-gradient(180deg,#e8e9e8 0%,#cdd0ce 45%,#b3b7b4 100%)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.16), 0 40px 80px -50px rgba(17,17,17,0.45)",
        }}
      >
        <div
          className="relative aspect-[16/9] overflow-hidden rounded-[12px] ring-1 ring-inset ring-black/[0.08]"
          style={{ background: "linear-gradient(180deg,#fbfbfa,#f1f2f0)" }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(118deg, rgba(255,255,255,0.85), transparent 42%)",
            }}
          />
        </div>
      </div>
      <div
        className="mx-auto h-6 w-[70px]"
        style={{
          background: "linear-gradient(90deg,#b7bab8,#dcdedc 26%,#e9eae9 50%,#dcdedc 74%,#b7bab8)",
          clipPath: "polygon(16% 0, 84% 0, 100% 100%, 0 100%)",
        }}
      />
      <div
        className="mx-auto h-[7px] w-[170px] rounded-[4px]"
        style={{
          background: "linear-gradient(180deg,#e4e6e4,#c2c5c3 60%,#a9adaa)",
          boxShadow: "0 14px 22px -12px rgba(17,17,17,0.4)",
        }}
      />
    </div>
  );
}

/* Sticky index. The page is four sections of very different heights, and
   without this the only way to reach the ABA build or the in-build screens is
   to scroll past a 900px live demo. Sits directly under the 88px fixed nav
   and highlights whichever section currently owns the viewport. */
const INDEX: Array<{ id: string; label: string; note: string }> = [
  { id: "secretary", label: "Secretary", note: "live" },
  { id: "aba-operations", label: "ABA Operations", note: "live" },
  { id: "systems", label: "In build", note: "4" },
  { id: "next", label: "Get a quote", note: "" },
];

function SystemIndex() {
  const [active, setActive] = useState("secretary");
  useEffect(() => {
    /* Deterministic on every scroll position: the active stop is the last one
       whose top has passed under the index. An IntersectionObserver was wrong
       here — it only reports sections whose visibility CHANGED in that batch,
       so jumping by anchor left the highlight on whatever it saw last, and the
       short closing section never crossed a threshold at all. */
    const pick = () => {
      const line = 140; // nav 88 + index 41, plus a little
      let cur = INDEX[0]!.id;
      for (const s of INDEX) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= line) cur = s.id;
      }
      // at the very bottom the last stop always wins, however short it is
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
        cur = INDEX[INDEX.length - 1]!.id;
      }
      setActive(cur);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, []);

  return (
    <nav
      aria-label="Systems on this page"
      className="sticky top-[88px] z-30 border-b border-black/[0.06] bg-white/92 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-1.5 md:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {INDEX.map((s) => {
          const on = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-current={on ? "true" : undefined}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold whitespace-nowrap transition-colors md:text-[13px]"
              style={{
                color: on ? "#1e6b3c" : "rgba(17,17,17,0.5)",
                background: on ? "rgba(30,107,60,0.10)" : "transparent",
              }}
            >
              {s.label}
              {s.note && (
                <span
                  className="text-[10.5px] font-medium"
                  style={{ color: on ? "#1e6b3c" : "rgba(17,17,17,0.35)" }}
                >
                  {s.note}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function AutomatePage() {
  return (
    <main
      style={{ background: "#ffffff", color: "#111111", fontFamily: SANS }}
      className="min-h-screen"
    >
      <SiteNav />

      {/* header meta — offices + the Hebrew line, tight under the nav */}
      <div className="border-b border-black/[0.06] pt-[68px]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2.5">
          <span className="text-[12px] tracking-[0.01em] text-[#111111]/45">{OFFICES}</span>
          <span dir="rtl" className="text-[13px] text-[#111111]/55">
            {HEBREW}
          </span>
        </div>
      </div>

      <SystemIndex />

      {/* ELSIAA SECRETARY — the one live system, strongest focus, tight */}
      <section id="secretary" className="scroll-mt-[136px] px-4 pt-6 md:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-[13px] font-semibold tracking-[0.02em] text-[#1e6b3c]">
            01 · ELSIAA Secretary
          </p>
          <h1 className="mx-auto mt-2 max-w-2xl text-center text-[1.9rem] leading-[1.08] font-semibold tracking-[-0.04em] text-[#111111] md:text-[2.9rem]">
            Talk to a system we built. It answers.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-[14.5px] leading-relaxed text-[#111111]/60 md:text-[16px]">
            This is the live agent, not a recording — call it or type to it. The systems below are
            the same idea pointed at the other jobs that still wait on a person.
          </p>
          <div className="mt-3 overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_40px_90px_-60px_rgba(17,17,17,0.4)]">
            <iframe
              src="/elsiaa-secretary.html?embed=1"
              aria-label="ELSIAA Secretary — live voice & chat"
              allow="microphone; autoplay"
              style={{
                border: 0,
                width: "100%",
                height: "min(92vh, 900px)",
                display: "block",
                background: "#ffffff",
              }}
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <a
              href="#systems"
              className="rounded-full border border-black/15 px-7 py-3 text-[14px] font-semibold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
            >
              Unpack it
            </a>
            <a
              href="/quote"
              className="rounded-full bg-[#1e6b3c] px-7 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#111111]"
            >
              I want it
            </a>
          </div>
        </div>
      </section>

      {/* ABA OPERATIONS — the second built system, before/after on one screen */}
      <AbaOperations />

      {/* placeholder systems — tight vertical sequence, empty premium frames.
          Sits on the off-white so the scroll reads as a distinct third step
          after the Secretary and the ABA build. */}
      <section id="systems" className="scroll-mt-[136px] bg-[#F5F5F3] px-4 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-[1.4rem] font-semibold tracking-[-0.03em] text-[#111111] md:text-[2rem]">
            In build — four more systems.
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-[13.5px] leading-relaxed text-[#111111]/55 md:text-[15px]">
            Each one is a job that currently waits on a person. Screens are being filled in as each
            build goes live.
          </p>
        </div>
        {/* Two-up rather than four stacked full-width frames. These screens are
            empty until each build ships, and stacked they were 2,365px of void
            immediately after two finished systems — which read as less work
            done, not more. */}
        <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 md:mt-8 md:gap-8">
          {SYSTEMS.map((s) => (
            <div key={s.problem}>
              <h3 className="mb-2.5 text-center text-[14px] font-semibold tracking-[-0.01em] md:text-[15px]">
                <span className="text-[#111111]/45">{s.problem}</span>
                <span className="px-2 text-[#1e6b3c]">→</span>
                <span className="text-[#111111]">{s.solution}</span>
              </h3>
              <Monitor />
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-lg text-center text-[13px] text-[#111111]/45 md:mt-8">
          Two systems are live above. These four are in build.
        </p>
      </section>

      {/* closing — two factual lines, one button */}
      <section
        id="next"
        className="scroll-mt-[136px] px-6 pb-10 md:pb-16 pt-8 md:pt-12 text-center"
      >
        <p className="text-[14px] text-[#111111]/60">
          Fully insured · Fixed scope · You own the finished system.
        </p>
        <p className="mt-1 text-[14px] text-[#111111]/45">info@elsiaa.com</p>
        <a
          href="/quote"
          className="mt-6 inline-flex items-center rounded-full bg-[#1e6b3c] px-9 py-3.5 text-[14px] font-semibold text-white transition-all hover:bg-[#111111]"
        >
          Get a quote →
        </a>
      </section>
    </main>
  );
}
