import { useEffect, useRef, useState } from "react";

/*
  Industry walkthrough — interactive, full-stack product tours.
  One industry at a time. Three steps, Apple-app pacing:
    1  The front — what a customer sees: a clean app conversation, auto-played.
    2  The system — the moving parts, lit in sequence as the call flows through.
    3  Under the hood — the raw backend: event stream + systems firing.
  A single clock drives each step's timeline; steps auto-advance; everything
  is replayable and clickable. Reduced motion → final states.
*/

const SANS =
  "var(--font-sans)";
const GREEN = "#1e6b3c";

type Msg = { from: "user" | "ai"; text: string };
type Stage = { name: string; desc: string };
type BackEv = { sys: string; text: string; ok?: boolean };

type Industry = {
  id: string;
  tab: string;
  pct: number;
  product: string;
  tagline: string;
  msgs: Msg[];
  stages: Stage[];
  backend: BackEv[];
  close: string;
};

const INDUSTRIES: Industry[] = [
  {
    id: "healthcare",
    tab: "Healthcare",
    pct: 66,
    product: "AI Clinic Secretary",
    tagline: "Answers every call. Books the right doctor. Writes the chart note.",
    msgs: [
      { from: "user", text: "Hi — my vision kind of splits into two when I'm reading at night." },
      { from: "ai", text: "That sounds like double vision that shows up with near work — that's exactly what our neuro-ophthalmologist, Dr. Marsh, handles." },
      { from: "ai", text: "She has Thursday 10:20 open. Want it?" },
      { from: "user", text: "Yes please." },
      { from: "ai", text: "Booked — Thursday 10:20 with Dr. Marsh. Confirmation and prep instructions are on your phone." },
    ],
    stages: [
      { name: "Listens", desc: "Live speech-to-text on the caller's own words — no phone tree, no hold music." },
      { name: "Understands", desc: "\u201cSplits into two\u201d is mapped to the clinical concept: binocular diplopia." },
      { name: "Decides", desc: "Deterministic rules match the symptom to the right specialist — never a guess." },
      { name: "Acts", desc: "Holds the slot, writes the chart note, texts the patient. Done in one call." },
    ],
    backend: [
      { sys: "ASR", text: "transcript: \u201cvision kind of splits into two … reading at night\u201d" },
      { sys: "NLU", text: "entity \u2192 Diplopia (binocular) · trigger: near work" },
      { sys: "Rules", text: "match: Dr. Marsh — neuro-ophthalmology · confidence 92%" },
      { sys: "Calendar", text: "hold Thu 10:20 · Dr. Marsh", ok: true },
      { sys: "EHR", text: "intake note created · symptom summary attached", ok: true },
      { sys: "SMS", text: "confirmation + prep instructions sent", ok: true },
    ],
    close: "Every missed call is a missed patient. This one never misses.",
  },
  {
    id: "finance",
    tab: "Finance",
    pct: 91,
    product: "AI Back-Office Desk",
    tagline: "Reads every invoice. Reconciles every ledger line. Flags what humans should see.",
    msgs: [
      { from: "user", text: "Forwarding this month's vendor invoices — 214 PDFs." },
      { from: "ai", text: "Received. Extracting line items and matching against open POs now." },
      { from: "ai", text: "212 reconciled clean. 2 flagged: one duplicate, one 8% over contract rate." },
      { from: "user", text: "Show me the overage." },
      { from: "ai", text: "Meridian Logistics — invoice #4471, $2,340 above the contracted rate. Draft dispute email is ready for your review." },
    ],
    stages: [
      { name: "Ingests", desc: "Every invoice, statement, and PO — parsed the moment it arrives." },
      { name: "Matches", desc: "Three-way match against POs and receipts, line by line." },
      { name: "Flags", desc: "Duplicates, overages, and anomalies surface — everything else clears silently." },
      { name: "Posts", desc: "Clean entries post to the ledger. Exceptions wait for one human click." },
    ],
    backend: [
      { sys: "OCR", text: "214 documents parsed · 3,187 line items extracted" },
      { sys: "Match", text: "3-way match vs PO + receipt · 212/214 clean" },
      { sys: "Anomaly", text: "dup detected #4462 · rate variance +8% #4471" },
      { sys: "Ledger", text: "212 entries posted to GL", ok: true },
      { sys: "Queue", text: "2 exceptions \u2192 controller review", ok: true },
      { sys: "Email", text: "dispute draft prepared · awaiting approval", ok: true },
    ],
    close: "The desks that aren't running this are being priced out by the ones that are.",
  },
  {
    id: "marketing",
    tab: "Marketing",
    pct: 71,
    product: "AI Creative Engine",
    tagline: "One brief in. A month of on-brand content out — measured, not guessed.",
    msgs: [
      { from: "user", text: "We're launching the spring line next week. Need the full push." },
      { from: "ai", text: "Pulling your brand system and last quarter's top performers. Building the campaign now." },
      { from: "ai", text: "Ready: 12 ad variants, 30 social posts, 4 emails — all in your voice, sized per channel." },
      { from: "user", text: "The second ad concept — make it bolder." },
      { from: "ai", text: "Done. Three bolder takes generated. Variant B is closest to your best-performing creative from March." },
    ],
    stages: [
      { name: "Learns", desc: "Your brand voice, palette, and what actually converted — not generic output." },
      { name: "Produces", desc: "Studio-grade creative across every channel, in hours instead of weeks." },
      { name: "Adapts", desc: "Every asset resized, rewritten, and reformatted per platform automatically." },
      { name: "Measures", desc: "Performance feeds back in — the next batch starts smarter than the last." },
    ],
    backend: [
      { sys: "Brand", text: "voice model loaded · palette + type system applied" },
      { sys: "Gen", text: "12 ad variants · 30 posts · 4 emails rendered" },
      { sys: "Fit", text: "auto-crop + copy-fit per channel: IG, TikTok, email, web" },
      { sys: "Score", text: "variant B \u2192 0.87 similarity to top March creative", ok: true },
      { sys: "DAM", text: "assets versioned and pushed to library", ok: true },
      { sys: "Sched", text: "30-day calendar staged for approval", ok: true },
    ],
    close: "Entire creative departments, compressed into a system that ships daily.",
  },
  {
    id: "retail",
    tab: "Retail",
    pct: 63,
    product: "AI Store Operator",
    tagline: "Answers customers, tracks stock, and recovers abandoned carts — around the clock.",
    msgs: [
      { from: "user", text: "Do you have the leather weekender in tan? Need it before Friday." },
      { from: "ai", text: "Yes — 3 left in tan. With express shipping it lands Thursday. Want me to hold one?" },
      { from: "user", text: "Hold it. Actually — does it fit under an airline seat?" },
      { from: "ai", text: "It's 21.5\u2033 — fits carry-on for all major US carriers. I've held yours; checkout link is in your messages." },
      { from: "ai", text: "Order confirmed. Tracking will follow tonight." },
    ],
    stages: [
      { name: "Answers", desc: "Real product answers from live inventory — not canned replies." },
      { name: "Sells", desc: "Holds stock, applies the right shipping promise, closes the sale in-chat." },
      { name: "Recovers", desc: "Abandoned carts get a perfectly-timed, personal nudge — not a blast." },
      { name: "Restocks", desc: "Demand signals flow straight to purchasing before the shelf goes empty." },
    ],
    backend: [
      { sys: "Inv", text: "SKU WK-TAN · 3 on hand · ATL warehouse" },
      { sys: "Ship", text: "express \u2192 ETA Thu · carrier rules verified" },
      { sys: "Cart", text: "hold placed · 30-min reservation on unit" },
      { sys: "Pay", text: "checkout link issued · order #8842 captured", ok: true },
      { sys: "CRM", text: "customer profile updated · size/fit preference saved", ok: true },
      { sys: "Buy", text: "reorder signal: tan weekender velocity +40%", ok: true },
    ],
    close: "The registers learned faster than the staff. Yours can too.",
  },
  {
    id: "manufacturing",
    tab: "Manufacturing",
    pct: 55,
    product: "AI Floor Monitor",
    tagline: "Watches every line, predicts every failure, schedules the fix before the breakdown.",
    msgs: [
      { from: "user", text: "Line 3 sounded off during the night shift. Anything?" },
      { from: "ai", text: "Caught it at 2:14 AM — bearing vibration on press 3B drifted 18% above baseline." },
      { from: "ai", text: "Failure projected in 6–9 days. I've scheduled replacement for Sunday's planned downtime." },
      { from: "user", text: "Parts?" },
      { from: "ai", text: "Bearing kit is in stock at the Cleveland depot — transfer arrives Friday. Work order and lockout procedure are ready." },
    ],
    stages: [
      { name: "Listens", desc: "Vibration, temperature, and current on every machine — sampled continuously." },
      { name: "Predicts", desc: "Drift from baseline becomes a failure window, days before the breakdown." },
      { name: "Schedules", desc: "The fix lands inside planned downtime — never as a 3 AM emergency." },
      { name: "Supplies", desc: "Parts, work orders, and safety procedures staged before the wrench moves." },
    ],
    backend: [
      { sys: "Sensor", text: "press 3B · vibration 18% over baseline @ 02:14" },
      { sys: "Model", text: "RUL estimate: 6–9 days · confidence 84%" },
      { sys: "CMMS", text: "work order #2291 created · Sunday window", ok: true },
      { sys: "Parts", text: "bearing kit located · Cleveland depot · transfer Fri", ok: true },
      { sys: "Safety", text: "lockout/tagout procedure attached", ok: true },
      { sys: "Report", text: "shift summary posted to plant manager", ok: true },
    ],
    close: "The night shift doesn't sleep anymore — it computes. Put it on your floor.",
  },
];

