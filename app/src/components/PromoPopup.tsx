import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/*
  Rotating house ad.

  A small card slides in from the bottom-left, promotes one division, retires
  itself, and later comes back with a different one.

  Rules, so it reads as a house ad rather than adware:

    - NEVER over the hero. It waits until the visitor has scrolled past the
      first screen. The previous version appeared at scrollY 0 and, on a
      375px phone, covered 335px of width directly under the lion — it
      overlapped the ELSIAA wordmark by 8px and buried the brand on the one
      screen that has to land.
    - never on the page it is advertising
    - never on portal, admin, legal, search, checkout or intake
    - each ad shows for SHOW_MS, then retires. A new one appears after
      GAP_MS, cycling through the pool from a random start so different
      visits lead with different divisions.
    - dismissing does not stop the rotation. After two dismissals the gap
      stretches from 45s to 3 minutes, so it keeps working without nagging.
*/

type Promo = {
  key: string;
  eyebrow: string;
  title: string;
  line: string;
  cta: string;
  href: string;
  /** routes this promo must not appear on — it is already the destination */
  suppressOn: string[];
};

const PROMOS: Promo[] = [
  {
    key: "design",
    eyebrow: "Design",
    title: "Your brand, rebuilt.",
    line: "Sites, apps, and identities shipped for real businesses. Web design from $750.",
    cta: "See the work",
    href: "/designs",
    suppressOn: ["/designs"],
  },
  {
    key: "automate",
    eyebrow: "Automate",
    title: "Stop doing it by hand.",
    line: "The step in your business that still waits on a person — handed to a system that doesn't.",
    cta: "See the systems",
    href: "/automate",
    suppressOn: ["/automate"],
  },
  {
    key: "social",
    eyebrow: "Social",
    title: "One recording. A month of posts.",
    line: "We cut the moments that hold attention, caption them, and schedule them out.",
    cta: "See clipping",
    href: "/social",
    suppressOn: ["/social"],
  },
  {
    key: "services",
    eyebrow: "Services",
    title: "Eight services, priced.",
    line: "From a $750 site to a $12k platform — every one with a fixed scope before you commit.",
    cta: "See pricing",
    href: "/services",
    suppressOn: ["/services"],
  },
  {
    key: "call",
    eyebrow: "Start here",
    title: "Twenty minutes, free.",
    line: "Tell us what you're dealing with. No pitch, no charge, no obligation.",
    cta: "Book the call",
    href: "/consultation",
    suppressOn: ["/consultation", "/contact", "/quote"],
  },
];

/** Anywhere a promo would be an intrusion rather than an ad. */
const BLOCKED_PREFIXES = ["/portal", "/admin", "/legal", "/search", "/store/checkout", "/intake"];

const FIRST_MS = 9_000; // dwell before the first card, once past the hero
const SHOW_MS = 13_000; // how long a card stays up on its own
const GAP_MS = 45_000; // quiet time between cards
/* After two dismissals the gap stretches instead of the rotation stopping.
   Closing twice says "not now", not "never" — so it keeps cycling, just far
   less often. Backing off is what keeps a house ad from becoming a nag. */
const BACKOFF_AFTER = 2;
const LONG_GAP_MS = 180_000;

export function PromoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [promo, setPromo] = useState<Promo | null>(null);
  const [closing, setClosing] = useState(false);
  const [tick, setTick] = useState(0);
  /* Random start so two visitors don't both lead with the same division. */
  const cursor = useRef(Math.floor(Math.random() * PROMOS.length));
  const dismissals = useRef(0);
  const timers = useRef<number[]>([]);

  const gap = () => (dismissals.current >= BACKOFF_AFTER ? LONG_GAP_MS : GAP_MS);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) return;

    let cancelled = false;

    const pick = (): Promo | null => {
      /* Walk the ring from the cursor so each appearance is a different
         division, skipping any that would advertise the current page. */
      for (let i = 0; i < PROMOS.length; i++) {
        const p = PROMOS[(cursor.current + i) % PROMOS.length];
        if (!p.suppressOn.includes(pathname)) {
          cursor.current = (cursor.current + i + 1) % PROMOS.length;
          return p;
        }
      }
      return null;
    };

    const hide = () => {
      setClosing(true);
      timers.current.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setPromo(null);
          setClosing(false);
          timers.current.push(window.setTimeout(show, gap()));
        }, 260),
      );
    };

    const show = () => {
      if (cancelled) return;
      const next = pick();
      if (!next) return;
      setPromo(next);
      setClosing(false);
      timers.current.push(window.setTimeout(hide, SHOW_MS));
    };

    /* The gate: nothing appears until the visitor has left the first screen.
       Checked on scroll rather than once, because they may not scroll for a
       while — and if they never do, no ad ever shows, which is correct. */
    const pastHero = () => window.scrollY > window.innerHeight * 0.9;
    let armed = false;
    const arm = () => {
      if (armed || !pastHero()) return;
      armed = true;
      window.removeEventListener("scroll", arm);
      timers.current.push(window.setTimeout(show, tick === 0 ? FIRST_MS : gap()));
    };
    window.addEventListener("scroll", arm, { passive: true });
    arm();

    return () => {
      cancelled = true;
      window.removeEventListener("scroll", arm);
      clearTimers();
    };
  }, [pathname, tick]);

  const close = () => {
    dismissals.current += 1;
    setClosing(true);
    clearTimers();
    /* Reschedule rather than stop. `tick` bumps a counter the effect depends
       on, which restarts the cycle with the (now possibly longer) gap. */
    window.setTimeout(() => {
      setPromo(null);
      setClosing(false);
      setTick((n) => n + 1);
    }, 260);
  };

  if (!promo) return null;

  return (
    <div
      role="complementary"
      aria-label="ELSIAA promotion"
      /* A mount animation, not mount-hidden-then-flip-a-flag: that pattern
         needs a second tick after paint, and requestAnimationFrame is
         throttled to zero in a backgrounded tab, which would strand the card
         at opacity 0 — invisible but still covering the corner. */
      style={{ animation: `elsiaa-promo-${closing ? "out" : "in"} 260ms ease-out both` }}
      className="fixed bottom-4 left-4 z-[60] w-[min(320px,calc(100vw-4rem))] rounded-2xl border border-black/[0.08] bg-white/95 p-4 shadow-[0_30px_70px_-30px_rgba(17,17,17,0.35)] backdrop-blur-sm md:bottom-5 md:left-5 md:p-5"
    >
      <style>{`
        @keyframes elsiaa-promo-in  { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:none } }
        @keyframes elsiaa-promo-out { from { opacity:1; transform:none } to { opacity:0; transform:translateY(14px) } }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="ELSIAA promotion"] { animation-duration: 1ms !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full text-[#111111]/35 transition-colors hover:bg-black/[0.04] hover:text-[#111111]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      </button>

      <p className="text-[11px] font-bold tracking-[0.14em] text-[#1e6b3c] uppercase">
        {promo.eyebrow}
      </p>
      <p className="mt-1.5 pr-6 text-[16px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]">
        {promo.title}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[#111111]/60">{promo.line}</p>
      <a
        href={promo.href}
        onClick={close}
        className="mt-3.5 inline-flex items-center rounded-full bg-[#1e6b3c] px-4.5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-[#111111]"
      >
        {promo.cta} →
      </a>
    </div>
  );
}
