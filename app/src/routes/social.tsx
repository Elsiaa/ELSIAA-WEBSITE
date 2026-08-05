import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { SocialPhoneRow } from "../components/SocialMedia";
import { absoluteUrl } from "../lib/site-url";
import { useState } from "react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social Media — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Full-service social media — video, editing, content, brand, Meta ads, and Google reviews. We manage every part of your presence and put your brand in front of the right people the right way.",
      },
      { property: "og:title", content: "Social Media — ELSIAA" },
      {
        property: "og:description",
        content:
          "Video, editing, content, brand, Meta ads, Google reviews — we run your whole social presence, strategised around your business.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/social") }],
  }),
  component: SocialPage,
});

const SANS =
  "var(--font-sans)";

/* ── platform brand glyphs (monochrome, inherit colour) ── */
const PLATFORMS: Array<{ name: string; svg: ReactNode }> = [
  {
    name: "Instagram",
    svg: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="3" y="3" width="18" height="18" rx="5.2" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 3c.3 2 1.5 3.6 3.5 3.9v2.7c-1.3.1-2.5-.3-3.6-1v5.9c0 3.3-2.4 5.6-5.4 5.6-3.1 0-5.5-2.6-5-5.8.4-2.3 2.3-4 4.6-4.1.4 0 .8 0 1.2.1v2.9c-.3-.1-.7-.2-1-.2-1.2 0-2.1 1-2 2.3.1 1.1 1 1.9 2.1 1.9 1.3 0 2.2-1 2.2-2.4V3h2.9z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 12a10 10 0 10-11.6 9.9v-7H8v-2.9h2.4V9.8c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5v1.8h2.6l-.4 2.9h-2.2v7A10 10 0 0022 12z" />
      </svg>
    ),
  },
  {
    name: "X",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.4 3H3.6C3 3 3 3 3 3.6v16.8c0 .6 0 .6.6.6h16.8c.6 0 .6 0 .6-.6V3.6c0-.6 0-.6-.6-.6zM8 18H5.5V9.5H8V18zM6.75 8.3a1.45 1.45 0 110-2.9 1.45 1.45 0 010 2.9zM18.5 18H16v-4.3c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V18H10.5V9.5h2.4v1.1h.03c.34-.64 1.16-1.3 2.4-1.3 2.56 0 3.03 1.7 3.03 3.9V18z" />
      </svg>
    ),
  },
  {
    name: "Google",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 11v2.9h4.1c-.2 1.2-1.5 3.4-4.1 3.4a4.6 4.6 0 010-9.2c1.3 0 2.2.6 2.7 1.1l1.9-1.9A7.2 7.2 0 0012 4.8a7.2 7.2 0 100 14.4c4.1 0 6.9-2.9 6.9-7 0-.5 0-.8-.1-1.2H12z" />
      </svg>
    ),
  },
];

/* Each capability gets its own anchored panel — what it is, what you get,
   and what it changes — so a prospect can be linked straight to the one
   thing they came for (/social#clipping, /social#ads, and so on). */
type Service = {
  id: string;
  art: string;
  eyebrow: string;
  title: string;
  lede: string;
  includes: string[];
  outcome: string;
};