function useReduced() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return r;
}

const STEPS = ["The front", "The system", "Under the hood"];

export function IndustryWalkthrough() {
  const [ind, setInd] = useState(0);
  const [step, setStep] = useState(0);
  const [tick, setTick] = useState(0); // items revealed in current step
  const [playing, setPlaying] = useState(true);
  const reduced = useReduced();
  const hostRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const data = INDUSTRIES[ind];

  const stepLen = step === 0 ? data.msgs.length : step === 1 ? data.stages.length : data.backend.length;

  // start when scrolled into view
  useEffect(() => {
    const el = hostRef.current;
    if (!el || started.current) return;
    const io = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) {
          started.current = true;
          io.disconnect();
          setPlaying(true);
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the clock
  useEffect(() => {
    if (reduced) {
      setTick(stepLen);
      return;
    }
    if (!playing || !started.current) return;
    if (tick >= stepLen) {
      // step finished → advance after a beat
      if (step < 2) {
        const t = setTimeout(() => {
          setStep(step + 1);
          setTick(0);
        }, 1600);
        return () => clearTimeout(t);
      }
      setPlaying(false);
      return;
    }
    const delay = step === 0 ? 1500 : step === 1 ? 1100 : 700;
    const t = setTimeout(() => setTick(tick + 1), delay);
    return () => clearTimeout(t);
  }, [playing, tick, step, stepLen, reduced]);

  const go = (i: number) => {
    setInd(i);
    setStep(0);
    setTick(0);
    setPlaying(true);
    started.current = true;
  };
  const goStep = (s: number) => {
    setStep(s);
    setTick(0);
    setPlaying(true);
    started.current = true;
  };

  const done = step === 2 && tick >= stepLen;

  return (
    <div ref={hostRef} style={{ fontFamily: SANS }}>
      {/* industry tabs */}
      <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {INDUSTRIES.map((it, i) => (
          <button
            key={it.id}
            onClick={() => go(i)}
            className={`flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-[14px] font-medium transition-all duration-300 ${
              i === ind
                ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                : "border-black/[0.12] bg-white text-[#111111]/70 hover:border-black/30"
            }`}
          >
            {it.tab}
            <span className={`text-[13px] font-bold ${i === ind ? "text-white/80" : "text-[#1e6b3c]"}`}>{it.pct}%</span>
          </button>
        ))}
      </div>

      {/* product header */}
      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="text-[24px] font-semibold tracking-[-0.02em] text-[#111111] md:text-[28px]">{data.product}</h3>
          <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-[#111111]/60">{data.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/insights#sources" className="rounded-full border border-black/[0.1] px-3.5 py-1.5 text-[13px] font-medium text-[#111111]/50 transition-colors hover:border-black/30 hover:text-[#111111]/80">
            {data.pct}% adoption — source ↗
          </a>
          <button
            onClick={() => goStep(0)}
            className="inline-flex min-h-[44px] items-center rounded-full border border-black/[0.15] px-4 text-[13px] font-medium text-[#111111]/70 transition-colors hover:border-black/40"
          >
            {done ? "Replay ↺" : "Restart ↺"}
          </button>
        </div>
      </div>

      {/* step rail */}
      <div className="mt-5 flex items-center gap-1">
        {STEPS.map((s, i) => (
          <button key={s} onClick={() => goStep(i)} className="group flex flex-1 flex-col gap-2 text-left">
            <span className={`flex items-center gap-2 text-[14px] font-medium transition-colors ${i === step ? "text-[#111111]" : "text-[#111111]/40 group-hover:text-[#111111]/70"}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-bold transition-all ${
                  i < step || done ? "bg-[#1e6b3c] text-white" : i === step ? "border-2 border-[#1e6b3c] text-[#1e6b3c]" : "border border-black/20 text-[#111111]/40"
                }`}
              >
                {i < step || done ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </span>
            <span className="h-[3px] w-full overflow-hidden rounded-full bg-black/[0.07]">
              <span
                className="block h-full rounded-full bg-[#1e6b3c] transition-all duration-500"
                style={{ width: i < step || done ? "100%" : i === step ? `${(tick / stepLen) * 100}%` : "0%" }}
              />
            </span>
          </button>
        ))}
      </div>

      {/* stage */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-black/[0.08] bg-[#fafaf8]">
        {step === 0 && <FrontStage key={`f-${ind}`} data={data} tick={tick} />}
        {step === 1 && <SystemStage key={`s-${ind}`} data={data} tick={tick} />}
        {step === 2 && <BackStage key={`b-${ind}`} data={data} tick={tick} />}
      </div>

      {/* closer */}
      <div
        className="mt-5 flex flex-wrap items-center justify-between gap-4 transition-opacity duration-700"
        style={{ opacity: done ? 1 : 0.35 }}
      >
        <p className="text-[15px] font-medium text-[#111111]">{data.close}</p>
        <a
          href="/quote"
          className="inline-flex items-center gap-2 rounded-full bg-[#1e6b3c] px-6 py-3 text-[14px] font-semibold text-white transition-all duration-300 hover:opacity-90"
        >
          Build this for my business →
        </a>
      </div>
    </div>
  );
}

/* ---- step 1: the clean front end, phone frame ---- */
function FrontStage({ data, tick }: { data: Industry; tick: number }) {
  const shown = data.msgs.slice(0, tick);
  const typing = tick < data.msgs.length && tick > 0;
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [tick]);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_320px]">
      <div className="flex flex-col justify-center gap-3 p-7 md:p-10">
        <p className="text-[13px] font-bold text-[#1e6b3c]">1 · The front</p>
        <h4 className="text-[20px] font-semibold text-[#111111]">What your customer sees</h4>
        <p className="max-w-md text-[15px] leading-relaxed text-[#111111]/60">
          Clean, instant, human. No menus, no hold music, no forms — a conversation that
          simply gets the thing done.
        </p>
      </div>
      <div className="flex justify-center p-6 md:p-8">
        <div className="w-full max-w-[300px] overflow-hidden rounded-[28px] border border-black/[0.1] bg-white shadow-[0_20px_50px_-20px_rgba(0,0,0,0.25)]">
          <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e6b3c] text-[13px] font-bold text-white">E</span>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold text-[#111111]">{data.product}</p>
              <p className="flex items-center gap-1 text-[11.5px] text-[#111111]/45">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" /> online
              </p>
            </div>
          </div>
          <div ref={boxRef} className="flex h-[340px] flex-col gap-2 overflow-y-auto p-3.5">
            {shown.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug ${
                  m.from === "ai"
                    ? "self-start rounded-bl-md bg-black/[0.05] text-[#111111]"
                    : "self-end rounded-br-md bg-[#1e6b3c] text-white"
                }`}
                style={{ animation: "iwPop .35s cubic-bezier(.2,.8,.2,1)" }}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="flex gap-1 self-start rounded-2xl rounded-bl-md bg-black/[0.05] px-4 py-3">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-black/30" style={{ animation: `iwBlink 1s ${d * 0.18}s infinite` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes iwPop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
        @keyframes iwBlink { 0%,100% { opacity: .25 } 50% { opacity: .9 } }
      `}</style>
    </div>
  );
}

/* ---- step 2: the system, stages lighting up ---- */
function SystemStage({ data, tick }: { data: Industry; tick: number }) {
  return (
    <div className="p-7 md:p-10">
      <p className="text-[13px] font-bold text-[#1e6b3c]">2 · The system</p>
      <h4 className="mt-2 text-[20px] font-semibold text-[#111111]">What's actually happening</h4>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.stages.map((s, i) => {
          const on = i < tick;
          return (
            <div
              key={s.name}
              className={`relative rounded-2xl border p-5 transition-all duration-500 ${
                on ? "border-[#1e6b3c]/40 bg-white shadow-[0_10px_30px_-15px_rgba(30,107,60,0.35)]" : "border-black/[0.06] bg-white/50 opacity-45"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold transition-colors duration-500 ${
                  on ? "bg-[#1e6b3c] text-white" : "bg-black/[0.06] text-[#111111]/40"
                }`}
              >
                {i + 1}
              </span>
              <p className="mt-3 text-[16px] font-semibold text-[#111111]">{s.name}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/60">{s.desc}</p>
              {i < data.stages.length - 1 && (
                <span
                  className={`absolute top-1/2 -right-2 hidden h-[2px] w-4 -translate-y-1/2 transition-colors duration-500 lg:block ${on ? "bg-[#1e6b3c]/50" : "bg-black/[0.08]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- step 3: under the hood, raw console ---- */
function BackStage({ data, tick }: { data: Industry; tick: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: "smooth" });
  }, [tick]);
  const systems = Array.from(new Set(data.backend.map((e) => e.sys)));
  const fired = new Set(data.backend.slice(0, tick).map((e) => e.sys));
  return (
    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
      <div className="flex flex-col gap-3 border-b border-black/[0.06] p-7 md:border-r md:border-b-0 md:p-8">
        <p className="text-[13px] font-bold text-[#1e6b3c]">3 · Under the hood</p>
        <h4 className="text-[20px] font-semibold text-[#111111]">Unpacked</h4>
        <p className="text-[13.5px] leading-relaxed text-[#111111]/60">
          The same five seconds, seen from the inside — every system this conversation touched.
        </p>
        <div className="mt-2 flex flex-wrap gap-2 md:flex-col md:gap-2">
          {systems.map((s) => (
            <span
              key={s}
              className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-500 ${
                fired.has(s) ? "border-[#1e6b3c]/40 bg-[#1e6b3c]/[0.07] text-[#1e6b3c]" : "border-black/[0.08] text-[#111111]/35"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${fired.has(s) ? "bg-[#1e6b3c]" : "bg-black/20"}`} />
              {s}
            </span>
          ))}
        </div>
      </div>
      <div ref={boxRef} className="h-[320px] overflow-y-auto bg-[#111111] p-5 md:h-[360px]">
        {data.backend.slice(0, tick).map((e, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-white/[0.05] py-2.5" style={{ animation: "iwPop .3s ease" }}>
            <span className={`mt-0.5 w-16 flex-none text-right text-[12.5px] font-bold ${e.ok ? "text-[#5cc884]" : "text-white/45"}`}>{e.sys}</span>
            <span className="text-[13.5px] leading-snug text-white/85">{e.text}</span>
            {e.ok && <span className="ml-auto text-[13px] text-[#5cc884]">✓</span>}
          </div>
        ))}
        {tick >= data.backend.length && (
          <p className="pt-4 text-[13px] font-medium text-[#5cc884]" style={{ animation: "iwPop .4s ease" }}>
            ● complete — {data.backend.filter((e) => e.ok).length} actions executed, zero humans interrupted
          </p>
        )}
      </div>
    </div>
  );
}
