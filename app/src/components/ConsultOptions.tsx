import { useState } from "react";

/*
  Consultation options — one shared block used by BOTH the homepage and the
  /consultation page so the two read identically.
  Pure white, generous spacing, no prices (dollar signs only), no bullet lists.
  Each option carries a single full-width "Book with" button showing the
  official Apple Pay / Google Pay / Stripe marks.
*/

const SANS =
  "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

/* ── official payment marks (inline SVG, no external assets) ── */

function ApplePayMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 10" className={className} role="img" aria-label="Apple Pay" fill="currentColor">
      {/* apple glyph */}
      <path d="M4.62 1.6c.27-.34.46-.8.41-1.27-.4.02-.89.27-1.17.6-.25.3-.47.77-.41 1.22.45.04.9-.22 1.17-.55zm.4.65c-.65-.04-1.2.37-1.51.37-.31 0-.79-.35-1.3-.34-.67.01-1.29.39-1.63.99-.7 1.21-.18 3 .5 3.98.33.48.73 1.02 1.25 1 .5-.02.69-.32 1.29-.32.6 0 .77.32 1.3.31.54-.01.88-.49 1.21-.97.38-.56.54-1.1.55-1.13-.01-.01-1.05-.4-1.06-1.6-.01-1 .82-1.48.86-1.51-.47-.69-1.2-.77-1.46-.78z" />
      {/* "Pay" */}
      <path d="M10.06 1.02c1.02 0 1.73.7 1.73 1.73 0 1.02-.72 1.73-1.76 1.73H8.9v1.79h-.82V1.02h1.98zm-1.16 2.77h.95c.71 0 1.11-.38 1.11-1.04 0-.65-.4-1.03-1.11-1.03H8.9v2.07zm3.13 1.32c0-.67.51-1.08 1.42-1.13l1.05-.06v-.3c0-.42-.29-.68-.77-.68-.45 0-.73.22-.8.55h-.75c.04-.69.63-1.2 1.58-1.2.93 0 1.52.49 1.52 1.26v2.72h-.76v-.65h-.02c-.22.44-.72.72-1.24.72-.78 0-1.23-.47-1.23-1.23zm2.47-.35v-.3l-.94.06c-.47.03-.73.24-.73.57 0 .34.28.56.7.56.55 0 .97-.38.97-.89zm1.5 3.06v-.64c.06.01.19.02.25.02.37 0 .57-.15.69-.55l.07-.22-1.39-3.86h.86l.97 3.13h.02l.97-3.13h.84L18 6.72c-.32.9-.68 1.19-1.45 1.19-.06 0-.26 0-.31-.02z" />
    </svg>
  );
}

function GooglePayMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 41 17" className={className} role="img" aria-label="Google Pay">
      {/* G Pay wordmark */}
      <path
        fill="currentColor"
        d="M19.53 8.3v4.9h-1.56V1.11h4.12c1.05 0 1.94.35 2.67 1.04.74.7 1.11 1.55 1.11 2.55 0 1.03-.37 1.88-1.11 2.57-.72.69-1.61 1.03-2.67 1.03h-2.56zm0-5.7v4.21h2.6c.62 0 1.13-.21 1.54-.62.41-.42.62-.92.62-1.48 0-.55-.21-1.05-.62-1.47-.41-.43-.92-.64-1.54-.64h-2.6z"
      />
      <path
        fill="currentColor"
        d="M30.02 4.65c1.15 0 2.06.31 2.73.92.67.62 1 1.46 1 2.53v5.1h-1.49v-1.15h-.07c-.65.95-1.51 1.42-2.59 1.42-.92 0-1.69-.27-2.31-.82-.62-.55-.93-1.23-.93-2.05 0-.87.33-1.55.98-2.06.65-.51 1.53-.77 2.62-.77.93 0 1.7.17 2.3.51v-.36c0-.54-.21-1-.64-1.37a2.2 2.2 0 00-1.5-.56c-.87 0-1.56.37-2.06 1.1l-1.37-.86c.75-1.06 1.86-1.58 3.33-1.58zm-2.02 6c0 .41.17.75.52 1.02.34.27.75.41 1.21.41.66 0 1.24-.24 1.75-.73.51-.49.77-1.06.77-1.72-.49-.39-1.17-.58-2.05-.58-.64 0-1.17.15-1.6.46-.43.32-.6.7-.6 1.14z"
      />
      <path
        fill="currentColor"
        d="M41 4.92l-5.19 11.93h-1.61l1.93-4.17-3.42-7.76h1.7l2.47 5.95h.03l2.4-5.95H41z"
      />
      {/* Google G */}
      <path fill="#4285F4" d="M13.29 7.2c0-.5-.04-.99-.13-1.45H6.78v2.75h3.65a3.13 3.13 0 01-1.35 2.05v1.7h2.18c1.28-1.18 2.03-2.92 2.03-5.05z" />
      <path fill="#34A853" d="M6.78 13.94c1.83 0 3.37-.6 4.49-1.64l-2.18-1.7c-.61.41-1.39.65-2.31.65-1.77 0-3.27-1.19-3.81-2.8H.72v1.75a6.78 6.78 0 006.06 3.74z" />
      <path fill="#FBBC04" d="M2.97 8.45a4.07 4.07 0 010-2.6V4.1H.72a6.78 6.78 0 000 6.1l2.25-1.75z" />
      <path fill="#EA4335" d="M6.78 3.05c1 0 1.9.34 2.6 1.02l1.94-1.94A6.5 6.5 0 006.78.15 6.78 6.78 0 00.72 4.1l2.25 1.75c.54-1.61 2.04-2.8 3.81-2.8z" />
    </svg>
  );
}

function StripeMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 25" className={className} role="img" aria-label="Stripe" fill="currentColor">
      <path d="M60 12.9c0-4.26-2.06-7.62-6-7.62-3.95 0-6.34 3.36-6.34 7.59 0 5.01 2.83 7.54 6.88 7.54 1.98 0 3.47-.45 4.6-1.08v-3.33c-1.13.57-2.43.92-4.08.92-1.62 0-3.05-.57-3.23-2.53h8.14c0-.22.03-1.09.03-1.49zm-8.22-1.58c0-1.88 1.15-2.66 2.2-2.66 1.01 0 2.1.78 2.1 2.66h-4.3zM41.6 5.28c-1.63 0-2.68.77-3.26 1.3l-.22-1.03h-3.66v19.4l4.16-.88.02-4.71c.6.44 1.48 1.05 2.95 1.05 2.98 0 5.7-2.4 5.7-7.69-.01-4.84-2.76-7.44-5.69-7.44zm-1 11.44c-.98 0-1.57-.35-1.97-.79l-.02-6.23c.44-.49 1.04-.83 1.99-.83 1.52 0 2.58 1.71 2.58 3.91 0 2.26-1.04 3.94-2.58 3.94zM28.9 4.29l4.18-.9V0l-4.18.89v3.4zM28.9 5.56h4.18v14.58H28.9V5.56zM24.42 6.79l-.27-1.23h-3.59v14.58h4.16v-9.88c.98-1.28 2.64-1.05 3.16-.87V5.56c-.54-.2-2.48-.57-3.46 1.23zM16.1 1.94l-4.06.86-.02 13.32c0 2.46 1.85 4.27 4.31 4.27 1.36 0 2.36-.25 2.91-.55v-3.38c-.53.21-3.16 .98-3.16-1.48V9.1h3.16V5.56h-3.16l.02-3.62zM4.21 9.83c0-.65.53-.9 1.42-.9 1.27 0 2.87.38 4.14 1.07V6.09c-1.38-.55-2.75-.77-4.14-.77C2.24 5.32 0 7.09 0 10.05c0 4.62 6.36 3.88 6.36 5.87 0 .77-.67 1.02-1.6 1.02-1.38 0-3.15-.57-4.55-1.33v3.96c1.55.67 3.12.95 4.55.95 3.48 0 5.85-1.72 5.85-4.72-.02-4.99-6.4-4.1-6.4-5.97z" />
    </svg>
  );
}