const SERVICES: Service[] = [
  {
    id: "strategy", art: "/assets/social/strategy.png", eyebrow: "Strategy",
    title: "The plan comes before the camera.",
    lede: "We study the business — who actually buys, what they already believe, and what would move them — then set the angle, the cadence, and the story before anything gets filmed.",
    includes: ["Audience and competitor read", "Content pillars and posting cadence", "Hook library built for your category", "Monthly review against what performed"],
    outcome: "You stop guessing what to post and start posting against a thesis.",
  },
  {
    id: "video", art: "/assets/social/video.png", eyebrow: "Video Production",
    title: "Shot for the platform, not repurposed onto it.",
    lede: "We film on location or in studio, direct the talent, and produce content built vertical from the first frame. No landscape ad awkwardly cropped into a feed.",
    includes: ["Half or full day shoots on site", "Direction and shot lists", "Lighting, audio, and B-roll", "Raw footage handed back to you"],
    outcome: "A library deep enough to post from for months, not one hero video.",
  },
  {
    id: "clipping", art: "/assets/social/editing.png", eyebrow: "Clipping",
    title: "Record once. Post for a month.",
    lede: "Send one long recording — a podcast, webinar, interview, or a phone video from the floor. We find the moments that hold attention, cut them vertical, caption them, and schedule them out.",
    includes: ["Human-selected moments, not auto-splits", "Burned-in captions and safe framing", "Platform-native aspect and length", "12–20 clips from a typical session"],
    outcome: "One afternoon of your time becomes a month of feed.",
  },
  {
    id: "content", art: "/assets/social/content.png", eyebrow: "Content & Copy",
    title: "Written in your voice, built to move.",
    lede: "Captions, carousels, and long-form posts written by people who read the transcript and know the business — not spun out of a prompt and left to sound like everyone else.",
    includes: ["Captions and hooks per post", "Carousels and static design", "Long-form founder posts", "Comment replies in your voice"],
    outcome: "The feed sounds like you, consistently, without you writing it.",
  },
  {
    id: "brand", art: "/assets/social/brand.png", eyebrow: "Brand Setup",
    title: "Every profile says the same thing.",
    lede: "Profiles, bios, highlights, pinned posts, and link routing dialled in across every platform so a visitor lands on the same company wherever they find you.",
    includes: ["Profile and bio rewrite", "Highlight covers and pinned sets", "Link-in-bio routing to real pages", "Consistent handles and naming"],
    outcome: "No more dead profiles from 2019 undercutting the live one.",
  },
  {
    id: "personal", art: "/assets/social/personal.png", eyebrow: "Personal Brand",
    title: "People trust a person before a company.",
    lede: "We turn a founder or operator into the recognisable authority in the category — the face buyers already trust by the time they reach your website.",
    includes: ["Founder positioning and narrative", "Talking-head and POV formats", "Ghostwritten thought-leadership", "Podcast and guest placement"],
    outcome: "Inbound that arrives already sold on who you are.",
  },
  {
    id: "ads", art: "/assets/social/ads.png", eyebrow: "Paid Social",
    title: "Every dollar tied to a result.",
    lede: "Full-funnel paid social across Meta and TikTok — creative, targeting, and reporting run together so the ad account and the organic feed are not fighting each other.",
    includes: ["Creative built for paid, not boosted posts", "Audience and retargeting structure", "Weekly spend and result reporting", "Landing pages when the offer needs one"],
    outcome: "You know what a customer costs, and what to spend to get more.",
  },
  {
    id: "reviews", art: "/assets/social/reviews.png", eyebrow: "Reviews & Local",
    title: "The proof that closes before the call.",
    lede: "We automate the ask at the right moment, keep the Google Business Profile current, and make sure the local search result matches the business you actually run.",
    includes: ["Review requests timed to the job", "Profile, hours, photos, and posts", "Response drafting for every review", "Local ranking and discovery reporting"],
    outcome: "Buyers arrive having already read three good reasons to pick you.",
  },
];

const OFFERS: Array<{ num: string; title: string; blurb: string; art: string }> = [
  { art: "/assets/social/strategy.png", num: "1", title: "Strategy", blurb: "We study your business first, then build the plan — the angle, cadence, and story that makes the right people stop." },
  { art: "/assets/social/video.png", num: "2", title: "Video Production", blurb: "Filmed, directed, and produced — thumb-stopping content shot for the platform, not repurposed onto it." },
  { art: "/assets/social/editing.png", num: "3", title: "Editing", blurb: "Fast, native edits — a hook in the first second and retention held to the last frame." },
  { art: "/assets/social/content.png", num: "4", title: "Content & Copy", blurb: "Captions, carousels, and posts written to carry your voice and move people to act." },
  { art: "/assets/social/brand.png", num: "5", title: "Brand Setup", blurb: "Profiles, bios, highlights, and a consistent identity dialled in across every platform." },
  { art: "/assets/social/personal.png", num: "6", title: "Personal Brand", blurb: "Turn a founder into a category authority — the face people trust before they trust the company." },
  { art: "/assets/social/ads.png", num: "7", title: "Meta Ads", blurb: "Full-funnel paid social — creative, targeting, and reporting that ties every dollar to a result." },
  { art: "/assets/social/reviews.png", num: "8", title: "Google Reviews", blurb: "Reputation on autopilot — the five-star proof that closes the customer before they ever call." },
];

