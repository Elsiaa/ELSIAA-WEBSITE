import { useEffect, useRef } from "react";

/*
  Social-media building blocks — code-drawn phones (no image assets) whose feeds
  are driven ENTIRELY by page scroll.

  On the homepage the section is a PINNED scroll-scrub (like the globe and the
  robot): the stage sticks to the viewport and your scroll swipes the video up,
  scrolls LinkedIn, scrolls Facebook — the page holds until the feeds finish,
  then releases to the next section. On /social the same phones scrub as the row
  crosses the viewport. Pure ink-on-white, green accents, reduced-motion aware.
*/

const SANS =
  "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const PLATFORMS = ["Instagram", "TikTok", "Meta", "Facebook", "LinkedIn"] as const;

export function PlatformBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-2.5 ${className}`}>
      {PLATFORMS.map((p) => (
        <span
          key={p}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.1] bg-white px-4 py-2 text-[13px] font-semibold text-[#111111]/75 transition-all hover:-translate-y-0.5 hover:border-[#1e6b3c]/40 hover:text-[#111111]"
          style={{ fontFamily: SANS }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#1e6b3c]" />
          {p}
        </span>
      ))}
    </div>
  );
}

type FeedKind = "video" | "instagram" | "linkedin" | "facebook" | "reviews";

const HEADER: Record<FeedKind, string> = {
  video: "TikTok",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  reviews: "Reviews",
};

const VIEW_H = 300; // px — the phone's visible screen height

function Bar({ w = "100%", o = 0.14 }: { w?: string; o?: number }) {
  return <span className="block h-1.5 rounded-full" style={{ width: w, background: `rgba(17,17,17,${o})` }} />;
}

function FeedCards({ kind }: { kind: FeedKind }) {
  if (kind === "video") {
    // full-screen clips — scrolling swipes up to the next one
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden bg-[#e9ebed]" style={{ height: VIEW_H }}>
            <div className="absolute inset-x-0 top-0 flex gap-1 p-2">
              {[0, 1, 2, 3].map((s) => (
                <span key={s} className={`h-[3px] flex-1 rounded-full ${s <= i ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/85 shadow">
                <span className="ml-1 block h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-[#111111]" />
              </span>
            </div>
            <div className="absolute right-2 bottom-4 flex flex-col items-center gap-2.5">
              {["♥", "💬", "↗"].map((g, k) => (
                <span key={k} className="grid h-7 w-7 place-items-center rounded-full bg-white/25 text-[12px] text-white">
                  {g}
                </span>
              ))}
              <span className="text-[9px] font-bold text-white drop-shadow" style={{ fontFamily: SANS }}>
                {[128, 42, 301, 76][i]}k
              </span>
            </div>
            <div className="absolute bottom-3 left-2 max-w-[72%] space-y-1">
              <span className="block h-2 w-14 rounded-full bg-white/85" />
              <span className="block h-2 w-24 rounded-full bg-white/60" />
            </div>
          </div>
        ))}
      </>
    );
  }
  if (kind === "instagram") {
    // stories row + square photo posts with the action row
    return (
      <div>
        <div className="flex gap-2.5 border-b border-black/[0.06] px-2.5 py-2">
          {[0, 1, 2, 3, 4].map((s) => (
            <span
              key={s}
              className="h-8 w-8 shrink-0 rounded-full p-[2px]"
              style={{ background: "conic-gradient(from 210deg, #1e6b3c, #4bbf7b, #1e6b3c)" }}
            >
              <span className="block h-full w-full rounded-full border-2 border-white bg-[#e9ebed]" />
            </span>
          ))}
        </div>
        <div className="space-y-3 p-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 pb-1.5">
                <span className="h-5 w-5 rounded-full bg-[#1e6b3c]/15" />
                <Bar w="34%" />
                <span className="ml-auto text-[12px] leading-none text-[#111111]/30">···</span>
              </div>
              <div className="h-32 rounded-lg bg-[#eceef0]" />
              <div className="flex items-center gap-3 pt-1.5 text-[13px] text-[#111111]/70">
                <span>♥</span>
                <span>💬</span>
                <span>↗</span>
                <span className="ml-auto">🔖</span>
              </div>
              <div className="mt-1 space-y-1">
                <Bar w="30%" o={0.16} />
                <Bar w="80%" o={0.1} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "linkedin") {
    return (
      <div className="space-y-2 p-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#1e6b3c]/15" />
              <div className="flex-1 space-y-1">
                <Bar w="60%" />
                <Bar w="40%" o={0.09} />
              </div>
              <span className="rounded-full border border-[#1e6b3c]/40 px-2 py-0.5 text-[8px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
                + Follow
              </span>
            </div>
            <div className="mt-2 space-y-1">
              <Bar w="100%" o={0.1} />
              <Bar w="90%" o={0.1} />
              {i % 2 === 0 && <div className="mt-1.5 h-14 rounded-lg bg-[#eceef0]" />}
            </div>
            <div className="mt-2 flex items-center gap-1.5 border-t border-black/[0.05] pt-1.5">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#1e6b3c] text-[7px] text-white">👍</span>
              <span className="text-[8px] text-[#111111]/45" style={{ fontFamily: SANS }}>
                {[214, 88, 512, 31, 140][i]} · {[18, 4, 63, 2, 20][i]} comments
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "facebook") {
    return (
      <div className="space-y-2 p-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#1e6b3c]/15" />
              <div className="flex-1 space-y-1">
                <Bar w="52%" />
                <Bar w="28%" o={0.09} />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <Bar w="95%" o={0.1} />
              <div className="mt-1.5 h-20 rounded-lg bg-[#eceef0]" />
            </div>
            <div className="mt-2 grid grid-cols-3 border-t border-black/[0.05] pt-1.5 text-center text-[8px] font-semibold text-[#111111]/45" style={{ fontFamily: SANS }}>
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>↗ Share</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // reviews
  return (
    <div className="space-y-2 p-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-6 w-6 rounded-full bg-[#1e6b3c]/15" />
            <div className="flex-1 space-y-1">
              <Bar w="50%" />
            </div>
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, s) => (
              <span key={s} className="text-[11px] leading-none text-[#1e6b3c]">
                ★
              </span>
            ))}
          </div>
          <div className="mt-1.5 space-y-1">
            <Bar w="100%" o={0.1} />
            <Bar w="80%" o={0.1} />
          </div>
        </div>
      ))}
    </div>
  );
}

