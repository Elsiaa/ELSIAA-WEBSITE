import { Reveal } from "./Reveal";

/*
  Social-media building blocks — shared by the homepage teaser section and the
  full /social page. Everything is code-drawn (no image assets): phone frames
  with endlessly scrolling feeds, so it reads as "people on their phones,
  scrolling social media." Pure ink-on-white, ELSIAA green accents.
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

type FeedKind = "fyp" | "ads" | "reviews";

function FeedCard({ kind, i }: { kind: FeedKind; i: number }) {
  if (kind === "fyp") {
    return (
      <div className="relative overflow-hidden rounded-xl bg-[#eceef0]" style={{ height: 150 }}>
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/85 shadow-sm">
            <span className="ml-0.5 block h-0 w-0 border-y-[6px] border-l-[10px] border-y-transparent border-l-[#111111]" />
          </span>
        </div>
        <div className="absolute right-2 bottom-2 flex flex-col items-center gap-1">
          <span className="h-3 w-3 rounded-full bg-white/80" />
          <span className="text-[9px] font-semibold text-white drop-shadow" style={{ fontFamily: SANS }}>
            {[12, 8, 24, 3, 41][i % 5]}k
          </span>
        </div>
        <div className="absolute bottom-2 left-2 h-2 w-20 rounded-full bg-white/70" />
      </div>
    );
  }
  if (kind === "ads") {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white p-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-4 w-4 rounded-full bg-[#1e6b3c]/15" />
          <span className="h-1.5 w-14 rounded-full bg-black/15" />
          <span className="ml-auto text-[8px] font-semibold text-[#111111]/40" style={{ fontFamily: SANS }}>
            Sponsored
          </span>
        </div>
        <div className="mt-2 h-16 rounded-lg bg-[#eceef0]" />
        <button className="mt-2 w-full rounded-full bg-[#1e6b3c] py-1.5 text-[9px] font-bold text-white" style={{ fontFamily: SANS }}>
          Shop now →
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-2.5">
      <div className="flex items-center gap-1.5">
        <span className="h-4 w-4 rounded-full bg-[#1e6b3c]/15" />
        <span className="h-1.5 w-12 rounded-full bg-black/15" />
      </div>
      <div className="mt-1.5 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, s) => (
          <span key={s} className="text-[10px] leading-none text-[#1e6b3c]">
            ★
          </span>
        ))}
      </div>
      <div className="mt-1.5 space-y-1">
        <span className="block h-1.5 w-full rounded-full bg-black/10" />
        <span className="block h-1.5 w-4/5 rounded-full bg-black/10" />
      </div>
    </div>
  );
}

/* A phone frame whose feed scrolls forever. `kind` picks the content style,
   `speed` the loop duration (s), `tilt` a resting rotation for variety. */
export function PhoneFeed({
  kind,
  label,
  speed = 14,
  tilt = 0,
  sway = false,
  swaySpeed = 6,
  className = "",
}: {
  kind: FeedKind;
  label?: string;
  speed?: number;
  tilt?: number;
  sway?: boolean;
  swaySpeed?: number;
  className?: string;
}) {
  const cards = Array.from({ length: 6 });
  const strip = (
    <div className="flex flex-col gap-2 px-2 pb-2">
      {cards.map((_, i) => (
        <FeedCard key={i} kind={kind} i={i} />
      ))}
    </div>
  );
  return (
    <div
      className={`${sway ? "phone-sway" : ""} ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg`, transform: `rotate(${tilt}deg)`, animationDuration: sway ? `${swaySpeed}s` : undefined }}
    >
      <div className="relative mx-auto w-[168px] overflow-hidden rounded-[26px] border-[6px] border-[#111111] bg-white shadow-[0_30px_60px_-30px_rgba(17,17,17,0.45)]">
        {/* notch */}
        <div className="absolute top-0 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-b-xl bg-[#111111]" />
        {/* status bar */}
        <div className="flex items-center justify-between px-4 pt-1.5 pb-1">
          <span className="text-[8px] font-bold text-[#111111]" style={{ fontFamily: SANS }}>
            {label ?? "For You"}
          </span>
          <span className="h-1.5 w-4 rounded-sm bg-[#111111]/20" />
        </div>
        {/* scrolling viewport */}
        <div className="relative h-[300px] overflow-hidden">
          <div className="feed-scroll" style={{ animationDuration: `${speed}s` }}>
            {strip}
            {strip}
          </div>
          {/* soft top/bottom fade so cards enter/leave cleanly */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
        </div>
      </div>
    </div>
  );
}

/* Homepage graphic: a few people (different ages → different phones, tilts, and
   scroll speeds) all scrolling their feeds at once. */
export function PhoneCrowd() {
  const phones: Array<{ kind: FeedKind; label: string; tilt: number; speed: number; scale: string; z: string }> = [
    { kind: "reviews", label: "Reviews", tilt: -8, speed: 17, scale: "scale-[0.82]", z: "z-10" },
    { kind: "fyp", label: "For You", tilt: 4, speed: 12, scale: "scale-[1.02]", z: "z-30" },
    { kind: "ads", label: "Discover", tilt: 9, speed: 15, scale: "scale-[0.88]", z: "z-20" },
  ];
  return (
    <div className="flex items-center justify-center gap-[-10px]">
      {phones.map((p, i) => (
        <div key={i} className={`${p.scale} ${p.z} ${i === 1 ? "-mx-4 md:-mx-2" : ""}`}>
          <PhoneFeed kind={p.kind} label={p.label} tilt={p.tilt} speed={p.speed} sway swaySpeed={5 + i} />
        </div>
      ))}
    </div>
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
              Every age, every feed — thumbs already scrolling. We put your brand
              in that scroll and make it stop.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-14 flex justify-center">
            <PhoneCrowd />
          </div>
        </Reveal>

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