function Avatar({ init }: { init: string }) {
  return (
    <span
      className="grid h-14 w-14 place-items-center rounded-full border border-black/[0.08] bg-[#F5F5F3] text-[17px] font-semibold text-[#111111]/80"
      style={{ fontFamily: SANS }}
    >
      {init}
    </span>
  );
}

/* Mobile-only disclosure. The children are ALWAYS rendered — collapsing is done
   with grid-template-rows, so nothing is removed from the DOM and the panel is
   simply always open from md up. */
function MobileDetail({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-detail`}
        className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 text-[13.5px] font-semibold text-[#1e6b3c] md:hidden"
        style={{ fontFamily: SANS }}
      >
        {open ? "Less" : "What's included"}
        <span aria-hidden className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
          ⌄
        </span>
      </button>
      <div
        id={`${id}-detail`}
        className="grid transition-[grid-template-rows] duration-300 ease-out md:!grid-rows-[1fr]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </>
  );
}

function SocialPage() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="bg-white px-6 pt-32 pb-10 md:pb-14 text-center md:pt-44">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            ELSIAA · Social Media
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-7xl" style={{ fontFamily: SANS }}>
            Exposure is everything.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]" style={{ fontFamily: SANS }}>
            Unless it's done poorly. Your presence on social media decides whether your
            business unlocks its full success — so we manage every part of it and put
            your brand in front of the right people, the right way.
          </p>

          {/* platform logos */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-5">
            {PLATFORMS.map((p) => (
              <span
                key={p.name}
                aria-label={p.name}
                className="h-7 w-7 text-[#111111]/35 transition-colors hover:text-[#1e6b3c] md:h-8 md:w-8"
              >
                {p.svg}
              </span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* the feeds — where attention already lives */}
 <section className="bg-white px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-center text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              Where attention already lives.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
              The surfaces your customer already scrolls — Instagram, TikTok, and the rest.
              We put your brand in the scroll and make it stop.
            </p>
          </Reveal>
          <div className="mt-9">
            <SocialPhoneRow />
          </div>
        </div>
      </section>

      {/* full-service — everything we run */}
 <section className="bg-[#F5F5F3] px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
              Full-service
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              We run all of it — end to end.
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]" style={{ fontFamily: SANS }}>
              Video, editing, content, and brand — strategised around your business, then
              produced and posted to make you look like the best in your category. You
              stay in your business; we handle the feed.
            </p>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 md:mt-9 lg:grid-cols-4">
            {OFFERS.map((o, i) => (
              <Reveal key={o.num} className="h-full" delay={(i % 4) * 0.05}>
                <a
                  href={`#${SERVICES[i]?.id ?? ""}`}
                  className="group flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-3.5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)] md:p-6"
                >
                  <img
                    src={o.art}
                    alt=""
                    loading="lazy"
                    width={112}
                    height={112}
                    className="mx-auto h-14 w-14 object-contain transition-transform duration-300 group-hover:scale-105 md:h-28 md:w-28"
                  />
                  <p className="mt-2 text-[11px] font-bold tracking-[0.14em] text-[#1e6b3c] md:mt-3 md:text-[13px]" style={{ fontFamily: SANS }}>
                    {o.num}
                  </p>
                  <h3 className="mt-1 text-[14px] leading-tight font-semibold tracking-[-0.02em] md:mt-1.5 md:text-lg" style={{ fontFamily: SANS }}>
                    {o.title}
                  </h3>
                  {/* the blurb repeats the detail panel below — desktop only */}
                  <p className="mt-2.5 hidden flex-1 text-[14px] leading-relaxed text-[#111111]/60 md:block" style={{ fontFamily: SANS }}>
                    {o.blurb}
                  </p>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* clipping — one long recording becomes a month of short-form */}
      <section className="bg-white px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-7 md:gap-10 lg:grid-cols-[1fr_minmax(0,520px)] lg:gap-16">
            <Reveal>
              <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
                Clipping
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
                Record once. Post for a month.
              </h2>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#111111]/60 md:text-[16px]" style={{ fontFamily: SANS }}>
                Send us one long recording — a podcast, a webinar, an interview, a walkthrough,
                even a phone video from the shop floor. We find the moments that actually hold
                attention, cut them vertical, caption them, and schedule them out across every
                platform.
              </p>
              <ul className="mt-7 max-w-lg space-y-3">
                {[
                  ["Every clip is chosen, not chopped", "A person watches the whole recording and pulls the moments that earn a stop — not an automated split every thirty seconds."],
                  ["Captioned and framed for the feed", "Burned-in captions, safe margins, and a hook in the first second, sized for each platform."],
                  ["Scheduled across the month", "One session turns into a posting calendar, so the feed keeps moving while you get on with the business."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e6b3c]" />
                    <span style={{ fontFamily: SANS }}>
                      <span className="text-[14.5px] font-semibold text-[#111111]">{t}</span>
                      <span className="mt-0.5 block text-[14px] leading-relaxed text-[#111111]/60">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <a
                href="/quote?option=Clipping"
                className="mt-8 inline-flex min-h-[48px] items-center rounded-full bg-[#1e6b3c] px-7 text-[14px] font-semibold text-white transition-colors duration-300 hover:bg-[#111111]"
                style={{ fontFamily: SANS }}
              >
                Send us a recording →
              </a>
            </Reveal>

            {/* one source timeline fanning out into vertical clips */}
            <Reveal delay={0.1}>
              <div className="rounded-3xl border border-black/[0.08] bg-[#FBFBFA] p-6 md:p-8">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#111111]/45 uppercase" style={{ fontFamily: SANS }}>
                  One recording
                </p>
                {/* the source track, with the chosen windows lit */}
                <div className="mt-3 flex h-9 overflow-hidden rounded-lg bg-black/[0.07]">
                  {[6, 13, 9, 5, 15, 8, 11, 6, 14, 13].map((w, i) => (
                    <span
                      key={i}
                      className={i % 3 === 1 ? "bg-[#1e6b3c]" : ""}
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[12px] text-[#111111]/45" style={{ fontFamily: SANS }}>
                  48 minutes in · the lit sections are what earned a stop
                </p>

                <div className="mt-6 flex items-center gap-2 text-[12px] text-[#111111]/45" style={{ fontFamily: SANS }}>
                  <span className="h-px flex-1 bg-black/[0.09]" />
                  <span>becomes</span>
                  <span className="h-px flex-1 bg-black/[0.09]" />
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2.5">
                  {["0:22", "0:41", "0:18", "0:35"].map((len, i) => (
                    <div key={len} className="overflow-hidden rounded-lg border border-black/[0.07] bg-white">
                      <div className="relative aspect-[9/16] bg-[#111111]">
                        <video
                          src={`/assets/social/fyp${i + 1}.mp4`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="none"
                          aria-hidden
                          className="absolute inset-0 h-full w-full object-cover opacity-90"
                        />
                        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                        {/* burned-in caption stand-in */}
                        <span className="absolute inset-x-1.5 bottom-4 space-y-0.5">
                          <span className="block h-1 w-4/5 rounded-full bg-white/85" />
                          <span className="block h-1 w-3/5 rounded-full bg-white/60" />
                        </span>
                        <span
                          className="absolute bottom-1 left-1.5 text-[8px] font-bold text-white/90"
                          style={{ fontFamily: SANS }}
                        >
                          {len}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[12px] text-[#111111]/45" style={{ fontFamily: SANS }}>
                  Captioned, vertical, and queued — typically 12–20 clips per session.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* every capability, one anchored panel each */}
      <section className="bg-white px-6 py-10 md:py-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
              What we actually do
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              Eight jobs. Pick the one you need.
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {SERVICES.map((sv) => (
                <a
                  key={sv.id}
                  href={`#${sv.id}`}
                  className="inline-flex min-h-[40px] items-center rounded-full border border-black/10 px-4 text-[13px] font-medium text-[#111111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                  style={{ fontFamily: SANS }}
                >
                  {sv.eyebrow}
                </a>
              ))}
            </div>
          </Reveal>

          <div className="mt-7 space-y-3 md:mt-10 md:space-y-4">
            {SERVICES.map((sv, i) => (
              <Reveal key={sv.id} delay={Math.min(i * 0.03, 0.15)}>
                <article
                  id={sv.id}
                  className="scroll-mt-28 rounded-3xl border border-black/[0.08] bg-[#FBFBFA] p-5 md:p-9"
                >
                  <div className="grid grid-cols-[auto_1fr] gap-4 md:gap-9">
                    <img
                      src={sv.art}
                      alt=""
                      loading="lazy"
                      width={128}
                      height={128}
                      className="h-12 w-12 shrink-0 object-contain md:h-28 md:w-28"
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold tracking-[0.14em] text-[#1e6b3c] uppercase" style={{ fontFamily: SANS }}>
                        {sv.eyebrow}
                      </p>
                      <h3 className="mt-1.5 text-[19px] font-semibold tracking-[-0.03em] text-[#111111] md:mt-2 md:text-[28px]" style={{ fontFamily: SANS }}>
                        {sv.title}
                      </h3>
                      <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-[#111111]/65 md:mt-3 md:text-[15px]" style={{ fontFamily: SANS }}>
                        {sv.lede}
                      </p>

                      <MobileDetail id={sv.id}>
                      <div className="mt-4 grid gap-x-8 gap-y-1.5 md:mt-6 md:gap-y-2 sm:grid-cols-2">
                        {sv.includes.map((it) => (
                          <span key={it} className="flex gap-2.5 text-[14px] leading-relaxed text-[#111111]/70" style={{ fontFamily: SANS }}>
                            <span aria-hidden className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#1e6b3c]" />
                            {it}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.07] pt-4 md:mt-6 md:pt-5">
                        <p className="text-[14px] font-semibold text-[#111111]" style={{ fontFamily: SANS }}>
                          {sv.outcome}
                        </p>
                        <a
                          href={`/quote?option=${encodeURIComponent(sv.eyebrow)}`}
                          className="ml-auto inline-flex min-h-[44px] items-center text-[14px] font-semibold text-[#1e6b3c] transition-colors hover:text-[#111111]"
                          style={{ fontFamily: SANS }}
                        >
                          Get a quote for {sv.eyebrow.toLowerCase()} →
                        </a>
                      </div>
                      </MobileDetail>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* positioning — not just social */}
 <section className="bg-[#F5F5F3] px-6 py-10 text-center text-[#111111] md:py-16">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            One team, one standard
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-[1.06] tracking-[-0.04em] md:text-5xl" style={{ fontFamily: SANS }}>
            It doesn't stop at social.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-[#111111]/65 md:text-[17px]" style={{ fontFamily: SANS }}>
            We build your software, design every surface of your brand, and run the online
            strategy that ties it together. The same team that engineers your systems and
            designs your product runs the best social presence in your market — so every
            touchpoint tells one story.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/automate"
              className="inline-flex min-h-[52px] items-center rounded-full border border-black/15 px-7 text-[15px] font-semibold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={{ fontFamily: SANS }}
            >
              Automation & software
            </a>
            <a
              href="/designs"
              className="inline-flex min-h-[52px] items-center rounded-full border border-black/15 px-7 text-[15px] font-semibold text-[#111111] transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
              style={{ fontFamily: SANS }}
            >
              Design
            </a>
          </div>
        </Reveal>
      </section>

      {/* speak to social media */}
 <section className="bg-[#F5F5F3] px-6 py-10 text-center md:py-16">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            Speak to social media
          </p>
          <div className="mt-6 flex items-center justify-center -space-x-3">
            <Avatar init="DS" />
            <Avatar init="YW" />
          </div>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#111111]/60" style={{ fontFamily: SANS }}>
            Dovid Spivak &amp; Yosef Weil run social at ELSIAA. Bring them your brand —
            they'll tell you exactly where the growth is.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/contact"
              className="inline-flex min-h-[52px] items-center rounded-full bg-[#1e6b3c] px-9 text-[15px] font-semibold text-white transition-all hover:bg-[#111111]"
              style={{ fontFamily: SANS }}
            >
              Speak to social media →
            </a>
            <a
              href="/team"
              className="inline-flex min-h-[52px] items-center rounded-full border border-black/15 px-8 text-[15px] font-semibold text-[#111111] transition-all hover:border-[#1e6b3c]/40"
              style={{ fontFamily: SANS }}
            >
              Meet the team
            </a>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
