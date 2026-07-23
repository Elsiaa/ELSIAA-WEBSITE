import { useEffect, useRef, useState } from "react";

/*
  "Meet Sarah — Your Always-On AI Employee"
  Cinematic, self-looping interactive hero for the Automate page.

  A floating Apple-style phone runs a seamless ~22s story:
    float → lock screen → contact card → CALL → conversation books
    Thursday 3PM → rose-gold checkmarks cascade → camera pushes through
    the phone → the AI workforce activates → "All done." → loop.

  Everything is CSS-transition + timeline driven (no heavy libraries),
  honours prefers-reduced-motion, and pauses when off-screen for perf.
*/

const sans = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif",
} as const;
const mono = sans;

// rose-gold palette
const GOLD = "#e8b98f";
const ROSEGOLD = "#e6a58f";

type Stage =
  | "wake"
  | "lock"
  | "card"
  | "calling"
  | "greeting"
  | "convo"
  | "checks"
  | "push"
  | "workforce"
  | "done";

const TIMELINE: Array<[number, Stage]> = [
  [0, "wake"],
  [1300, "lock"],
  [4000, "card"],
  [6000, "calling"],
  [7700, "greeting"],
  [9600, "convo"],
  [13200, "checks"],
  [16200, "push"],
  [17400, "workforce"],
  [20600, "done"],
];
const LOOP_AT = 23000;

const CHECKS = [
  "Calendar checked",
  "CRM updated",
  "Confirmation sent",
  "Team notified",
];

const AGENTS: Array<[string, string]> = [
  ["Voice", "Answers every call, in your brand's tone"],
  ["Scheduling", "Books, reschedules, and never double-books"],
  ["CRM", "Logs the contact and the context, instantly"],
  ["Follow-up", "Sends the confirmation and the reminder"],
  ["Insights", "Surfaces what the calls are really telling you"],
];

function useStage(active: boolean): Stage {
  const [stage, setStage] = useState<Stage>("wake");
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (!active) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStage("workforce");
      return;
    }
    let cancelled = false;
    const run = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      TIMELINE.forEach(([at, s]) => {
        timers.current.push(
          window.setTimeout(() => !cancelled && setStage(s), at),
        );
      });
      timers.current.push(window.setTimeout(run, LOOP_AT));
    };
    run();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [active]);
  return stage;
}

// visibility gate so the loop only runs when the hero is on screen
function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

const shown = (stage: Stage, from: Stage[]) => from.includes(stage);
const order: Stage[] = [
  "wake", "lock", "card", "calling", "greeting", "convo", "checks", "push", "workforce", "done",
];
const atOrAfter = (stage: Stage, s: Stage) => order.indexOf(stage) >= order.indexOf(s);

