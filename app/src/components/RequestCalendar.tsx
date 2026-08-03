import { useEffect, useMemo, useState } from "react";

/*
  RequestCalendar — the Contact Us booking surface.
  A free 20-minute intro call. The calendar shows the next two weeks;
  most slots are already taken (we're busy) — tapping one says so.
  An open slot can be REQUESTED: the visitor leaves name, email and topic,
  the request lands in the ELSIAA backend, and we confirm by email.
*/

const mono = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;
const inter = { fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" } as const;

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

type Day = { iso: string; label: string; dow: string };

export function RequestCalendar() {
  const [days, setDays] = useState<Day[]>([]);
  const [dayIdx, setDayIdx] = useState(0);
  const [picked, setPicked] = useState<{ date: string; time: string } | null>(null);
  const [bookedMsg, setBookedMsg] = useState<string | null>(null);
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

  const tapSlot = (time: string) => {
    if (!day) return;
    if (isBooked(day.iso, time)) {
      setPicked(null);
      setBookedMsg(
        `Sorry — ${day.dow} ${day.label} at ${time} is already booked. Try one of the open times.`,
      );
      return;
    }
    setBookedMsg(null);
    setPicked({ date: day.iso, time });
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

  if (done && picked) {
    const d = days.find((x) => x.iso === picked.date);
    return (
      <div className="rounded-2xl border border-black/[0.07] bg-white p-8 md:p-10">
        <p className="text-[13px] text-[#1e6b3c] " style={mono}>
          Request sent
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]" style={inter}>
          {d ? `${d.dow}, ${d.label}` : picked.date} at {picked.time} — requested.
        </h3>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#111111]/55" style={inter}>
          Thank you, {name.split(" ")[0]}. Your free 20-minute call is
          requested — we'll confirm the slot by email shortly. If it's taken by
          the time we see it, we'll propose the nearest open time.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
      {/* day strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d, i) => (
          <button
            key={d.iso}
            onClick={() => { setDayIdx(i); setPicked(null); setBookedMsg(null); }}
            className={`flex w-[64px] flex-none flex-col items-center rounded-xl border px-2 py-2.5 transition-all ${
              i === dayIdx
                ? "border-[#1e6b3c] bg-[#1e6b3c] text-white"
                : "border-black/[0.08] bg-white text-[#111111]/70 hover:border-[#1e6b3c]/40"
            }`}
          >
            <span className="text-[13px]  opacity-70" style={mono}>{d.dow}</span>
            <span className="mt-1 text-[13px] font-semibold" style={inter}>{d.label}</span>
          </button>
        ))}
      </div>

      {day && (
        <>
          <p className="mt-5 text-[13px] text-[#111111]/55" style={mono}>
            {openCount === 0
              ? "Fully booked — try another day."
              : `${openCount} opening${openCount === 1 ? "" : "s"} left on ${day.dow} ${day.label}`}
          </p>
          <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
            {HOURS.map((h) => {
              const booked = isBooked(day.iso, h);
              const active = picked?.date === day.iso && picked?.time === h;
              return (
                <button
                  key={h}
                  onClick={() => tapSlot(h)}
                  className={`rounded-lg border py-2.5 text-[13px] transition-all ${
                    active
                      ? "border-[#1e6b3c] bg-[#1e6b3c] font-semibold text-white"
                      : booked
                        ? "border-black/[0.05] bg-[#FBFBFA] text-[#111111]/50 line-through"
                        : "border-[#1e6b3c]/40 bg-white font-medium text-[#1e6b3c] hover:bg-[#1e6b3c]/5"
                  }`}
                  style={inter}
                >
                  {h}
                </button>
              );
            })}
          </div>
        </>
      )}

      {bookedMsg && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800" style={inter}>
          {bookedMsg}
        </p>
      )}

      {picked && (
        <div className="mt-6 border-t border-black/[0.06] pt-6">
          <p className="text-[13px] text-[#1e6b3c] " style={mono}>
            Request {picked.time} · {days.find((d) => d.iso === picked.date)?.label}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/50" style={inter} placeholder="Your name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/50" style={inter} type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <input className="mt-3 w-full rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/50" style={inter} placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
          <textarea className="mt-3 min-h-[80px] w-full resize-y rounded-lg border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-[#1e6b3c] placeholder:text-[#111111]/50" style={inter} placeholder="What would you like to talk about?" value={topic} onChange={(e) => setTopic(e.target.value)} />
          {error && <p className="mt-3 text-[13px] text-red-600" style={inter}>{error}</p>}
          <button
            onClick={submit}
            disabled={sending || !name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)}
            className="mt-4 rounded-full bg-[#1e6b3c] px-8 py-3.5 text-[13px] font-bold text-white  transition-all enabled:hover:bg-[#175530] disabled:opacity-30"
            style={mono}
          >
            {sending ? "Sending…" : "Request this slot"}
          </button>
        </div>
      )}
    </div>
  );
}
