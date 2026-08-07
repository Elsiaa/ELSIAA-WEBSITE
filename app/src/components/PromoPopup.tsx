import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

/*
  Randomised promo card.

  A small dismissible card slides in from the bottom-left after the visitor has
  been reading for a moment, promoting one division at random.

  Rules it follows, so it reads as a house ad rather than adware:
    - never on the page it is advertising (no "see our design work" on /designs)
    - never on the portal, admin, sign-in, checkout or legal pages
    - once per session, full stop. Dismissing sets a flag that also survives
      navigation, so it cannot reappear on the next route change.
    - waits for a real dwell, and never fires on a visitor who is already
      leaving (dismissed === closed for good)
    - honours prefers-reduced-motion by skipping the slide, not the card
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
    line: "Sites, apps, and identities we've shipped for real businesses. Web design starts at $750.",
    cta: "See the work",
    href: "/designs",
    suppressOn: ["/designs", "/services"],
  },
  {
    key: "automate",
    eyebrow: "Automate",
    title: "Stop doing it by hand.",
    line: "The step in your business that still waits on a person — handed to a system that doesn't.",
    cta: "See the systems",
    href: "/automate",
    suppressOn: ["/automate", "/services"],
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

const SEEN_KEY = "elsiaa:promo-seen";
const DELAY_MS = 18_000;

export function PromoPopup() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [promo, setPromo] = useState<Promo | null>(null);
  const [closing, setClosing] = useState(false);
  /* Held in state as well as sessionStorage: storage answers "has a previous
     page already shown one", state answers "has this mount shown one", and
     both must be false for a card to appear. */
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    if (typeof window === "undefined") return;
    try {
      if (window.sessionStorage.getItem(SEEN_KEY)) {
        setDone(true);
        return;
      }
    } catch {
      /* private mode — fall through and just show it once per mount */
    }
    if (BLOCKED_PREFIXES.some((p) => pathname.startsWith(p))) return;

    const eligible = PROMOS.filter((p) => !p.suppressOn.includes(pathname));
    if (!eligible.length) return;

    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    const t = window.setTimeout(() => setPromo(pick), DELAY_MS);
    return () => window.clearTimeout(t);
  }, [pathname, done]);

  const close = () => {
    setClosing(true);
    setDone(true);
    try {
      window.sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    window.setTimeout(() => setPromo(null), 260);
  };

  if (!promo) return null;

  return (
    <div
      role="complementary"
      aria-label="ELSIAA promotion"
      /* The entrance is a mount animation rather than a mount-hidden-then-flip
         -a-state-flag pattern. The flag version depends on a second tick
         landing after paint, and in a throttled or backgrounded tab that tick
         can be delayed indefinitely — leaving the card at opacity 0, invisible
         but still covering the corner. An animation with `both` fill cannot
         get stuck: the card is either animating in or already in. */
      style={{ animation: `elsiaa-promo-${closing ? "out" : "in"} 260ms ease-out both` }}
      className="fixed bottom-5 left-5 z-[60] w-[min(340px,calc(100vw-2.5rem))] rounded-2xl border border-black/[0.08] bg-white p-5 shadow-[0_30px_70px_-30px_rgba(17,17,17,0.35)]"
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
        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full text-[#111111]/35 transition-colors hover:bg-black/[0.04] hover:text-[#111111]"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      </button>

      <p className="text-[11.5px] font-bold tracking-[0.14em] text-[#1e6b3c] uppercase">
        {promo.eyebrow}
      </p>
      <p className="mt-2 pr-6 text-[17px] leading-tight font-semibold tracking-[-0.02em] text-[#111111]">
        {promo.title}
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#111111]/60">{promo.line}</p>
      <a
        href={promo.href}
        onClick={close}
        className="mt-4 inline-flex items-center rounded-full bg-[#1e6b3c] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#111111]"
      >
        {promo.cta} →
      </a>
    </div>
  );
}
