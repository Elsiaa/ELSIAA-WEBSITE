import { useEffect, useRef } from "react";
import { Reveal } from "./Reveal";

/*
  Social-media building blocks — shared by the homepage teaser and the /social
  page. Everything is code-drawn (no image assets): phone frames whose feeds are
  driven ENTIRELY by page scroll. As you scroll the section through the viewport
  the video phone swipes up through clips, LinkedIn scrolls its feed, Facebook /
  Google Reviews scroll theirs — all locked to the same scroll progress.
  Pure ink-on-white with ELSIAA green accents. Respects reduced motion.
*/

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

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

type FeedKind = "video" | "linkedin" | "facebook" | "reviews";

const HEADER: Record<FeedKind, string> = {
  video: "For You",
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

/* ScrollPhones — one rAF loop reads how far the group has moved through the
   viewport (0→1) and drives every phone's feed by that shared progress, so all
   the motion is controlled by page scroll. */
function ScrollPhones({ items, variant }: { items: PhoneItem[]; variant: "crowd" | "row" }) {
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
    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const tick = () => {
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the group enters from the bottom, 1 as it clears the top
      const target = clamp01((vh - r.top) / (vh + r.height));
      cur += (target - cur) * 0.1;
      for (let i = 0; i < strips.current.length; i++) {
        const strip = strips.current[i];
        const view = views.current[i];
        if (!strip || !view) continue;
        const scrollable = Math.max(0, strip.scrollHeight - view.clientHeight);
        const y = Math.min(scrollable, cur * scrollable * (items[i].speed ?? 1));
        strip.style.transform = `translateY(${-y}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [items]);

  const Phone = ({ item, i }: { item: PhoneItem; i: number }) => (
    <div style={{ transform: `rotate(${item.tilt ?? 0}deg)` }}>
      <div className="relative mx-auto w-[168px] overflow-hidden rounded-[26px] border-[6px] border-[#111111] bg-white shadow-[0_30px_60px_-30px_rgba(17,17,17,0.45)]">
        <div className="absolute top-0 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-[#111111]" />
        <div className="flex items-center justify-between px-4 pt-1.5 pb-1">
          <span className="text-[8px] font-bold text-[#111111]" style={{ fontFamily: SANS }}>
            {HEADER[item.kind]}
          </span>
          <span className="h-1.5 w-4 rounded-sm bg-[#111111]/20" />
        </div>
        <div
          ref={(el) => {
            views.current[i] = el;
          }}
          className="relative overflow-hidden"
          style={{ height: VIEW_H }}
        >
          <div
            ref={(el) => {
              strips.current[i] = el;
            }}
            className="will-change-transform"
          >
            <FeedCards kind={item.kind} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-5 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );

  if (variant === "crowd") {
    return (
      <div ref={wrapRef} className="flex items-center justify-center">
        {items.map((item, i) => (
          <div
            key={i}
            className={i === 1 ? "z-30 -mx-3 scale-[1.06] md:-mx-1" : i === 0 ? "z-10 scale-[0.9]" : "z-20 scale-[0.9]"}
          >
            <Phone item={item} i={i} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div ref={wrapRef} className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col items-center text-center">
          <Phone item={item} i={i} />
          {item.title && (
            <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-[#111111]" style={{ fontFamily: SANS }}>
              {item.title}
            </h3>
          )}
          {item.blurb && (
            <p className="mt-2 max-w-[240px] text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
              {item.blurb}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* Homepage graphic: a few people scrolling — a LinkedIn feed, a swipe-up video,
   and Facebook, all moving as you scroll the page. */
export function PhoneCrowd() {
  return (
    <ScrollPhones
      variant="crowd"
      items={[
        { kind: "linkedin", tilt: -8 },
        { kind: "video", tilt: 3 },
        { kind: "facebook", tilt: 9 },
      ]}
    />
  );
}

/* The three titled columns on the /social page — also scroll-driven. */
export function SocialPhoneRow() {
  return (
    <ScrollPhones
      variant="row"
      items={[
        { kind: "video", title: "The For-You Page", blurb: "Native, thumb-stopping video built for the algorithm that already owns your customer's attention." },
        { kind: "linkedin", title: "LinkedIn", blurb: "Authority in the feed buyers actually trust — founder voice, company presence, inbound that closes." },
        { kind: "reviews", title: "Google Reviews", blurb: "Reputation on autopilot — the five-star proof that closes the customer before they ever call." },
      ]}
    />
  );
}

/* The section that lives on the homepage. */
export function SocialHomeSection() {
  return (
    <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28" id="social">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="text-center">
            <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
              Social Media
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-[#111111] md:text-6xl" style={{ fontFamily: SANS }}>
              Where attention already lives.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]" style={{ fontFamily: SANS }}>
              Every age, every feed — thumbs already scrolling. Scroll and watch
              the feeds move: we put your brand in that scroll and make it stop.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 flex justify-center">
          <PhoneCrowd />
        </div>

        <Reveal delay={0.15}>
          <PlatformBadges className="mt-14" />
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-10 flex justify-center">
            <a
              href="/social"
              className="inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
              style={{ fontFamily: SANS }}
            >
              Discover social →
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