export type ConsultOption = {
  name: string;
  lines: string[];
  featured?: boolean;
};

export const CONSULT_OPTIONS: ConsultOption[] = [
  {
    name: "Strategy Session",
    lines: [
      "You talk. We dig into what's actually going on.",
      "You leave with a clear written plan of what to do next.",
    ],
  },
  {
    name: "Two-Week Build",
    featured: true,
    lines: [
      "We don't just talk. We sit with you and build or fix the first thing that matters.",
    ],
  },
  {
    name: "Monthly Advisor",
    lines: [
      "We're on call every month.",
      "Roadmap, tech decisions, vendors — someone who's actually done the work.",
    ],
  },
];

function BookBar({ selected }: { selected: string }) {
  return (
    <a
      href={`/quote?option=${encodeURIComponent(selected)}`}
      aria-label={`Book ${selected} with Apple Pay, Google Pay, or card`}
      className="mx-auto mt-8 flex w-full max-w-2xl items-center justify-center gap-3 rounded-full bg-[#111111] px-6 py-4 text-white shadow-[0_14px_36px_-14px_rgba(17,17,17,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1e6b3c] hover:shadow-[0_20px_44px_-16px_rgba(30,107,60,0.5)] md:py-5"
    >
      <span className="text-[15px] font-semibold tracking-[-0.01em]" style={{ fontFamily: SANS }}>
        Book with
      </span>
      <span className="flex items-center gap-3.5 text-white">
        <ApplePayMark className="h-[17px] w-auto" />
        <span aria-hidden className="h-3.5 w-px bg-white/25" />
        <GooglePayMark className="h-[17px] w-auto" />
        <span aria-hidden className="h-3.5 w-px bg-white/25" />
        <StripeMark className="h-[15px] w-auto" />
      </span>
    </a>
  );
}

export function ConsultOptions({ className = "" }: { className?: string }) {
  const [selected, setSelected] = useState(
    CONSULT_OPTIONS.find((o) => o.featured)?.name ?? CONSULT_OPTIONS[0].name,
  );
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {CONSULT_OPTIONS.map((o) => {
          const on = o.name === selected;
          return (
            <button
              key={o.name}
              type="button"
              onClick={() => setSelected(o.name)}
              aria-pressed={on}
              className={`flex flex-col rounded-3xl border bg-white p-7 text-left transition-all duration-300 hover:-translate-y-1 md:p-8 ${
                on
                  ? "border-[#1e6b3c] shadow-[0_30px_70px_-45px_rgba(30,107,60,0.5)] ring-1 ring-[#1e6b3c]/25"
                  : "border-black/[0.08] shadow-[0_24px_60px_-50px_rgba(17,17,17,0.4)] hover:border-[#1e6b3c]/35"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3
                  className="text-[19px] font-semibold tracking-[-0.025em] text-[#111111] md:text-[21px]"
                  style={{ fontFamily: SANS }}
                >
                  {o.name}
                </h3>
                {o.featured && (
                  <span
                    className="shrink-0 rounded-full bg-[#1e6b3c]/10 px-3 py-1 text-[12px] font-semibold text-[#1e6b3c]"
                    style={{ fontFamily: SANS }}
                  >
                    Most chosen
                  </span>
                )}
              </div>

              <p
                className="mt-5 text-[34px] font-semibold leading-none tracking-[-0.04em] text-[#111111] md:text-[40px]"
                style={{ fontFamily: SANS }}
                aria-label="Pricing on request"
              >
                $
              </p>

              <div className="mt-5 space-y-2">
                {o.lines.map((l) => (
                  <p
                    key={l}
                    className="text-[15px] leading-relaxed text-[#111111]/60"
                    style={{ fontFamily: SANS }}
                  >
                    {l}
                  </p>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* one payment bar for all three */}
      <BookBar selected={selected} />
    </div>
  );
}
