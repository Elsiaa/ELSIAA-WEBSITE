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

const SANS = "var(--font-sans)";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export const PLATFORMS = ["Instagram", "TikTok", "X", "Facebook", "LinkedIn"] as const;

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

/** LinkedIn's "in" mark — brand chrome for the feed mockup */
function LinkedInMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.1 9.4H4.7V19h2.4V9.4zM5.9 8.4a1.4 1.4 0 100-2.8 1.4 1.4 0 000 2.8zM19.3 19h-2.4v-4.7c0-1.2-.4-2-1.5-2-.8 0-1.3.5-1.5 1.1-.1.2-.1.5-.1.8V19H11.4s0-8.7 0-9.6h2.4v1.4c.3-.5 1-1.3 2.4-1.3 1.8 0 3.1 1.1 3.1 3.6V19z"
      />
    </svg>
  );
}

/** Google's four-colour G — brand chrome for the reviews mockup */
function GoogleG({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0012 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 010-4.6V6.7H1.4a12 12 0 000 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 001.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
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
  return (
    <span
      className="block h-1.5 rounded-full"
      style={{ width: w, background: `rgba(17,17,17,${o})` }}
    />
  );
}

/* Illustrative content for the interface mockups. These are example client
   businesses, not ELSIAA's own accounts, and no quote here is attributed to a
   real reviewer — the surrounding caption says so on the page. */
const CLIPS = [
  {
    handle: "@northside.cafe",
    caption: "The 6am prep nobody sees ☕",
    audio: "original sound — northside.cafe",
    likes: "128.4k",
    comments: "1,204",
    shares: "3,981",
  },
  {
    handle: "@meridian.studio",
    caption: "Behind every launch: three weeks of this",
    audio: "Lo-Fi Morning — Aster",
    likes: "42.1k",
    comments: "618",
    shares: "1,102",
  },
  {
    handle: "@northside.cafe",
    caption: "POV: your regular walks in and you already started it",
    audio: "original sound — northside.cafe",
    likes: "301.7k",
    comments: "4,338",
    shares: "12.6k",
  },
  {
    handle: "@hartley.home",
    caption: "Restock day. Everything has a place.",
    audio: "Slow Sunday — Vela",
    likes: "76.9k",
    comments: "902",
    shares: "2,410",
  },
];

const POSTS = [
  {
    name: "Danielle Roth",
    role: "Founder, Northside Cafe",
    when: "2h",
    copy: "We stopped guessing what to post. Three months in, the morning rush is our slowest hour to staff and our busiest to serve.",
    reactions: "214",
    comments: "18",
  },
  {
    name: "Marcus Bell",
    role: "Operations Director, Hartley Home",
    when: "6h",
    copy: "Took our whole catalogue from spreadsheets to a live storefront. The team hasn't touched a CSV since.",
    reactions: "88",
    comments: "4",
  },
  {
    name: "Priya Nair",
    role: "Managing Partner, Meridian Studio",
    when: "1d",
    copy: "The thing nobody tells you about content: consistency beats production value. We post four times a week now, every week.",
    reactions: "512",
    comments: "63",
  },
  {
    name: "Tom Aldridge",
    role: "GM, Fairline Services",
    when: "2d",
    copy: "Our intake line answers at 2am now. First month, eleven jobs booked overnight that used to go to voicemail.",
    reactions: "31",
    comments: "2",
  },
  {
    name: "Elena Vasquez",
    role: "Director, Cedar Clinic",
    when: "4d",
    copy: "Patients get routed to the right specialist without a receptionist playing traffic cop. That was the whole ask.",
    reactions: "140",
    comments: "20",
  },
];

const REVIEWS_FEED = [
  {
    name: "Sarah M.",
    initial: "S",
    when: "2 weeks ago",
    stars: 5,
    text: "Booked online in under a minute and they were early. Genuinely the smoothest experience I've had with a local business.",
    reply: "Thanks Sarah — glad the new booking flow worked for you.",
  },
  {
    name: "James O.",
    initial: "J",
    when: "1 month ago",
    stars: 5,
    text: "Called after hours expecting voicemail and got a straight answer. Sorted the same week.",
    reply: null,
  },
  {
    name: "Ana P.",
    initial: "A",
    when: "1 month ago",
    stars: 5,
    text: "Clear pricing up front, no surprises on the invoice. Rare.",
    reply: "Appreciate it, Ana. See you next service.",
  },
  {
    name: "Daniel K.",
    initial: "D",
    when: "2 months ago",
    stars: 4,
    text: "Great work overall. Only note is parking was tricky on the day.",
    reply: null,
  },
];

const IG_POSTS = [
  {
    user: "northside.cafe",
    when: "2h",
    caption: "New single-origin landed this morning. Limited bags.",
    likes: "2,481",
  },
  {
    user: "hartley.home",
    when: "5h",
    caption: "Restock day — the shelf everyone asks about.",
    likes: "1,097",
  },
  { user: "meridian.studio", when: "1d", caption: "Six weeks of work, one frame.", likes: "4,332" },
  {
    user: "cedar.clinic",
    when: "2d",
    caption: "New wing opens Monday. Booking is live.",
    likes: "861",
  },
];

const IG_STORIES = ["Menu", "Team", "Hours", "New", "FAQ"];

const FB_POSTS = [
  {
    page: "Northside Cafe",
    when: "3h",
    copy: "We're open until 4 today — the patio is finally back.",
    likes: "312",
    comments: "24",
    shares: "8",
  },
  {
    page: "Hartley Home",
    when: "8h",
    copy: "Autumn range is in store now. Same prices as last season.",
    likes: "148",
    comments: "11",
    shares: "3",
  },
  {
    page: "Fairline Services",
    when: "1d",
    copy: "Emergency line now answers 24/7 — no more voicemail after six.",
    likes: "96",
    comments: "7",
    shares: "14",
  },
  {
    page: "Cedar Clinic",
    when: "3d",
    copy: "Flu clinic starts next week. Walk-ins welcome Tuesday and Thursday.",
    likes: "204",
    comments: "31",
    shares: "22",
  },
];

/** Instagram's gradient camera glyph */
function InstagramMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="igg" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset=".3" stopColor="#FA7E1E" />
          <stop offset=".6" stopColor="#D62976" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#igg)" />
      <rect
        x="5.5"
        y="5.5"
        width="13"
        height="13"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16.4" cy="7.6" r="1" fill="#fff" />
    </svg>
  );
}

