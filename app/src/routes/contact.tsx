import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Let's talk. The first 20 minutes are free. Tell us your business — we integrate the AI. Book a call or send ELSIAA a message.",
      },
      { property: "og:title", content: "Contact — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/contact" }],
  }),
  component: ContactPage,
});

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const eyebrow = "text-[10px] tracking-[0.34em] text-[#2e9e58] uppercase";

const STEPS: Array<[string, string, string]> = [
  ["01", "Free 20-min call", "We understand the problem."],
  ["02", "Scoped proposal", "A clear plan and price within 3 days."],
  ["03", "Design & build", "We build it, reviewed as we go."],
  ["04", "Launch", "It ships, live, into your workflow."],
  ["05", "Ongoing support", "We keep it running and improving."],
];

const OFFICES = ["New York", "Los Angeles", "London", "Geneva", "Antwerp", "Tel Aviv"];

function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0A1220] text-white">
      <SiteNav />

      {/* 1 · Hero */}
      <section className="mx-auto max-w-5xl px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <Reveal>
          <p className={eyebrow} style={mono}>Contact</p>
          <h1 className="mt-5 font-semibold tracking-[-0.045em]" style={{ ...inter, fontSize: "clamp(3rem, 8vw, 5.5rem)", lineHeight: 0.98 }}>
            Let's talk.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/70 md:text-xl" style={inter}>
            First 20 minutes are free.
          </p>
          <p className="mt-2 max-w-xl text-[15px] text-white/45" style={inter}>
            Tell us your business — we integrate the AI that runs it.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href="#book" className="inline-flex items-center justify-center rounded-full bg-[#2e9e58] px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:bg-white hover:text-[#0A1220]" style={mono}>
              Book a free 20-min call
            </a>
            <a href="#message" className="inline-flex items-center justify-center rounded-full border border-white/25 px-8 py-4 text-[12px] font-bold tracking-[0.2em] text-white uppercase transition-all hover:border-white hover:bg-white/[0.06]" style={mono}>
              Send us a message
            </a>
          </div>
        </Reveal>
      </section>

      {/* 2 · Message form */}
      <section id="message" className="scroll-mt-24 border-t border-white/[0.08] bg-white/[0.02] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <Reveal>
              <p className={eyebrow} style={mono}>Send a message</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>Tell us what you're working on.</h2>
              <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/55" style={inter}>
                A few sentences is plenty. We read every message and reply within a business day.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <MessageForm />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3 · Direct contact */}
      <section className="border-t border-white/[0.08] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-[15px] text-white/60" style={inter}>
            Or email us directly at{" "}
            <a href="mailto:info@elsiaa.com" className="font-medium text-[#2e9e58] underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#2e9e58]/40">info@elsiaa.com</a>.
          </p>
        </div>
      </section>

      {/* 4 · Book a call (calendar) */}
      <section id="book" className="scroll-mt-24 border-t border-white/[0.08] bg-white/[0.02] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <Reveal className="lg:sticky lg:top-32 lg:self-start">
              <p className={eyebrow} style={mono}>Book a call</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl" style={inter}>Pick a time that works.</h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/55" style={inter}>
                Twenty minutes, no charge. We'll confirm by email within a business day — you talk through the problem, we map where AI actually helps.
              </p>
            </Reveal>
            <Reveal delay={0.08}>
              <BookingCalendar />
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5 · How it works */}
      <section className="border-t border-white/[0.08] px-6 py-20 md:py-24">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl" style={inter}>From first call to running system</h2>
          </Reveal>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(([n, t, d], i) => (
              <Reveal key={n} delay={i * 0.05}>
                <li className="border-t border-white/15 pt-4">
                  <span className="text-[11px] font-semibold tracking-[0.24em] text-[#2e9e58]" style={mono}>{n}</span>
                  <h3 className="mt-2 text-[16px] font-semibold tracking-[-0.01em]" style={inter}>{t}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55" style={inter}>{d}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* 6 · Offices */}
      <section className="border-t border-white/[0.08] px-6 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-[10px] tracking-[0.28em] text-white/45 uppercase" style={mono}>Offices</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-lg font-medium tracking-[-0.01em] text-white md:text-xl" style={inter}>
            {OFFICES.map((o, i) => (
              <span key={o} className="flex items-center gap-3">
                {o}
                {i < OFFICES.length - 1 && <span className="text-white/25">·</span>}
              </span>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Message form — routes through the existing meeting pipeline.
    POST /api/meeting { name, email, company, topic, slotDate, slotTime }  */
/* ------------------------------------------------------------------ */
const NEXT_OPTIONS: Array<[string, string]> = [
  ["call", "Free 20-min call"],
  ["proposal", "Written proposal"],
  ["other", "Other"],
];

const fieldClass =
  "mt-2 min-h-[46px] w-full rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-[15px] text-white outline-none transition focus:border-[#2e9e58] focus-visible:ring-2 focus-visible:ring-[#2e9e58]/25 placeholder:text-white/35";

function MessageForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [looking, setLooking] = useState("");
  const [next, setNext] = useState("call");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const nextLabel = NEXT_OPTIONS.find(([v]) => v === next)?.[1] ?? "";

  const submit = async () => {
    if (!name.trim() || !emailValid) return;
    setSending(true);
    setError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const topic = `[Message form] Preferred next step: ${nextLabel}\n\nLooking for:\n${looking.trim() || "(not specified)"}`;
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, company, topic, slotDate: today, slotTime: "00:00" }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error("bad");
      setDone(true);
    } catch {
      setError("Couldn't send just now — please email us at info@elsiaa.com.");
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e9e58]/15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e9e58" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em]" style={inter}>Message sent.</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55" style={inter}>
          Thanks{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}. We'll reply within a business day
          {next === "call" ? " to set up your free call" : ""}.
        </p>
      </div>
    );
  }

  return (
    <form className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8" onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[13px] font-medium text-white/90" style={inter}>Full name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" className={fieldClass} style={inter} />
        </label>
        <label className="block">
          <span className="text-[13px] font-medium text-white/90" style={inter}>Company</span>
          <input value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" placeholder="Company name" className={fieldClass} style={inter} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="text-[13px] font-medium text-white/90" style={inter}>Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@company.com" className={fieldClass} style={inter} />
      </label>
      <label className="mt-4 block">
        <span className="text-[13px] font-medium text-white/90" style={inter}>What are you looking for?</span>
        <textarea value={looking} onChange={(e) => setLooking(e.target.value)} rows={4} placeholder="A few sentences on the problem you'd like to solve." className={`${fieldClass} min-h-[96px] resize-y`} style={inter} />
      </label>

      <fieldset className="mt-5">
        <legend className="text-[13px] font-medium text-white/90" style={inter}>Preferred next step</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {NEXT_OPTIONS.map(([v, label]) => {
            const on = next === v;
            return (
              <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-[13.5px] transition-all ${on ? "border-[#2e9e58] bg-[#2e9e58]/[0.10] text-white" : "border-white/15 text-white/60 hover:border-[#2e9e58]/50"}`} style={inter}>
                <input type="radio" name="next" value={v} checked={on} onChange={() => setNext(v)} className="h-4 w-4 accent-[#2e9e58]" />
                {label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="mt-4 text-[13px] text-red-400" style={inter} role="alert">{error}</p>}

      <button type="submit" disabled={sending || !name.trim() || !emailValid}
        className="mt-6 min-h-[48px] w-full rounded-full bg-[#2e9e58] px-8 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2e9e58]/40 enabled:hover:bg-white enabled:hover:text-[#0A1220] disabled:opacity-30 sm:w-auto"
        style={mono}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking calendar — the free 20-minute call. Backend preserved:
    POST /api/meeting { name, email, company, topic, slotDate, slotTime }  */
/* ------------------------------------------------------------------ */
const HOURS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

function slotHash(date: string, time: string): number {
  const s = `${date}T${time}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
const isBooked = (date: string, time: string) => slotHash(date, time) < 0.82;

type Day = { iso: string; label: string; dow: string; num: string };

function BookingCalendar() {
  const [days, setDays] = useState<Day[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<{ date: string; time: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const out: Day[] = [];
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (out.length < 14) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        out.push({
          iso: d.toISOString().slice(0, 10),
          label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          dow: d.toLocaleDateString("en-US", { weekday: "short" }),
          num: d.toLocaleDateString("en-US", { day: "numeric" }),
        });
      }
      d.setDate(d.getDate() + 1);
    }
    setDays(out);
  }, []);

  const day = days[dayIdx];
  const openCount = useMemo(() => (day ? HOURS.filter((h) => !isBooked(day.iso, h)).length : 0), [day]);
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const selectDay = (i: number) => { setDayIdx(i); setPicked(null); setError(""); };

  const submit = async () => {
    if (!picked) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, company, topic, slotDate: picked.date, slotTime: picked.time }),
      });
      const data = (await res.json()) as { ok: boolean };
      if (!data.ok) throw new Error("bad");
      setDone(true);
    } catch {
      setError("Could not send your request — please try again.");
    } finally {
      setSending(false);
    }
  };

  if (done && picked) {
    const d = days.find((x) => x.iso === picked.date);
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2e9e58]/15">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e9e58" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <p className={`mt-5 ${eyebrow}`} style={mono}>Request sent</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" style={inter}>{d ? `${d.dow}, ${d.label}` : picked.date} at {picked.time}</h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-white/55" style={inter}>
          Thank you{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}. Your free 20-minute call is requested — we'll confirm the slot by email within a business day. If it's taken by the time we see it, we'll propose the nearest open time.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-6 py-4 md:px-8">
        <p className={eyebrow} style={mono}>Free intro call · 20 min</p>
        <p className="text-[11px] tracking-[0.14em] text-white/45 uppercase" style={mono}>{picked ? "Step 2 · Details" : "Step 1 · Time"}</p>
      </div>

      <div className="p-6 md:p-8">
        <span className="sr-only" id="cal-day-label">Choose a day</span>
        <div role="tablist" aria-labelledby="cal-day-label" className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d, i) => {
            const on = i === dayIdx;
            return (
              <button key={d.iso} role="tab" aria-selected={on} aria-label={`${d.dow} ${d.label}`} onClick={() => selectDay(i)}
                className={`flex min-h-[64px] w-[60px] flex-none flex-col items-center justify-center rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2e9e58]/40 ${on ? "border-[#2e9e58] bg-[#2e9e58] text-white" : "border-white/12 bg-white/[0.02] text-white/70 hover:border-[#2e9e58]/50"}`}>
                <span className="text-[10px] tracking-[0.12em] uppercase opacity-70" style={mono}>{d.dow}</span>
                <span className="mt-1 text-[17px] font-semibold leading-none" style={inter}>{d.num}</span>
              </button>
            );
          })}
        </div>

        {day && (
          <>
            <div className="mt-5 flex items-center gap-2">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${openCount === 0 ? "bg-white/25" : "bg-[#2e9e58]"}`} />
              <p className="text-[12px] text-white/55" style={mono}>
                {openCount === 0 ? "Fully booked — try another day" : `${openCount} opening${openCount === 1 ? "" : "s"} on ${day.dow} ${day.label}`}
              </p>
            </div>

            <fieldset className="mt-3">
              <legend className="sr-only">Available times on {day.dow} {day.label}</legend>
              <div className="grid grid-cols-4 gap-2">
                {HOURS.map((h) => {
                  const booked = isBooked(day.iso, h);
                  const active = picked?.date === day.iso && picked?.time === h;
                  return (
                    <button key={h} type="button" disabled={booked} aria-pressed={active} aria-label={booked ? `${h} — booked` : `${h} — available`}
                      onClick={() => { setError(""); setPicked({ date: day.iso, time: h }); }}
                      className={`min-h-[46px] rounded-lg border text-[13.5px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2e9e58]/40 ${active ? "border-[#2e9e58] bg-[#2e9e58] font-semibold text-white" : booked ? "cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-white/25 line-through" : "border-[#2e9e58]/40 bg-white/[0.02] font-medium text-[#5fce93] hover:bg-[#2e9e58]/10"}`}
                      style={inter}>
                      {h}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {picked && (
          <form className="mt-7 border-t border-white/[0.08] pt-6" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <div className="flex items-center gap-2">
              <span className={eyebrow} style={mono}>Requesting</span>
              <span className="text-[13px] font-semibold" style={inter}>{days.find((d) => d.iso === picked.date)?.dow} {days.find((d) => d.iso === picked.date)?.label} · {picked.time}</span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="sr-only">Your name</span>
                <input className={fieldClass + " mt-0"} style={inter} placeholder="Your name *" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="block">
                <span className="sr-only">Email address</span>
                <input className={fieldClass + " mt-0"} style={inter} type="email" autoComplete="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Company (optional)</span>
              <input className={fieldClass + " mt-0"} style={inter} autoComplete="organization" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
            </label>
            <label className="mt-3 block">
              <span className="sr-only">What would you like to talk about?</span>
              <textarea className={`${fieldClass} mt-0 min-h-[84px] resize-y`} style={inter} placeholder="What would you like to talk about? (optional)" value={topic} onChange={(e) => setTopic(e.target.value)} />
            </label>

            {error && <p className="mt-3 text-[13px] text-red-400" style={inter} role="alert">{error}</p>}

            <button type="submit" disabled={sending || !name.trim() || !emailValid}
              className="mt-5 min-h-[48px] w-full rounded-full bg-[#2e9e58] px-8 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2e9e58]/40 enabled:hover:bg-white enabled:hover:text-[#0A1220] disabled:opacity-30 md:w-auto"
              style={mono}>
              {sending ? "Sending…" : "Request this slot"}
            </button>
            <p className="mt-3 text-[12px] text-white/45" style={inter}>We'll confirm by email — no charge, no obligation.</p>
          </form>
        )}
      </div>
    </div>
  );
}