type PhoneItem = {
  kind: FeedKind;
  title?: string;
  blurb?: string;
  tilt?: number;
  speed?: number; // fraction of its feed to travel across the scrub (1 = full)
};

/* Presentational phone. viewRef = the fixed screen; stripRef = the feed that the
   scroll engine translates. */
function PhoneFrame({
  item,
  viewRef,
  stripRef,
}: {
  item: PhoneItem;
  viewRef: (el: HTMLDivElement | null) => void;
  stripRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div style={{ transform: `rotate(${item.tilt ?? 0}deg)` }}>
      <div className="relative mx-auto w-[168px] overflow-hidden rounded-[26px] border-[6px] border-[#111111] bg-white shadow-[0_30px_60px_-30px_rgba(17,17,17,0.45)]">
        <div className="absolute top-0 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-[#111111]" />
        <div className="flex items-center justify-between px-4 pt-1.5 pb-1">
          <span className="text-[8px] font-bold text-[#111111]" style={{ fontFamily: SANS }}>
            {HEADER[item.kind]}
          </span>
          <span className="h-1.5 w-4 rounded-sm bg-[#111111]/20" />
        </div>
        <div ref={viewRef} className="relative overflow-hidden" style={{ height: VIEW_H }}>
          <div ref={stripRef} className="will-change-transform">
            <FeedCards kind={item.kind} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* translate each feed strip to `cur` (0→1) of its scrollable range */
function driveFeeds(
  strips: Array<HTMLDivElement | null>,
  views: Array<HTMLDivElement | null>,
  cur: number,
  items: PhoneItem[],
) {
  for (let i = 0; i < strips.length; i++) {
    const strip = strips[i];
    const view = views[i];
    if (!strip || !view) continue;
    const scrollable = Math.max(0, strip.scrollHeight - view.clientHeight);
    const y = Math.min(scrollable, cur * scrollable * (items[i].speed ?? 1));
    strip.style.transform = `translateY(${-y}px)`;
  }
}

const CROWD = [
  { kind: "instagram" as FeedKind, tilt: -8 },
  { kind: "video" as FeedKind, tilt: 3 },
  { kind: "facebook" as FeedKind, tilt: 9 },
];

/* Homepage — a PINNED scroll-scrub. The stage sticks; scroll drives the feeds
   0→1; only when they finish does the page release to the next section. */
export function SocialHomeSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const strips = useRef<Array<HTMLDivElement | null>>([]);
  const views = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let cur = 0;
    const tick = () => {
      const r = track.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const target = span > 0 ? clamp01(-r.top / span) : 0;
      cur += (target - cur) * 0.12;
      driveFeeds(strips.current, views.current, cur, CROWD);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
 <section ref={trackRef} id="social" className="relative bg-white" style={{ height: "130vh" }}>
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-7 overflow-hidden px-6 text-center">
        <div>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            Social Media
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#111111] md:text-6xl" style={{ fontFamily: SANS }}>
            Where attention already lives.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-[#111111]/55 md:text-[16px]" style={{ fontFamily: SANS }}>
            Every age, every feed — thumbs already scrolling. Keep scrolling: the
            feeds move with you.
          </p>
        </div>

        {/* the trio is ~500px wide at full size; scale it down on phones so all
            three fit on screen (like desktop), stepping back up as width allows */}
        <div className="flex items-center justify-center scale-[0.62] min-[430px]:scale-[0.72] min-[540px]:scale-90 sm:scale-100">
          {CROWD.map((item, i) => (
            <div
              key={i}
              className={i === 1 ? "z-30 -mx-3 scale-[1.02] md:-mx-1" : i === 0 ? "z-10 scale-[0.86]" : "z-20 scale-[0.86]"}
            >
              <PhoneFrame
                item={item}
                viewRef={(el) => { views.current[i] = el; }}
                stripRef={(el) => { strips.current[i] = el; }}
              />
            </div>
          ))}
        </div>

        <PlatformBadges />

        <a
          href="/social"
          className="inline-flex min-h-[50px] items-center rounded-full bg-[#1e6b3c] px-8 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
          style={{ fontFamily: SANS }}
        >
          Discover social →
        </a>
      </div>
    </section>
  );
}

const ROW: PhoneItem[] = [
  { kind: "video", title: "The For-You Page", blurb: "Native, thumb-stopping video built for the algorithm that already owns your customer's attention." },
  { kind: "linkedin", title: "LinkedIn", blurb: "Authority in the feed buyers actually trust — founder voice, company presence, inbound that closes." },
  { kind: "reviews", title: "Google Reviews", blurb: "Reputation on autopilot — the five-star proof that closes the customer before they ever call." },
];

/* /social page — the three titled phones scrub as the row crosses the viewport. */
export function SocialPhoneRow() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const strips = useRef<Array<HTMLDivElement | null>>([]);
  const views = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let cur = 0;
    const tick = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const target = clamp01((vh - r.top) / (vh + r.height));
      cur += (target - cur) * 0.1;
      driveFeeds(strips.current, views.current, cur, ROW);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {ROW.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <PhoneFrame
            item={item}
            viewRef={(el) => { views.current[i] = el; }}
            stripRef={(el) => { strips.current[i] = el; }}
          />
          <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-[#111111]" style={{ fontFamily: SANS }}>
            {item.title}
          </h3>
          <p className="mt-2 max-w-[240px] text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
            {item.blurb}
          </p>
        </div>
      ))}
    </div>
  );
}