/* ---------------------------------- phone --------------------------------- */
function Phone({ stage }: { stage: Stage }) {
  const inCall = shown(stage, ["greeting", "convo", "checks"]);
  const dissolve = shown(stage, ["push", "workforce", "done"]);
  return (
    <div
      className="relative"
      style={{
        width: "min(300px, 74vw)",
        aspectRatio: "9 / 19.5",
        transition: "opacity 1.1s ease, transform 1.1s cubic-bezier(0.2,0.8,0.2,1)",
        opacity: dissolve ? 0 : 1,
        transform: dissolve ? "scale(1.35)" : "scale(1)",
        animation: "sarahBob 6.5s ease-in-out infinite",
        filter: "drop-shadow(0 50px 90px rgba(0,0,0,0.55))",
      }}
    >
      {/* body */}
      <div
        className="absolute inset-0 rounded-[2.6rem] p-[3px]"
        style={{
          background:
            "linear-gradient(150deg, rgba(255,255,255,0.28), rgba(230,165,143,0.35) 45%, rgba(255,255,255,0.08))",
        }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[#0a0710]">
          {/* dynamic island */}
          <div className="absolute top-2.5 left-1/2 z-30 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

          {/* ---- lock screen ---- */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-opacity duration-700"
            style={{
              opacity: shown(stage, ["wake", "lock"]) ? 1 : 0,
              background:
                "radial-gradient(120% 80% at 50% 20%, rgba(230,165,143,0.16), transparent 60%)",
            }}
          >
            <p className="text-[11px] tracking-[0.42em] text-white/50 uppercase" style={mono}>
              Elsiaa
            </p>
            <div
              className="mt-8 h-16 w-16 overflow-hidden rounded-full ring-2 ring-[#e6a58f]/50"
              style={{
                opacity: stage === "lock" ? 1 : 0,
                transform: stage === "lock" ? "scale(1)" : "scale(0.8)",
                transition: "all 0.6s cubic-bezier(0.2,0.8,0.2,1)",
              }}
            >
              <img src="/assets/sarah.png" alt="" className="h-full w-full object-cover" style={{ objectPosition: "50% 18%" }} />
            </div>
            <p className="mt-4 text-[16px] font-semibold text-white" style={sans} data-on={stage === "lock"}>
              Sarah
            </p>
            <p className="mt-1 text-[11px] text-white/55" style={sans}>
              AI Executive Assistant
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[10.5px] text-emerald-300/90" style={mono}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 8px #34d399" }} />
              Online
            </span>
          </div>

          {/* ---- contact card ---- */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center px-5 transition-all duration-700"
            style={{ opacity: stage === "card" || stage === "calling" ? 1 : 0 }}
          >
            <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur">
              <div className="mx-auto h-20 w-20 overflow-hidden rounded-full ring-2 ring-[#e6a58f]/60">
                <img src="/assets/sarah.png" alt="Sarah, ELSIAA AI assistant" className="h-full w-full object-cover" style={{ objectPosition: "50% 18%" }} />
              </div>
              <p className="mt-3 text-[17px] font-semibold text-white" style={sans}>Sarah</p>
              <p className="text-[11px] text-white/50" style={sans}>ELSIAA · AI Executive Assistant</p>
              <div className="mt-5 flex items-center justify-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                  <span className="text-[16px]">✉︎</span>
                </div>
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: stage === "calling" ? "#e6a58f" : "#25b34b",
                    transition: "background 0.4s ease, transform 0.3s ease",
                    transform: stage === "calling" ? "scale(0.9)" : "scale(1)",
                  }}
                >
                  {stage === "calling" && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{ border: "2px solid #e6a58f", animation: "sarahPulseRing 1.1s ease-out infinite" }}
                    />
                  )}
                  <span className="text-[18px]">📞</span>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06]">
                  <span className="text-[16px]">💬</span>
                </div>
              </div>
              <p className="mt-4 text-[10.5px] tracking-[0.2em] text-white/40 uppercase" style={mono}>
                {stage === "calling" ? "Calling…" : "Tap to call"}
              </p>
            </div>
          </div>

          {/* ---- in-call conversation ---- */}
          <div
            className="absolute inset-0 flex flex-col px-4 pt-14 pb-5 transition-opacity duration-700"
            style={{ opacity: inCall ? 1 : 0 }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 overflow-hidden rounded-full ring-1 ring-[#e6a58f]/50">
                <img src="/assets/sarah.png" alt="" className="h-full w-full object-cover" style={{ objectPosition: "50% 18%" }} />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-white" style={sans}>Sarah</p>
                <p className="text-[9.5px] text-emerald-300/80" style={mono}>on the line · 00:14</p>
              </div>
              <div className="ml-auto flex items-end gap-0.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="w-0.5 rounded-full bg-[#e6a58f]"
                    style={{ height: 10, transformOrigin: "bottom", animation: `sarahBar ${0.6 + i * 0.12}s ease-in-out ${i * 0.1}s infinite` }}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 flex flex-1 flex-col justify-end gap-2 text-[11.5px]" style={sans}>
              <Bubble side="in" show={atOrAfter(stage, "greeting")}>
                Hi, thanks for calling ELSIAA — this is Sarah. How can I help?
              </Bubble>
              <Bubble side="out" show={atOrAfter(stage, "convo")}>
                I'd like to book a consultation this week.
              </Bubble>
              <Bubble side="in" show={atOrAfter(stage, "convo")}>
                I have <b className="text-[#e6a58f]">Thursday at 3:00 PM</b> open. Shall I lock it in?
              </Bubble>
              <Bubble side="out" show={atOrAfter(stage, "checks")}>
                Perfect.
              </Bubble>
            </div>
          </div>

          {/* ---- checkmark toast stack ---- */}
          <div className="absolute inset-x-4 bottom-5 z-20 space-y-1.5">
            {CHECKS.map((c, i) => (
              <div
                key={c}
                className="flex items-center gap-2 rounded-xl border border-[#e6a58f]/25 bg-[#160f18]/90 px-3 py-2 backdrop-blur"
                style={{
                  opacity: stage === "checks" ? 1 : 0,
                  transform: stage === "checks" ? "translateY(0)" : "translateY(8px)",
                  transition: `all 0.5s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.28}s`,
                }}
              >
                <span
                  className="flex h-4 w-4 flex-none items-center justify-center rounded-full text-[9px] font-bold text-[#0a0710]"
                  style={{ background: GOLD }}
                >
                  ✓
                </span>
                <span className="text-[11px] text-white/85" style={sans}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bubble({ side, show, children }: { side: "in" | "out"; show: boolean; children: React.ReactNode }) {
  const inbound = side === "in";
  return (
    <div
      className={`max-w-[82%] rounded-2xl px-3 py-2 leading-snug ${inbound ? "self-start text-white/90" : "self-end text-white"}`}
      style={{
        background: inbound ? "rgba(255,255,255,0.06)" : "rgba(230,165,143,0.16)",
        border: inbound ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(230,165,143,0.28)",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0) scale(1)" : "translateY(6px) scale(0.98)",
        transition: "all 0.45s cubic-bezier(0.2,0.8,0.2,1)",
      }}
    >
      {children}
    </div>
  );
}

/* ------------------------------ workforce grid ----------------------------- */
function Workforce({ stage }: { stage: Stage }) {
  const on = shown(stage, ["workforce", "done"]);
  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{ opacity: on ? 1 : 0, transition: "opacity 1s ease" }}
    >
      <div className="w-full max-w-md px-2">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {AGENTS.map(([name, desc], i) => (
            <div
              key={name}
              className="rounded-2xl border border-black/[0.08] bg-white p-3.5 shadow-[0_24px_60px_-45px_rgba(17,17,17,0.5)]"
              style={{
                opacity: on ? 1 : 0,
                transform: on ? "translateY(0)" : "translateY(14px)",
                transition: `all 0.6s cubic-bezier(0.2,0.8,0.2,1) ${i * 0.12}s`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "#c67a56", boxShadow: "0 0 10px rgba(198,122,86,0.6)", animation: "sarahGlow 2.4s ease-in-out infinite" }}
                />
                <p className="text-[12.5px] font-semibold text-[#111111]" style={sans}>{name}</p>
                <span className="ml-auto text-[8.5px] tracking-[0.18em] text-[#1e6b3c]/80 uppercase" style={mono}>Active</span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-[#111111]/55" style={sans}>{desc}</p>
            </div>
          ))}
        </div>
        <p
          className="mt-4 text-center text-[13px] text-[#111111]/70"
          style={{ ...sans, opacity: stage === "done" ? 1 : 0, transition: "opacity 0.8s ease 0.3s" }}
        >
          "All done. Anything else I can take care of?" <span className="text-[#b8663f]">— Sarah</span>
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- particles -------------------------------- */
function Particles() {
  const bits = Array.from({ length: 14 });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((_, i) => {
        const left = (i * 61) % 100;
        const delay = (i % 7) * 1.3;
        const dur = 9 + (i % 5) * 2;
        const dx = ((i % 5) - 2) * 24;
        return (
          <span
            key={i}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${left}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              background: i % 2 ? GOLD : ROSEGOLD,
              // @ts-expect-error custom prop
              "--dx": `${dx}px`,
              animation: `sarahDrift ${dur}s linear ${delay}s infinite`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

/* ================================== hero ================================== */
export function SarahHero() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const stage = useStage(inView);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-white text-[#111111]"
      aria-label="Meet Sarah — your always-on AI employee"
    >
      {/* soft rose-gold warmth on white */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute -top-1/4 right-[6%] h-[60vh] w-[60vh] rounded-full blur-[130px]"
          style={{ background: "radial-gradient(circle, rgba(230,165,143,0.22), transparent 66%)", animation: "sarahGlow 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[4%] left-[4%] h-[38vh] w-[38vh] rounded-full blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(232,185,143,0.16), transparent 66%)" }}
        />
      </div>
      <Particles />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pt-36 pb-24 md:pb-28 lg:grid-cols-[1.05fr_1fr] lg:pt-40">
        {/* copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#111111]/10 bg-[#111111]/[0.03] px-3 py-1 text-[10.5px] tracking-[0.24em] text-[#b8663f] uppercase" style={mono}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d0865c]" style={{ boxShadow: "0 0 8px rgba(208,134,92,0.7)" }} />
            Always on
          </span>
          <h1 className="mt-6 font-semibold tracking-[-0.045em]" style={{ ...sans, fontSize: "clamp(2.4rem, 5vw, 4.4rem)", lineHeight: 1.0 }}>
            Meet Sarah —<br />
            <span style={{ background: "linear-gradient(100deg, #111111, #c67a56)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              your always-on AI employee.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[#111111]/65" style={sans}>
            She answers every call, books the meeting, updates your systems, and never clocks out.
          </p>
          <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-[#111111]/50" style={sans}>
            One AI employee doing the work of a full front office — live, 24/7, in your brand's own voice.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a href="/intake" className="rounded-full px-7 py-3.5 text-[13px] font-bold text-[#3a1e12] transition-all hover:brightness-105" style={{ ...mono, background: "linear-gradient(100deg, #f0c9ad, #e0996f)" }}>
              Hear Sarah live →
            </a>
            <a href="/contact" className="rounded-full border border-[#111111]/20 px-7 py-3.5 text-[13px] font-bold text-[#111111] transition-all hover:border-[#c67a56] hover:text-[#b8663f]" style={mono}>
              Put Sarah to work
            </a>
          </div>
          <p className="mt-6 text-[11px] tracking-[0.14em] text-[#111111]/35 uppercase" style={mono}>
            Voice · Scheduling · CRM · Follow-up · Insights
          </p>
        </div>

        {/* stage */}
        <div className="relative flex min-h-[560px] items-center justify-center">
          <Phone stage={stage} />
          <Workforce stage={stage} />
        </div>
      </div>
    </section>
  );
}