/** Facebook's f */
function FacebookMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="5" fill="#1877F2" />
      <path
        fill="#fff"
        d="M15.4 12.6l.4-2.6h-2.5V8.3c0-.7.35-1.4 1.5-1.4h1.15V4.7s-1.05-.18-2-.18c-2.05 0-3.4 1.24-3.4 3.5V10H8.3v2.6h2.25V19h2.75v-6.4h2.1z"
      />
    </svg>
  );
}

function FeedCards({ kind }: { kind: FeedKind }) {
  if (kind === "video") {
    // full-screen clips — scrolling swipes up to the next one
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative overflow-hidden bg-[#111111]" style={{ height: VIEW_H }}>
            {/* the actual clip — muted, looping, decorative */}
            <video
              src={`/assets/social/fyp${i + 1}.mp4`}
              autoPlay
              loop
              muted
              playsInline
              preload={i === 0 ? "auto" : "none"}
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              style={{ transform: "scale(1.02)" }}
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/25"
            />
            <div className="absolute inset-x-0 top-0 flex gap-1 p-2">
              {[0, 1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`h-[3px] flex-1 rounded-full ${s <= i ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
            {/* action rail */}
            <div className="absolute right-1.5 bottom-3 flex flex-col items-center gap-2">
              <span
                className="mb-0.5 grid h-7 w-7 place-items-center rounded-full border-[1.5px] border-white bg-[#1e6b3c] text-[9px] font-bold text-white"
                style={{ fontFamily: SANS }}
              >
                {CLIPS[i].handle[1].toUpperCase()}
              </span>
              {(
                [
                  ["♥", CLIPS[i].likes],
                  ["💬", CLIPS[i].comments],
                  ["↗", CLIPS[i].shares],
                ] as const
              ).map(([g, n], k) => (
                <span key={k} className="flex flex-col items-center gap-0.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-white/25 text-[12px] text-white">
                    {g}
                  </span>
                  <span
                    className="text-[7.5px] font-bold text-white drop-shadow"
                    style={{ fontFamily: SANS }}
                  >
                    {n}
                  </span>
                </span>
              ))}
            </div>
            {/* caption block */}
            <div className="absolute bottom-2.5 left-2 max-w-[70%]" style={{ fontFamily: SANS }}>
              <p className="text-[9.5px] font-bold text-white drop-shadow">{CLIPS[i].handle}</p>
              <p className="mt-0.5 text-[8.5px] leading-snug text-white/90 drop-shadow">
                {CLIPS[i].caption}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[7.5px] text-white/75">
                <span aria-hidden>♪</span>
                <span className="truncate">{CLIPS[i].audio}</span>
              </p>
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
        <div
          className="flex items-center gap-1.5 border-b border-black/[0.06] px-2.5 py-1.5"
          style={{ fontFamily: SANS }}
        >
          <InstagramMark className="h-4 w-4 shrink-0" />
          <span className="text-[9px] font-bold text-[#111111]">Instagram</span>
          <span className="ml-auto text-[7.5px] text-[#111111]/45">8,204 followers</span>
        </div>
        <div className="flex gap-2.5 border-b border-black/[0.06] px-2.5 py-2">
          {IG_STORIES.map((label) => (
            <span key={label} className="flex w-8 shrink-0 flex-col items-center gap-0.5">
              <span
                className="h-8 w-8 rounded-full p-[2px]"
                style={{
                  background: "conic-gradient(from 210deg, #FEDA75, #D62976, #4F5BD5, #FEDA75)",
                }}
              >
                <span className="block h-full w-full rounded-full border-2 border-white bg-[#e9ebed]" />
              </span>
              <span className="text-[6px] text-[#111111]/55" style={{ fontFamily: SANS }}>
                {label}
              </span>
            </span>
          ))}
        </div>
        <div className="space-y-3 p-2">
          {IG_POSTS.map((post, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 pb-1.5" style={{ fontFamily: SANS }}>
                <span className="h-5 w-5 shrink-0 rounded-full bg-[#D62976]/15" />
                <span className="text-[8px] font-bold text-[#111111]">{post.user}</span>
                <span className="text-[7px] text-[#111111]/40">· {post.when}</span>
                <span className="ml-auto text-[12px] leading-none text-[#111111]/30">···</span>
              </div>
              <img
                src={i % 2 === 0 ? "/assets/social/feed1.png" : "/assets/social/feed2.png"}
                alt=""
                loading="lazy"
                className="h-32 w-full rounded-lg object-cover"
              />
              <div className="flex items-center gap-3 pt-1.5 text-[13px] text-[#111111]/70">
                <span>♥</span>
                <span>💬</span>
                <span>↗</span>
                <span className="ml-auto">🔖</span>
              </div>
              <div className="mt-1" style={{ fontFamily: SANS }}>
                <p className="text-[7.5px] font-bold text-[#111111]">{post.likes} likes</p>
                <p className="mt-0.5 text-[7.5px] leading-snug text-[#111111]/70">
                  <span className="font-bold text-[#111111]">{post.user}</span> {post.caption}
                </p>
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
        {/* profile strip — the brand chrome above the feed */}
        <div className="flex items-center gap-1.5 rounded-xl border border-black/[0.07] bg-white px-2.5 py-2">
          <LinkedInMark className="h-4 w-4 shrink-0 rounded-[3px]" />
          <span className="text-[9px] font-bold text-[#0A66C2]" style={{ fontFamily: SANS }}>
            LinkedIn
          </span>
          <span className="ml-auto flex items-center gap-1">
            <span className="text-[7.5px] text-[#111111]/45" style={{ fontFamily: SANS }}>
              2,481 followers
            </span>
          </span>
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
            <div className="flex items-start gap-1.5">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0A66C2]/12 text-[8px] font-bold text-[#0A66C2]"
                style={{ fontFamily: SANS }}
              >
                {POSTS[i].name[0]}
              </span>
              <div className="min-w-0 flex-1" style={{ fontFamily: SANS }}>
                <p className="truncate text-[8.5px] font-bold text-[#111111]">{POSTS[i].name}</p>
                <p className="truncate text-[7px] text-[#111111]/50">{POSTS[i].role}</p>
                <p className="text-[7px] text-[#111111]/40">{POSTS[i].when} · 🌐</p>
              </div>
              <span
                className="shrink-0 rounded-full border border-[#0A66C2]/45 px-2 py-0.5 text-[8px] font-bold text-[#0A66C2]"
                style={{ fontFamily: SANS }}
              >
                + Follow
              </span>
            </div>
            <p
              className="mt-1.5 text-[7.5px] leading-[1.45] text-[#111111]/75"
              style={{ fontFamily: SANS }}
            >
              {POSTS[i].copy}
            </p>
            {i % 2 === 0 && (
              <img
                src={i === 0 ? "/assets/social/feed1.png" : "/assets/social/feed2.png"}
                alt=""
                loading="lazy"
                className="mt-1.5 h-14 w-full rounded-lg object-cover"
              />
            )}
            <div className="mt-2 flex items-center gap-1.5 border-t border-black/[0.05] pt-1.5">
              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#0A66C2] text-[7px] text-white">
                👍
              </span>
              <span className="text-[8px] text-[#111111]/45" style={{ fontFamily: SANS }}>
                {POSTS[i].reactions} · {POSTS[i].comments} comments
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
        <div
          className="flex items-center gap-1.5 rounded-xl border border-black/[0.07] bg-white px-2.5 py-2"
          style={{ fontFamily: SANS }}
        >
          <FacebookMark className="h-4 w-4 shrink-0 rounded-[3px]" />
          <span className="text-[9px] font-bold text-[#1877F2]">Facebook</span>
          <span className="ml-auto text-[7.5px] text-[#111111]/45">5,612 page likes</span>
        </div>
        {FB_POSTS.map((post, i) => (
          <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1877F2]/12 text-[8px] font-bold text-[#1877F2]"
                style={{ fontFamily: SANS }}
              >
                {post.page[0]}
              </span>
              <div className="min-w-0 flex-1" style={{ fontFamily: SANS }}>
                <p className="truncate text-[8.5px] font-bold text-[#111111]">{post.page}</p>
                <p className="text-[7px] text-[#111111]/40">{post.when} · 🌐</p>
              </div>
            </div>
            <p
              className="mt-1.5 text-[7.5px] leading-[1.45] text-[#111111]/75"
              style={{ fontFamily: SANS }}
            >
              {post.copy}
            </p>
            <img
              src={i % 2 === 0 ? "/assets/social/feed2.png" : "/assets/social/feed1.png"}
              alt=""
              loading="lazy"
              className="mt-1.5 h-20 w-full rounded-lg object-cover"
            />
            <div
              className="mt-1.5 flex items-center gap-1 border-b border-black/[0.05] pb-1.5"
              style={{ fontFamily: SANS }}
            >
              <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#1877F2] text-[7px] text-white">
                👍
              </span>
              <span className="text-[7.5px] text-[#111111]/45">{post.likes}</span>
              <span className="ml-auto text-[7.5px] text-[#111111]/45">
                {post.comments} comments · {post.shares} shares
              </span>
            </div>
            <div
              className="mt-1.5 grid grid-cols-3 text-center text-[8px] font-semibold text-[#111111]/45"
              style={{ fontFamily: SANS }}
            >
              <span>👍 Like</span>
              <span>💬 Comment</span>
              <span>↗ Share</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  // reviews — Google-branded chrome and the local-SEO panel underneath.
  // Content stays as placeholder shapes rather than invented review text:
  // this illustrates the surface we manage, not testimonials anyone wrote.
  return (
    <div className="space-y-2 p-2">
      {/* business summary card */}
      <div className="rounded-xl border border-black/[0.07] bg-white p-2.5">
        <div className="flex items-center gap-1.5">
          <GoogleG className="h-4 w-4 shrink-0" />
          <span
            className="text-[9px] font-bold tracking-[0.02em] text-[#111111]/75"
            style={{ fontFamily: SANS }}
          >
            Google Business Profile
          </span>
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span
            className="text-[22px] leading-none font-semibold tracking-[-0.03em] text-[#111111]"
            style={{ fontFamily: SANS }}
          >
            4.9
          </span>
          <span className="flex gap-0.5 pb-0.5">
            {Array.from({ length: 5 }).map((_, s2) => (
              <span key={s2} className="text-[10px] leading-none text-[#FBBC05]">
                ★
              </span>
            ))}
          </span>
        </div>
        {/* star distribution */}
        <div className="mt-2 space-y-[3px]">
          {[92, 6, 1, 0, 1].map((w, r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span className="w-[5px] text-[7px] text-[#111111]/40" style={{ fontFamily: SANS }}>
                {5 - r}
              </span>
              <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-black/[0.07]">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[#FBBC05]"
                  style={{ width: `${w}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* local SEO panel */}
      <div className="rounded-xl border border-black/[0.07] bg-white p-2.5">
        <span
          className="text-[8px] font-bold tracking-[0.12em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: SANS }}
        >
          Local SEO
        </span>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {[
            ["Map pack", "#1"],
            ["Search views", "12.4k"],
            ["Direction taps", "486"],
            ["Calls", "203"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-lg bg-black/[0.03] px-2 py-1.5">
              <p
                className="text-[11px] leading-none font-semibold text-[#111111]"
                style={{ fontFamily: SANS }}
              >
                {v}
              </p>
              <p
                className="mt-1 text-[7.5px] leading-none text-[#111111]/50"
                style={{ fontFamily: SANS }}
              >
                {l}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-[8px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            ↑ 38%
          </span>
          <span className="text-[7.5px] text-[#111111]/45" style={{ fontFamily: SANS }}>
            discovery searches, 90 days
          </span>
        </div>
      </div>

      {/* the review stream itself — shapes only */}
      {REVIEWS_FEED.map((r, i) => (
        <div key={i} className="rounded-xl border border-black/[0.06] bg-white p-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#1e6b3c]/12 text-[8px] font-bold text-[#1e6b3c]"
              style={{ fontFamily: SANS }}
            >
              {r.initial}
            </span>
            <div className="min-w-0 flex-1" style={{ fontFamily: SANS }}>
              <p className="truncate text-[8.5px] font-bold text-[#111111]">{r.name}</p>
              <p className="text-[7px] text-[#111111]/45">{r.when}</p>
            </div>
            <GoogleG className="h-3 w-3 shrink-0 opacity-70" />
          </div>
          <div className="mt-1.5 flex gap-0.5">
            {Array.from({ length: 5 }).map((_, s2) => (
              <span
                key={s2}
                className={`text-[11px] leading-none ${s2 < r.stars ? "text-[#FBBC05]" : "text-[#111111]/15"}`}
              >
                ★
              </span>
            ))}
          </div>
          <p
            className="mt-1.5 text-[7.5px] leading-[1.45] text-[#111111]/70"
            style={{ fontFamily: SANS }}
          >
            {r.text}
          </p>
          {r.reply && (
            <div className="mt-1.5 rounded-lg bg-black/[0.03] p-1.5" style={{ fontFamily: SANS }}>
              <p className="text-[7px] font-bold text-[#111111]/60">Response from the owner</p>
              <p className="mt-0.5 text-[7px] leading-[1.4] text-[#111111]/55">{r.reply}</p>
            </div>
          )}
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
    <section
      ref={trackRef}
      id="social"
      className="relative bg-white [--track:118svh] md:[--track:130vh]"
      style={{ height: "var(--track)" }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-7 overflow-hidden px-6 text-center">
        {/* One word, same as Automations and Design — the division title carries
            the section; the phones below make the argument. */}
        <h2
          className="text-4xl font-semibold tracking-[-0.04em] text-[#111111] md:text-6xl"
          style={{ fontFamily: SANS }}
        >
          Social Media
        </h2>

        {/* the trio is ~500px wide at full size; scale it down on phones so all
            three fit on screen (like desktop), stepping back up as width allows */}
        <div className="flex items-center justify-center scale-[0.62] min-[430px]:scale-[0.72] min-[540px]:scale-90 sm:scale-100">
          {CROWD.map((item, i) => (
            <div
              key={i}
              className={
                i === 1
                  ? "z-30 -mx-3 scale-[1.02] md:-mx-1"
                  : i === 0
                    ? "z-10 scale-[0.86]"
                    : "z-20 scale-[0.86]"
              }
            >
              <PhoneFrame
                item={item}
                viewRef={(el) => {
                  views.current[i] = el;
                }}
                stripRef={(el) => {
                  strips.current[i] = el;
                }}
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
  {
    kind: "video",
    title: "The For-You Page",
    blurb:
      "Native, thumb-stopping video built for the algorithm that already owns your customer's attention.",
  },
  {
    kind: "linkedin",
    title: "LinkedIn",
    blurb:
      "Authority in the feed buyers actually trust — founder voice, company presence, inbound that closes.",
  },
  {
    kind: "reviews",
    title: "Google Reviews",
    blurb:
      "Reputation on autopilot — the five-star proof that closes the customer before they ever call.",
  },
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
    <div
      ref={wrapRef}
      tabIndex={0}
      role="group"
      aria-label="Social surfaces — swipe or use the arrow keys"
      className="-mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e6b3c] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:gap-12 sm:overflow-visible sm:px-0 sm:grid-cols-2 lg:grid-cols-3"
    >
      {ROW.map((item, i) => (
        <div
          key={i}
          className="flex w-[78vw] max-w-[300px] shrink-0 snap-center flex-col items-center text-center sm:w-auto sm:max-w-none sm:shrink"
        >
          <PhoneFrame
            item={item}
            viewRef={(el) => {
              views.current[i] = el;
            }}
            stripRef={(el) => {
              strips.current[i] = el;
            }}
          />
          <h3
            className="mt-5 text-xl font-semibold tracking-[-0.03em] text-[#111111] sm:mt-8"
            style={{ fontFamily: SANS }}
          >
            {item.title}
          </h3>
          <p
            className="mt-2 max-w-[240px] text-[14px] leading-relaxed text-[#111111]/55"
            style={{ fontFamily: SANS }}
          >
            {item.blurb}
          </p>
        </div>
      ))}
    </div>
  );
}
