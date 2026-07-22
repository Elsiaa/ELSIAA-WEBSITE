import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Request a free 20-minute call with ELSIAA, browse our packages, or get your project quoted.",
      },
      { property: "og:title", content: "Contact Us — ELSIAA" },
      { property: "og:image", content: "https://elsiaa.higgsfield.app/assets/og_cover.png" },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/contact" }],
  }),
  component: ContactPage,
});

const mono = { fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" } as const;
const inter = { fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

const eyebrow = "text-[10px] tracking-[0.34em] text-[#1e6b3c] uppercase";

function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />

      <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 md:pt-44 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          {/* left rail — context, not a re-pitch */}
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className={eyebrow} style={mono}>
              Book a call
            </p>
            <h1
              className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-5xl"
              style={inter}
            >
              Twenty minutes.
              <br />
              On us.
            </h1>
            <p
              className="mt-5 max-w-md text-[15px] leading-relaxed text-[#111111]/55"
              style={inter}
            >
              Pick a time that works. You talk through the problem, we map where AI
              actually pays off — a straight answer, no deck, no obligation.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                ["20 min", "A focused working session, not a sales call."],
                ["No cost", "The first conversation is always free."],
                ["By email", "We confirm your slot within a business day."],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4">
                  <span
                    className="mt-[3px] w-16 flex-none text-[10px] tracking-[0.14em] text-[#1e6b3c] uppercase"
                    style={mono}
                  >
                    {k}
                  </span>
                  <span className="text-[14px] leading-relaxed text-[#111111]/70" style={inter}>
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-black/[0.06] pt-6">
              <p className="text-[13.5px] leading-relaxed text-[#111111]/55" style={inter}>
                Prefer to write, or already know the scope?
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                <a
                  href="mailto:isya@elsiaa.com"
                  className="w-fit text-[14px] font-medium text-[#1e6b3c] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40"
                  style={inter}
                >
                  isya@elsiaa.com
                </a>
                <a
                  href="/quote"
                  className="w-fit text-[14px] font-medium text-[#1e6b3c] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40"
                  style={inter}
                >
                  Get your project quoted →
                </a>
              </div>
            </div>
          </Reveal>

          {/* right — the booking surface */}
          <Reveal delay={0.08}>
            <BookingCalendar />
          </Reveal>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking calendar — inline surface for the free 20-minute call.
    Preserves the existing backend wiring exactly:
    POST /api/meeting  { name, email, company, topic, slotDate, slotTime }
    → { ok: boolean }
    Most slots read as already booked (we're busy); an open slot can be
    requested and we confirm by email.                                  */
/* ------------------------------------------------------------------ */

const HOURS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];

// Deterministic pseudo-random per (date, time) so the same slots read as
// booked for every visitor and every visit.
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

  // Build the day strip client-side (avoids SSR/client date drift).
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
  const openCount = useMemo(
    () => (day ? HOURS.filter((h) => !isBooked(day.iso, h)).length : 0),
    [day],
  );
  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

  const selectDay = (i: number) => {
    setDayIdx(i);
    setPicked(null);
    setError("");
  };

  const submit = async () => {
    if (!picked) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name, email, company, topic,
          slotDate: picked.date, slotTime: picked.time,
        }),
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

  /* ---------- confirmation state ---------- */
  if (done && picked) {
    const d = days.find((x) => x.iso === picked.date);
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white p-8 shadow-[0_1px_30px_-12px_rgba(0,0,0,0.12)] md:p-10">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1e6b3c]/10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <p className={`mt-5 ${eyebrow}`} style={mono}>
          Request sent
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" style={inter}>
          {d ? `${d.dow}, ${d.label}` : picked.date} at {picked.time}
        </h3>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
          Thank you{name.trim() ? `, ${name.trim().split(" ")[0]}` : ""}. Your free
          20-minute call is requested — we'll confirm the slot by email within a
          business day. If it's taken by the time we see it, we'll propose the
          nearest open time.
        </p>
        <a
          href="/quote"
          className="mt-7 inline-block text-[13px] font-medium text-[#1e6b3c] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40"
          style={inter}
        >
          While you wait — get your project quoted →
        </a>
      </div>
    );
  }

  /* ---------- booking state ---------- */
  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_30px_-12px_rgba(0,0,0,0.12)]">
      {/* header / stepper */}
      <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-6 py-4 md:px-8">
        <p className={eyebrow} style={mono}>
          Free intro call · 20 min
        </p>
        <p className="text-[11px] tracking-[0.14em] text-[#111111]/45 uppercase" style={mono}>
          {picked ? "Step 2 · Details" : "Step 1 · Time"}
        </p>
      </div>

      <div className="p-6 md:p-8">
        {/* day strip */}
        <span className="sr-only" id="cal-day-label">Choose a day</span>
        <div
          role="tablist"
          aria-labelledby="cal-day-label"
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {days.map((d, i) => {
            const on = i === dayIdx;
            return (
              <button
                key={d.iso}
                role="tab"
                aria-selected={on}
                aria-label={`${d.dow} ${d.label}`}
                onClick={() => selectDay(i)}
                className={`flex min-h-[64px] w-[60px] flex-none flex-col items-center justify-center rounded-xl border transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 ${
                  on
                    ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                    : "border-black/[0.08] bg-white text-[#111111]/70 hover:border-[#1e6b3c]/40"
                }`}
              >
                <span className="text-[10px] tracking-[0.12em] uppercase opacity-70" style={mono}>{d.dow}</span>
                <span className="mt-1 text-[17px] font-semibold leading-none" style={inter}>{d.num}</span>
              </button>
            );
          })}
        </div>

        {day && (
          <>
            <div className="mt-5 flex items-center gap-2">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${openCount === 0 ? "bg-[#111111]/25" : "bg-[#1e6b3c]"}`}
              />
              <p className="text-[12px] text-[#111111]/55" style={mono}>
                {openCount === 0
                  ? "Fully booked — try another day"
                  : `${openCount} opening${openCount === 1 ? "" : "s"} on ${day.dow} ${day.label}`}
              </p>
            </div>

            <fieldset className="mt-3">
              <legend className="sr-only">Available times on {day.dow} {day.label}</legend>
              <div className="grid grid-cols-4 gap-2 md:grid-cols-4">
                {HOURS.map((h) => {
                  const booked = isBooked(day.iso, h);
                  const active = picked?.date === day.iso && picked?.time === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={booked}
                      aria-pressed={active}
                      aria-label={booked ? `${h} — booked` : `${h} — available`}
                      onClick={() => {
                        setError("");
                        setPicked({ date: day.iso, time: h });
                      }}
                      className={`min-h-[46px] rounded-lg border text-[13.5px] transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 ${
                        active
                          ? "border-[#1e6b3c] bg-[#1e6b3c] font-semibold text-white"
                          : booked
                            ? "cursor-not-allowed border-black/[0.05] bg-[#FBFBFA] text-[#111111]/35 line-through"
                            : "border-[#1e6b3c]/40 bg-white font-medium text-[#1e6b3c] hover:bg-[#1e6b3c]/5"
                      }`}
                      style={inter}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {/* details — only once a slot is chosen */}
        {picked && (
          <form
            className="mt-7 border-t border-black/[0.06] pt-6"
            onSubmit={(e) => { e.preventDefault(); submit(); }}
          >
            <div className="flex items-center gap-2">
              <span className={eyebrow} style={mono}>Requesting</span>
              <span className="text-[13px] font-semibold" style={inter}>
                {days.find((d) => d.iso === picked.date)?.dow}{" "}
                {days.find((d) => d.iso === picked.date)?.label} · {picked.time}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="sr-only">Your name</span>
                <input
                  className="min-h-[46px] w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/25 placeholder:text-[#111111]/50"
                  style={inter}
                  placeholder="Your name *"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="sr-only">Email address</span>
                <input
                  className="min-h-[46px] w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/25 placeholder:text-[#111111]/50"
                  style={inter}
                  type="email"
                  autoComplete="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Company (optional)</span>
              <input
                className="min-h-[46px] w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/25 placeholder:text-[#111111]/50"
                style={inter}
                autoComplete="organization"
                placeholder="Company (optional)"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className="sr-only">What would you like to talk about?</span>
              <textarea
                className="min-h-[84px] w-full resize-y rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/25 placeholder:text-[#111111]/50"
                style={inter}
                placeholder="What would you like to talk about? (optional)"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </label>

            {error && (
              <p className="mt-3 text-[13px] text-red-600" style={inter} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending || !name.trim() || !emailValid}
              className="mt-5 min-h-[48px] w-full rounded-full bg-[#1e6b3c] px-8 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 enabled:hover:bg-[#175530] disabled:opacity-30 md:w-auto"
              style={mono}
            >
              {sending ? "Sending…" : "Request this slot"}
            </button>
            <p className="mt-3 text-[12px] text-[#111111]/45" style={inter}>
              We'll confirm by email — no charge, no obligation.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
