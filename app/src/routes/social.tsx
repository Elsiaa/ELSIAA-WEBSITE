import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "../components/SiteNav";
import { Reveal } from "../components/Reveal";
import { PhoneFeed, PlatformBadges } from "../components/SocialMedia";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/social")({
  head: () => ({
    meta: [
      { title: "Social Media — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Social media done better — content strategy, personal brand, Meta ads, and TikTok Shop. We put your brand in the scroll and make it stop.",
      },
      { property: "og:title", content: "Social Media — ELSIAA" },
      {
        property: "og:description",
        content: "Content strategy, personal brand, Meta ads, and TikTok Shop — attention that converts.",
      },
      { property: "og:image", content: absoluteUrl("/assets/og_cover.png") },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/social") }],
  }),
  component: SocialPage,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

const COLUMNS: Array<{ kind: "fyp" | "ads" | "reviews"; label: string; title: string; blurb: string; speed: number }> = [
  { kind: "fyp", label: "For You", title: "The For-You Page", blurb: "Native, thumb-stopping video built for the algorithm that already owns your customer's attention.", speed: 12 },
  { kind: "ads", label: "Meta Ads", title: "Meta Ads", blurb: "Paid engine that turns the scroll into pipeline — tested creative, tight targeting, measured spend.", speed: 15 },
  { kind: "reviews", label: "Reviews", title: "Google Reviews", blurb: "Reputation on autopilot — the five-star proof that closes the customer before they ever call.", speed: 17 },
];

const OFFERS: Array<{ num: string; title: string; blurb: string }> = [
  { num: "01", title: "Content Strategy", blurb: "A calendar with a point of view — hooks, formats, and cadence engineered for reach, not vanity." },
  { num: "02", title: "Personal Brand", blurb: "Turn a founder into a category authority. The face people trust before they trust the company." },
  { num: "03", title: "Meta Ads", blurb: "Full-funnel paid social — creative, targeting, and reporting that ties every dollar to a result." },
  { num: "04", title: "TikTok Shop", blurb: "Storefront where the scroll happens — creators, live selling, and checkout without leaving the feed." },
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
      <section className="bg-white px-6 pt-40 pb-16 text-center md:pt-44">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            ELSIAA · Social Media
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold leading-[1.03] tracking-[-0.045em] md:text-7xl" style={{ fontFamily: SANS }}>
            Win the scroll.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-[#111111]/60 md:text-[18px]" style={{ fontFamily: SANS }}>
            Content, paid, and reputation working as one system — so the feed that
            owns your customer's attention starts working for you.
          </p>
          <PlatformBadges className="mt-9" />
        </Reveal>
      </section>

      {/* three scrolling surfaces */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              Three feeds. One system.
            </h2>
            <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
              The surfaces your customer already scrolls — we own all three.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {COLUMNS.map((c, i) => (
              <Reveal key={c.kind} delay={i * 0.08}>
                <div className="flex flex-col items-center text-center">
                  <PhoneFeed kind={c.kind} label={c.label} speed={c.speed} sway swaySpeed={5 + i} />
                  <h3 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-[#111111]" style={{ fontFamily: SANS }}>
                    {c.title}
                  </h3>
                  <p className="mt-2 max-w-[240px] text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
                    {c.blurb}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* what we run */}
      <section className="border-t border-black/[0.06] bg-white px-6 py-24 md:py-28">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
              What we run
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-[#111111] md:text-5xl" style={{ fontFamily: SANS }}>
              Content strategy to TikTok Shop.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERS.map((o, i) => (
              <Reveal key={o.num} delay={i * 0.06}>
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

      {/* speak to social media */}
      <section className="border-t border-black/[0.06] bg-[#F5F5F3] px-6 py-24 text-center md:py-28">
        <Reveal>
          <p className="text-[13px] font-bold text-[#1e6b3c]" style={{ fontFamily: SANS }}>
            Speak to social media
          </p>
          <div className="mt-6 flex items-center justify-center -space-x-3">
            <Avatar init="DS" />
            <Avatar init="YW" />
          </div>
          <p className="mx-auto mt-5 max-w-md text-[15px] leading-relaxed text-[#111111]/60" style={{ fontFamily: SANS }}>
            Dovid Spivak &amp; Yosef Weil run social at ELSIAA. Bring them your
            brand — they'll tell you exactly where the growth is.
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
