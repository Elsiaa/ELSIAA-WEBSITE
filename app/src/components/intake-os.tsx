import { useEffect, useRef, useState } from "react";
import { mono, inter } from "./automate-mocks";

/*
  Intake OS — the flagship voice product, shown full-stack.
  Left pane: the caller-facing line (front end). Right pane: the system
  underneath (back end) — live transcription, clinical NLU, deterministic
  doctor-matching, and the booking actions. One interval advances a scenario's
  event stream; both panes update from the same clock. Reduced-motion → final
  state, no animation. No third-party iframes; no real audio.
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

const DOCS = [
  {
    id: "marsh",
    name: "Dr. Marsh",
    spec: "Neuro-ophthalmology",
    triggers: [
      "Double / split vision",
      "Vision loss",
      "Optic-nerve concern",
      "Vision + headache / neuro",
    ],
  },
  {
    id: "cole",
    name: "Dr. Cole",
    spec: "Cataract & refractive",
    triggers: ["Gradual cloudy / blurry", "LASIK / vision correction"],
  },
  {
    id: "nathan",
    name: "Dr. Nathan",
    spec: "Oculoplastic & orbital",
    triggers: ["Eyelid drooping", "Swelling / bulging", "Orbital concern"],
  },
] as const;
type DocId = (typeof DOCS)[number]["id"];

type Ev =
  | { t: "caller"; text: string }
  | { t: "asr"; text: string }
  | { t: "entity"; label: string; concept: string }
  | { t: "rule"; doc: DocId; hit: number }
  | { t: "confidence"; v: number }
  | { t: "agent"; text: string }
  | { t: "clarify"; text: string }
  | { t: "action"; label: string; sys: string }
  | { t: "route"; doc: DocId };

type Scenario = { id: string; label: string; lang: string; caption: string; events: Ev[] };

const SCENARIOS: Scenario[] = [
  {
    id: "diplopia",
    label: "“Vision splits when I read”",
    lang: "EN",
    caption: "Plain language, never says “double vision” — matched on meaning.",
    events: [
      {
        t: "caller",
        text: "Hi, my vision kind of splits into two when I'm reading in the evening.",
      },
      { t: "asr", text: "my vision kind of splits into two when I'm reading in the evening" },
      { t: "entity", label: "“splits into two”", concept: "Diplopia (binocular)" },
      { t: "entity", label: "“when reading / evening”", concept: "Near work · fatigue-related" },
      { t: "rule", doc: "marsh", hit: 0 },
      { t: "confidence", v: 92 },
      {
        t: "agent",
        text: "That sounds like double vision that shows up with near work — that's exactly what our neuro-ophthalmologist, Dr. Marsh, handles. I can get you in with her.",
      },
      { t: "route", doc: "marsh" },
      { t: "action", label: "Held Thu 10:20 with Dr. Marsh", sys: "Calendar" },
      { t: "action", label: "Intake note created · symptom summary attached", sys: "EHR" },
      { t: "action", label: "Confirmation + prep instructions sent", sys: "SMS" },
      {
        t: "agent",
        text: "You're booked for Thursday at 10:20 with Dr. Marsh. I've texted the details.",
      },
    ],
  },
  {
    id: "cataract",
    label: "“Everything's gotten cloudy”",
    lang: "EN",
    caption: "Gradual, painless blur → cataract & refractive, not neuro.",
    events: [
      {
        t: "caller",
        text: "Everything's gone kind of cloudy over the last year, and I've been wondering about LASIK.",
      },
      {
        t: "asr",
        text: "everything's gone kind of cloudy over the last year and wondering about LASIK",
      },
      { t: "entity", label: "“cloudy over the last year”", concept: "Gradual visual blur" },
      { t: "entity", label: "“LASIK”", concept: "Refractive-surgery interest" },
      { t: "rule", doc: "cole", hit: 0 },
      { t: "confidence", v: 90 },
      {
        t: "agent",
        text: "Gradual clouding and an interest in vision correction is Dr. Cole's area — cataract and refractive surgery. Let's get you scheduled with him.",
      },
      { t: "route", doc: "cole" },
      { t: "action", label: "Held Tue 14:00 with Dr. Cole", sys: "Calendar" },
      { t: "action", label: "Intake note created", sys: "EHR" },
      { t: "action", label: "Confirmation sent", sys: "SMS" },
      {
        t: "agent",
        text: "Booked — Tuesday 2:00pm with Dr. Cole. Details are on their way to your phone.",
      },
    ],
  },
  {
    id: "oculoplastic",
    label: "“My eyelid is drooping”",
    lang: "EN",
    caption: "Structural / eyelid → oculoplastic & orbital surgery.",
    events: [
      {
        t: "caller",
        text: "My left eyelid has started drooping and there's some swelling around it.",
      },
      { t: "asr", text: "my left eyelid has started drooping and there's some swelling around it" },
      { t: "entity", label: "“eyelid drooping”", concept: "Ptosis" },
      { t: "entity", label: "“swelling around eye”", concept: "Periorbital swelling" },
      { t: "rule", doc: "nathan", hit: 0 },
      { t: "confidence", v: 88 },
      {
        t: "agent",
        text: "Eyelid drooping with swelling is what Dr. Nathan handles — oculoplastic and orbital surgery. I'll book you with him.",
      },
      { t: "route", doc: "nathan" },
      { t: "action", label: "Held Wed 11:15 with Dr. Nathan", sys: "Calendar" },
      { t: "action", label: "Intake note created", sys: "EHR" },
      { t: "action", label: "Confirmation sent", sys: "SMS" },
      { t: "agent", text: "Done — Wednesday 11:15 with Dr. Nathan. Text confirmation sent." },
    ],
  },
  {
    id: "unclear",
    label: "Ambiguous → asks, won't guess",
    lang: "EN",
    caption: "Low confidence → one clarifying question instead of a mis-book.",
    events: [
      { t: "caller", text: "My eyes have just been bothering me and my vision's a bit off." },
      { t: "asr", text: "my eyes have been bothering me and my vision's a bit off" },
      { t: "entity", label: "“vision a bit off”", concept: "Non-specific visual complaint" },
      { t: "confidence", v: 34 },
      {
        t: "clarify",
        text: "I want to route you to the right specialist. Is the change more like things looking cloudy or blurry over time — or more like seeing double, or something around the eyelid?",
      },
      { t: "caller", text: "More like double — two of everything when I look to the side." },
      { t: "asr", text: "more like double, two of everything when I look to the side" },
      { t: "entity", label: "“two of everything / to the side”", concept: "Gaze-evoked diplopia" },
      { t: "rule", doc: "marsh", hit: 0 },
      { t: "confidence", v: 91 },
      {
        t: "agent",
        text: "Thank you — that's double vision, which is Dr. Marsh in neuro-ophthalmology. Booking you now.",
      },
      { t: "route", doc: "marsh" },
      { t: "action", label: "Held Thu 09:40 with Dr. Marsh", sys: "Calendar" },
      { t: "action", label: "Intake note + clarifying exchange logged", sys: "EHR" },
      { t: "action", label: "Confirmation sent", sys: "SMS" },
      { t: "agent", text: "You're set — Thursday 9:40 with Dr. Marsh. Details sent by text." },
    ],
  },
];

type Derived = {
  transcript: Array<{ who: "caller" | "agent"; text: string; clarify?: boolean }>;
  asr: string;
  entities: Array<{ label: string; concept: string }>;
  ruled: DocId | null;
  confidence: number;
  route: DocId | null;
  actions: Array<{ label: string; sys: string }>;
};

function derive(events: Ev[], upto: number): Derived {
  const d: Derived = {
    transcript: [],
    asr: "",
    entities: [],
    ruled: null,
    confidence: 0,
    route: null,
    actions: [],
  };
  for (let i = 0; i < upto && i < events.length; i++) {
    const e = events[i];
    if (e.t === "caller") d.transcript.push({ who: "caller", text: e.text });
    else if (e.t === "agent") d.transcript.push({ who: "agent", text: e.text });
    else if (e.t === "clarify") d.transcript.push({ who: "agent", text: e.text, clarify: true });
    else if (e.t === "asr") d.asr = e.text;
    else if (e.t === "entity") d.entities.push({ label: e.label, concept: e.concept });
    else if (e.t === "rule") d.ruled = e.doc;
    else if (e.t === "confidence") d.confidence = e.v;
    else if (e.t === "route") d.route = e.doc;
    else if (e.t === "action") d.actions.push({ label: e.label, sys: e.sys });
  }
  return d;
}

function Bars({ active }: { active: boolean }) {
  const heights = [6, 11, 8, 14, 9, 13, 7, 12, 8, 10, 6, 11];
  return (
    <div className="flex items-center gap-[3px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[#1e6b3c]"
          style={{
            height: h,
            opacity: active ? 0.85 : 0.25,
            animation: active ? `elsiaaBar 900ms ${i * 70}ms infinite ease-in-out` : "none",
          }}
        />
      ))}
    </div>
  );
}

export function IntakeOS() {
  const reduced = useReduced();
  const [scn, setScn] = useState(0);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number>(0);
  const s = SCENARIOS[scn];
  const total = s.events.length;

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const cur = s.events[step];
    const delay = reduced
      ? 0
      : cur.t === "caller" || cur.t === "agent" || cur.t === "clarify"
        ? 1100
        : cur.t === "action"
          ? 650
          : 520;
    timer.current = window.setTimeout(() => setStep((n) => n + 1), delay);
    return () => window.clearTimeout(timer.current);
  }, [playing, step, total, s, reduced]);

  const load = (i: number) => {
    setScn(i);
    setStep(0);
    setPlaying(false);
  };
  const run = () => {
    if (step >= total) setStep(0);
    setPlaying(true);
  };
  const restart = () => {
    setStep(0);
    setPlaying(false);
  };

  const d = derive(s.events, step);
  const listening =
    playing &&
    !reduced &&
    step < total &&
    (s.events[step]?.t === "caller" || s.events[step]?.t === "asr");
  const status =
    step === 0
      ? "Idle — press Run call"
      : step >= total
        ? "Call complete"
        : listening
          ? "Listening…"
          : "Agent working…";

  return (
    <div>
      {/* scenario chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-[#111111]/35 " style={mono}>
          Try a call
        </span>
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.id}
            onClick={() => load(i)}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold tracking-[0.04em] transition-all ${i === scn ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.07] text-[#1e6b3c]" : "border-black/12 text-[#111111]/55 hover:border-[#1e6b3c]/40"}`}
            style={{ ...mono, transitionTimingFunction: SPRING }}
          >
            {sc.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ===== FRONT END: the call ===== */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-black/[0.09] bg-white shadow-[0_40px_100px_-55px_rgba(17,17,17,0.5)]">
          <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#FBFBFA] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full bg-[#1e6b3c]/10 px-2 py-0.5 text-[8.5px] font-bold text-[#1e6b3c] "
                style={mono}
              >
                ● Voice
              </span>
              <span className="text-[13px] font-semibold" style={inter}>
                Intake line
              </span>
            </div>
            <span className="text-[13px] text-[#111111]/40 " style={mono}>
              Front end · caller
            </span>
          </div>
          <div
            className="border-b border-black/[0.06] px-4 py-2 text-[13px] tracking-[0.06em] text-[#111111]/45"
            style={mono}
          >
            Vista Eye — neuro-ophthalmology & surgery
          </div>

          <div className="min-h-[280px] flex-1 space-y-2.5 px-4 py-4">
            {d.transcript.length === 0 && (
              <p className="text-[13px] text-[#111111]/40" style={mono}>
                Press Run call — the caller speaks in plain language.
              </p>
            )}
            {d.transcript.map((t, i) => (
              <div
                key={i}
                className={`flex ${t.who === "agent" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${t.who === "agent" ? (t.clarify ? "bg-[#b7791f]/[0.10] text-[#111111]" : "bg-[#1e6b3c]/[0.08] text-[#111111]") : "bg-black/[0.04] text-[#111111]/80"}`}
                  style={inter}
                >
                  <span
                    className={`mb-0.5 block text-[13px]  ${t.who === "agent" ? (t.clarify ? "text-[#8a5a12]" : "text-[#1e6b3c]") : "text-[#111111]/35"}`}
                    style={mono}
                  >
                    {t.who === "agent" ? (t.clarify ? "Agent · clarifying" : "Agent") : "Caller"}
                  </span>
                  {t.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-black/[0.06] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border ${listening ? "border-[#1e6b3c]" : "border-black/15"}`}
              >
                <Bars active={listening} />
              </span>
              <span className="text-[13px] text-[#111111]/50 " style={mono}>
                {status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={restart}
                  className="text-[13px] text-[#111111]/40  hover:text-[#111111]/70"
                  style={mono}
                >
                  Restart
                </button>
              )}
              <button
                onClick={playing ? () => setPlaying(false) : run}
                className="rounded-full bg-[#1e6b3c] px-5 py-2 text-[13px] font-bold text-white  transition-all hover:bg-[#111111]"
                style={{ ...mono, transitionTimingFunction: SPRING }}
              >
                {playing ? "Pause" : step >= total ? "Replay" : "Run call"}
              </button>
            </div>
          </div>
        </div>

        {/* ===== BACK END: the system ===== */}
        <div className="overflow-hidden rounded-2xl border border-black/[0.09] bg-[#FBFBFA]">
          <div className="flex items-center justify-between border-b border-black/[0.06] bg-white px-4 py-2.5">
            <span className="text-[13px] font-semibold" style={inter}>
              Intake OS · runtime
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#1e6b3c]" />
              <span className="text-[13px] text-[#1e6b3c] " style={mono}>
                Back end · live
              </span>
            </span>
          </div>

          <div className="space-y-3 p-4">
            {/* 1 · transcription */}
            <Module n="1" title="Transcription · ASR" hint={s.lang === "EN" ? "English" : s.lang}>
              <p className="text-[13px] leading-relaxed text-[#111111]/75" style={inter}>
                {d.asr ? (
                  <>
                    “{d.asr}
                    <span className="text-[#1e6b3c]">{playing && listening ? "▏" : ""}</span>”
                  </>
                ) : (
                  <span className="text-[#111111]/35" style={mono}>
                    awaiting speech…
                  </span>
                )}
              </p>
            </Module>

            {/* 2 · NLU */}
            <Module
              n="2"
              title="Symptom extraction · clinical NLU"
              hint={`${d.entities.length} found`}
            >
              {d.entities.length === 0 ? (
                <span className="text-[13px] text-[#111111]/35" style={mono}>
                  listening for symptoms…
                </span>
              ) : (
                <div className="space-y-1.5">
                  {d.entities.map((en, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-2 text-[11.5px]"
                      style={inter}
                    >
                      <span
                        className="rounded bg-black/[0.05] px-1.5 py-0.5 text-[13px] text-[#111111]/55"
                        style={mono}
                      >
                        {en.label}
                      </span>
                      <span className="text-[#111111]/30">→</span>
                      <span className="font-medium text-[#1e6b3c]">{en.concept}</span>
                    </div>
                  ))}
                </div>
              )}
            </Module>

            {/* 3 · decision logic */}
            <Module n="3" title="Decision logic · doctor-matching" hint="deterministic">
              <div className="space-y-1.5">
                {DOCS.map((doc) => {
                  const on = d.ruled === doc.id || d.route === doc.id;
                  const isRoute = d.route === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-lg border px-2.5 py-2 transition-all ${on ? "border-[#1e6b3c]/40 bg-[#1e6b3c]/[0.06]" : "border-black/[0.07] bg-white"}`}
                      style={{ transitionTimingFunction: SPRING }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] font-semibold" style={inter}>
                          {doc.name}
                          <span className="ml-1.5 font-normal text-[#111111]/45">{doc.spec}</span>
                        </span>
                        {isRoute ? (
                          <span
                            className="rounded-full bg-[#1e6b3c] px-2 py-0.5 text-[13px] font-bold text-white "
                            style={mono}
                          >
                            Matched
                          </span>
                        ) : on ? (
                          <span className="text-[13px] text-[#1e6b3c] " style={mono}>
                            evaluating
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {doc.triggers.map((tr) => (
                          <span
                            key={tr}
                            className={`rounded px-1.5 py-0.5 text-[13px] ${on ? "bg-[#1e6b3c]/12 text-[#1e6b3c]" : "bg-black/[0.04] text-[#111111]/40"}`}
                            style={mono}
                          >
                            {tr}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* confidence */}
              <div className="mt-2.5">
                <div
                  className="flex items-center justify-between text-[13px] text-[#111111]/45 "
                  style={mono}
                >
                  <span>Routing confidence</span>
                  <span
                    className={
                      d.confidence >= 80
                        ? "text-[#1e6b3c]"
                        : d.confidence > 0
                          ? "text-[#8a5a12]"
                          : ""
                    }
                  >
                    {d.confidence ? `${d.confidence}%` : "—"}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${d.confidence}%`,
                      background: d.confidence >= 80 ? GREEN : "#b7791f",
                      transitionTimingFunction: SPRING,
                    }}
                  />
                </div>
                {d.confidence > 0 && d.confidence < 80 && (
                  <p className="mt-1.5 text-[13px] text-[#8a5a12]" style={mono}>
                    Below 80% → asks one clarifying question. Never books on a guess.
                  </p>
                )}
              </div>
            </Module>

            {/* 4 · actions */}
            <Module n="4" title="Actions · system connections" hint={`${d.actions.length} fired`}>
              {d.actions.length === 0 ? (
                <span className="text-[13px] text-[#111111]/35" style={mono}>
                  no side effects until a match is confirmed
                </span>
              ) : (
                <div className="space-y-1.5">
                  {d.actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <span className="flex h-4 w-4 flex-none items-center justify-center rounded-full bg-[#1e6b3c]">
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3.5"
                        >
                          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-[13px] text-[#1e6b3c] " style={mono}>
                        {a.sys}
                      </span>
                      <span className="text-[11.5px] text-[#111111]/75" style={inter}>
                        {a.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Module>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[13px] text-[#111111]/45" style={mono}>
        {s.caption}
      </p>

      {/* metrics */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.05] md:grid-cols-4">
        {[
          ["Calls contained", "83%"],
          ["Avg time to booked", "41s"],
          ["Mis-routes", "0.4%"],
          ["Answered", "24/7"],
        ].map(([l, v]) => (
          <div key={l} className="bg-white px-3 py-3">
            <p className="truncate text-[13px] text-[#111111]/40 " style={mono}>
              {l}
            </p>
            <p
              className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-[#111111]"
              style={inter}
            >
              {v}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Module({
  n,
  title,
  hint,
  children,
}: {
  n: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-black/[0.08] bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] text-[#1e6b3c] font-bold" style={mono}>
            {n}
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.01em]" style={inter}>
            {title}
          </span>
        </div>
        {hint && (
          <span className="text-[13px] text-[#111111]/35 " style={mono}>
            {hint}
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
