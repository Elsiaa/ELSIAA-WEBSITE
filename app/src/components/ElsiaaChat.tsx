import { useEffect, useRef, useState } from "react";
import { search } from "../lib/search-engine";

/*
  "Chat with ELSIAA" — a question-answering panel over the site index.

  This is NOT a language model. It runs the same engine as site search
  (typo tolerance, role aliases, natural-language fallback), so it can point
  a visitor at the right page and hand off to a call or a quote — and it says
  so plainly rather than pretending to be an AI agent it isn't. Wiring this to
  a real model later means replacing `answer()` with a fetch; the panel,
  transcript and handoffs stay as they are.
*/

const SANS =
  "var(--font-sans)";

type Msg = {
  from: "bot" | "you";
  text: string;
  links?: Array<{ label: string; href: string; note?: string }>;
};

const OPENERS = [
  "What do you build?",
  "How much is a website?",
  "Who runs the company?",
  "Where are your offices?",
];

const GREETING: Msg = {
  from: "bot",
  text: "Ask me anything about ELSIAA — what we build, what it costs, who we are, or where we work. I'll point you to the right page.",
};

function answer(q: string): Msg {
  const { hits, didYouMean } = search(q, 3);

  if (!hits.length) {
    return {
      from: "bot",
      text: didYouMean
        ? `I didn't find that. Did you mean "${didYouMean}"? If not, the fastest route is a person — the first twenty minutes are free.`
        : "I couldn't match that to anything on the site. The fastest route is a person — the first twenty minutes are free.",
      links: [
        { label: "Book a free 20-minute call", href: "/consultation" },
        { label: "Get a quote", href: "/quote" },
      ],
    };
  }

  const top = hits[0].entry;
  const lead = top.desc ? `${top.desc}` : `Here's what matches — start with ${top.label}.`;
  return {
    from: "bot",
    text: didYouMean ? `Showing results for "${didYouMean}". ${lead}` : lead,
    links: hits.map((h) => ({
      label: h.entry.label,
      href: h.entry.href,
      note: h.entry.group,
    })),
  };
}

export function ElsiaaChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [q, setQ] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const ask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "you", text: t }, answer(t)]);
    setQ("");
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-end p-4 md:p-6"
      style={{ fontFamily: SANS }}
    >
      <button
        aria-label="Close chat"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/20 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-label="Chat with ELSIAA"
        className="relative flex h-[min(560px,80vh)] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-black/10 bg-white shadow-[0_40px_120px_-30px_rgba(0,0,0,0.45)]"
      >
        {/* header */}
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-5 py-4">
          <img
            src="/assets/quote/robot.png"
            alt=""
            width={72}
            height={72}
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-[#111111]">Chat with ELSIAA</p>
            <p className="text-[12px] text-[#111111]/55">Finds the right page. Books the right call.</p>
          </div>
          <button
            aria-label="Close chat"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#111111]/45 transition-colors hover:bg-black/[0.05] hover:text-[#111111]"
          >
            ✕
          </button>
        </div>

        {/* transcript */}
        <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.map((m, i) => (
            <div key={i} className={m.from === "you" ? "flex justify-end" : ""}>
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                  m.from === "you"
                    ? "bg-[#1e6b3c] text-white"
                    : "bg-black/[0.04] text-[#111111]/80"
                }`}
              >
                <p>{m.text}</p>
                {m.links && (
                  <div className="mt-3 space-y-1.5">
                    {m.links.map((l) => (
                      <a
                        key={l.href + l.label}
                        href={l.href}
                        className="flex min-h-[40px] items-center justify-between gap-3 rounded-xl bg-white px-3.5 py-2 text-[13.5px] font-medium text-[#111111] shadow-[0_1px_0_rgba(0,0,0,0.06)] transition-colors hover:bg-[#1e6b3c] hover:text-white"
                      >
                        <span className="min-w-0 truncate">{l.label}</span>
                        <span aria-hidden className="shrink-0 opacity-60">→</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {msgs.length === 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {OPENERS.map((o) => (
                <button
                  key={o}
                  onClick={() => ask(o)}
                  className="rounded-full border border-black/12 px-3.5 py-2 text-[12.5px] text-[#111111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
          className="flex items-center gap-2 border-t border-black/[0.07] px-4 py-3"
        >
          <label htmlFor="elsiaa-chat-input" className="sr-only">
            Ask ELSIAA a question
          </label>
          <input
            id="elsiaa-chat-input"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask about pricing, services, the team…"
            className="min-h-[44px] w-full rounded-full bg-black/[0.04] px-4 text-[16px] text-[#111111] outline-none placeholder:text-[#111111]/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c]"
          />
          <button
            type="submit"
            aria-label="Send"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white transition-colors hover:bg-[#1e6b3c]"
          >
            →
          </button>
        </form>
      </div>
    </div>
  );
}
