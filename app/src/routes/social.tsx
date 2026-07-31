import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { SocialPhoneRow } from "../components/SocialMedia";
import { absoluteUrl } from "../lib/site-url";
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
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

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

const OFFERS: Array<{ num: string; title: string; blurb: string }> = [
  { num: "01", title: "Strategy", blurb: "We study your business first, then build the plan — the angle, cadence, and story that makes the right people stop." },
  { num: "02", title: "Video Production", blurb: "Filmed, directed, and produced — thumb-stopping content shot for the platform, not repurposed onto it." },
  { num: "03", title: "Editing", blurb: "Fast, native edits — a hook in the first second and retention held to the last frame." },
  { num: "04", title: "Content & Copy", blurb: "Captions, carousels, and posts written to carry your voice and move people to act." },
  { num: "05", title: "Brand Setup", blurb: "Profiles, bios, highlights, and a consistent identity dialled in across every platform." },
  { num: "06", title: "Personal Brand", blurb: "Turn a founder into a category authority — the face people trust before they trust the company." },
  { num: "07", title: "Meta Ads", blurb: "Full-funnel paid social — creative, targeting, and reporting that ties every dollar to a result." },
  { num: "08", title: "Google Reviews", blurb: "Reputation on autopilot — the five-star proof that closes the customer before they ever call." },
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

function SocialPage() {
  return (
    <main className="bg-white text-[#111111] antialiased">
      <SiteNav />

      {/* hero */}
      <section className="bg-white px-6 pt-40 pb-14 text-center md:pt-44">
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

      {/* full-service — everything we run */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-20 md:py-24">
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
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map((o, i) => (
              <Reveal key={o.num} delay={(i % 4) * 0.05}>
                <div className="flex h-full flex-col rounded-2xl border border-black/[0.08] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/35 hover:shadow-[0_30px_70px_-45px_rgba(17,17,17,0.35)]">
                  <p className="text-[13px] font-bold tracking-[0.14em] text-[#1e6b3c]" style={{ fontFamily: SANS }}>
                    {o.num}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.02em]" style={{ fontFamily: SANS }}>
                    {o.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
                    {o.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* the feeds — where attention already lives */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-20 md:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              Where attention already lives.
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
              The surfaces your customer already scrolls — Instagram, TikTok, and the rest.
              We put your brand in the scroll and make it stop.
            </p>
          </Reveal>
          <div className="mt-12">
            <SocialPhoneRow />
          </div>
        </div>
      </section>

      {/* positioning — not just social */}
      <section className="border-t border-black/[0.06] bg-[#0b0d0c] px-6 py-20 text-center text-white md:py-28">
        <Reveal>
          <p className="text-[13px] font-bold text-[#2e9e58]" style={{ fontFamily: SANS }}>
            One team, one standard
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-[1.06] tracking-[-0.04em] md:text-5xl" style={{ fontFamily: SANS }}>
            It doesn't stop at social.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-relaxed text-white/65 md:text-[17px]" style={{ fontFamily: SANS }}>
            We build your software, design every surface of your brand, and run the online
            strategy that ties it together. The same team that engineers your systems and
            designs your product runs the best social presence in your market — so every
            touchpoint tells one story.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/automate"
              className="inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 text-[15px] font-semibold text-white transition-all hover:border-[#2e9e58] hover:text-[#2e9e58]"
              style={{ fontFamily: SANS }}
            >
              Automation & software
            </a>
            <a
              href="/designs"
              className="inline-flex min-h-[52px] items-center rounded-full border border-white/25 px-7 text-[15px] font-semibold text-white transition-all hover:border-[#2e9e58] hover:text-[#2e9e58]"
              style={{ fontFamily: SANS }}
            >
              Design
            </a>
          </div>
        </Reveal>
      </section>

      {/* speak to social media */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-20 text-center md:py-24">
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
