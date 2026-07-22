import { useRef, useState } from "react";

/* ---------- booking: free 20-min intro, $100 30-min consultation ---------- */
function slotsForNextDays(count: number) {
  const out: { label: string; iso: string }[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day === 0 || day === 6) continue;
    out.push({
      label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      iso: d.toISOString().slice(0, 10),
    });
  }
  return out;
}
const HOURS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export function Booking() {
  const [kind, setKind] = useState<"free" | "paid">("free");
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const days = useRef(slotsForNextDays(10)).current;

  const valid = day && time && name.trim() && /.+@.+\..+/.test(email);

  const book = async () => {
    if (!valid || state === "sending") return;
    setState("sending");
    try {
      const fd = new FormData();
      fd.append("_subject", `ELSIAA Booking — ${kind === "free" ? "Free 20-min intro" : "$100 30-min consultation"} — ${name}`);
      fd.append("Call type", kind === "free" ? "Free intro call (20 min)" : "Paid consultation (30 min, $100)");
      fd.append("Date", day);
      fd.append("Time", `${time} (client local)`);
      fd.append("Name", name);
      fd.append("Email", email);
      fd.append("_template", "table");
      fd.append("_captcha", "false");
      const res = await fetch("https://formsubmit.co/ajax/info@elsiaa.com", {
        method: "POST",
        body: fd,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mt-10 rounded-2xl border border-[#1e6b3c]/30 bg-[#1e6b3c]/[0.05] p-8 text-center">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#1e6b3c] text-white">✓</span>
        <h3 className="mt-4 text-lg font-semibold" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
          Call requested
        </h3>
        <p className="mt-1.5 text-[13.5px] text-[#111111]/55">
          {kind === "free" ? "Your free 20-minute intro" : "Your 30-minute consultation"} — {day} at {time}. Confirmation
          lands at <span className="font-medium text-[#111111]">{email}</span> within hours
          {kind === "paid" ? ", with a secure payment link for the $100 session." : "."}
        </p>
      </div>
    );
  }

  return (
    <div id="book" className="mt-10 scroll-mt-28 rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-[-0.02em] md:text-xl" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
          Book your call
        </h3>
        <span className="text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>
          First call free
        </span>
      </div>

      {/* call type */}
      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {(
          [
            { id: "free", title: "Intro call", meta: "20 minutes · Free", pitch: "Meet us, map the opportunity, leave with next steps." },
            { id: "paid", title: "Consultation", meta: "30 minutes · $100", pitch: "Working session — strategy, architecture, and a concrete plan." },
          ] as const
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setKind(o.id)}
            className={`rounded-xl border p-4 text-left transition-all duration-200 ${
              kind === o.id ? "border-[#1e6b3c] bg-[#1e6b3c]/[0.05] shadow-[0_14px_34px_-26px_rgba(30,107,60,0.7)]" : "border-black/10 hover:border-black/30"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-semibold" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>{o.title}</span>
              <span className={`text-[11px] font-semibold ${kind === o.id ? "text-[#1e6b3c]" : "text-[#111111]/55"}`} style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>
                {o.meta}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-snug text-[#111111]/60">{o.pitch}</p>
          </button>
        ))}
      </div>

      {/* schedule */}
      <div className="mt-5">
        <span className="text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>Pick a day</span>
        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDay(d.label)}
              className={`flex-none rounded-lg border px-3.5 py-2.5 text-[12px] font-medium transition-all ${
                day === d.label ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-white text-[#111111]/65 hover:border-black/30"
              }`}
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              {d.label}
            </button>
          ))}
        </div>
        <span className="mt-4 block text-[10px] tracking-[0.22em] text-[#111111]/55 uppercase" style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}>Pick a time</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setTime(h)}
              className={`rounded-lg border px-3.5 py-2 text-[12px] font-medium transition-all ${
                time === h ? "border-[#1e6b3c] bg-[#1e6b3c] text-white" : "border-black/10 bg-white text-[#111111]/65 hover:border-black/30"
              }`}
              style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* contact */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1e6b3c]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-[14px] outline-none transition-colors focus:border-[#1e6b3c]"
        />
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          onClick={book}
          disabled={!valid || state === "sending"}
          className={`rounded-full px-7 py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase transition-all ${
            valid ? "bg-[#111111] text-white hover:bg-[#1e6b3c]" : "cursor-not-allowed bg-black/[0.06] text-[#111111]/50"
          }`}
          style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
        >
          {state === "sending" ? "Booking…" : kind === "free" ? "Book free call →" : "Book — $100 →"}
        </button>
        <p className="text-[11.5px] text-[#111111]/55" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
          {kind === "paid"
            ? "Secure card checkout with Stripe is coming online — for now you'll receive a payment link with your confirmation."
            : "Confirmation arrives by email within hours."}
        </p>
      </div>
      {state === "error" && (
        <p className="mt-3 text-[13px] text-[#E53E3E]">
          Something broke — try again or email <a className="underline" href="mailto:info@elsiaa.com">info@elsiaa.com</a>.
        </p>
      )}
    </div>
  );
}

