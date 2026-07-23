import { useEffect, useRef, useState } from "react";

/*
  Discover Graphics — every design service as its own premium moment.
  All previews are LIVE code animations (CSS/SVG), no static thumbnails.
  Cards expand in place with a Learn More panel; product-facing services
  carry the before/after treatment.
*/

/* ------------------------------------------------------------------ */
/* animated preview primitives                                         */
/* ------------------------------------------------------------------ */

function MarkAssemble() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full">
      <g className="ds-mark">
        <circle cx="60" cy="34" r="16" fill="none" stroke="#1e6b3c" strokeWidth="2.5" />
        <path d="M44 58 L60 40 L76 58" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="34" r="3.4" fill="#2e9e58" />
      </g>
      <g fill="#1e6b3c" className="ds-mark-dots">
        <circle cx="22" cy="20" r="2.4" />
        <circle cx="98" cy="18" r="2.4" />
        <circle cx="18" cy="66" r="2.4" />
        <circle cx="102" cy="70" r="2.4" />
      </g>
    </svg>
  );
}

function SwatchSystem() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2">
      {["#111111", "#1e6b3c", "#2e9e58", "#F5F5F3"].map((c, i) => (
        <div
          key={c}
          className="ds-swatch h-12 w-7 rounded-md border border-black/5"
          style={{ backgroundColor: c, animationDelay: `${i * 0.14}s` }}
        />
      ))}
      <span className="ds-swatch ml-2 font-serif text-2xl italic text-[#111111]" style={{ animationDelay: "0.6s" }}>
        Aa
      </span>
    </div>
  );
}

function BrowserWire() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-[78%] overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="flex gap-1 border-b border-black/5 bg-[#F5F5F3] px-2 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E53E3E]/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#d9a441]/60" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#2e9e58]/70" />
        </div>
        <div className="space-y-1.5 p-2.5">
          <div className="ds-bar h-2.5 w-3/5 rounded bg-[#111111]/80" />
          <div className="ds-bar h-1.5 w-4/5 rounded bg-black/15" style={{ animationDelay: "0.15s" }} />
          <div className="flex gap-1.5 pt-1">
            <div className="ds-bar h-8 w-1/3 rounded bg-[#1e6b3c]/15" style={{ animationDelay: "0.3s" }} />
            <div className="ds-bar h-8 w-1/3 rounded bg-[#1e6b3c]/25" style={{ animationDelay: "0.42s" }} />
            <div className="ds-bar h-8 w-1/3 rounded bg-[#1e6b3c]/40" style={{ animationDelay: "0.54s" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneUI() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-[86%] w-12 overflow-hidden rounded-[10px] border-2 border-[#111111]/70 bg-white p-1">
        <div className="ds-screens flex h-full w-[300%]">
          <div className="h-full w-1/3 space-y-1 pr-0.5">
            <div className="h-2 w-full rounded-sm bg-[#1e6b3c]/70" />
            <div className="h-1 w-4/5 rounded-sm bg-black/15" />
            <div className="h-5 w-full rounded-sm bg-[#F5F5F3]" />
          </div>
          <div className="h-full w-1/3 space-y-1 pr-0.5">
            <div className="h-5 w-full rounded-sm bg-[#2e9e58]/30" />
            <div className="h-1 w-full rounded-sm bg-black/15" />
            <div className="h-2 w-1/2 rounded-sm bg-[#111111]/70" />
          </div>
          <div className="h-full w-1/3 space-y-1">
            <div className="h-1 w-full rounded-sm bg-black/15" />
            <div className="h-1 w-3/4 rounded-sm bg-black/15" />
            <div className="h-4 w-full rounded-full bg-[#1e6b3c]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdTiles() {
  return (
    <div className="grid h-full w-full grid-cols-3 items-center gap-1.5 px-6">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="ds-tile flex aspect-square items-center justify-center rounded-md bg-[#F5F5F3] text-[13px] font-bold text-[#111111]/60"
          style={{ animationDelay: `${i * 0.12}s` }}
        >
          AD
        </div>
      ))}
    </div>
  );
}

function PackageBox() {
  return (
    <div className="flex h-full w-full items-center justify-center" style={{ perspective: "300px" }}>
      <div className="ds-cube relative h-14 w-14" style={{ transformStyle: "preserve-3d" }}>
        <div className="absolute inset-0 border border-[#1e6b3c]/60 bg-[#2e9e58]/15" style={{ transform: "translateZ(28px)" }} />
        <div className="absolute inset-0 border border-[#1e6b3c]/60 bg-[#2e9e58]/25" style={{ transform: "rotateY(90deg) translateZ(28px)" }} />
        <div className="absolute inset-0 border border-[#1e6b3c]/60 bg-[#2e9e58]/10" style={{ transform: "rotateY(180deg) translateZ(28px)" }} />
        <div className="absolute inset-0 border border-[#1e6b3c]/60 bg-[#2e9e58]/25" style={{ transform: "rotateY(-90deg) translateZ(28px)" }} />
        <div className="absolute inset-0 border border-[#1e6b3c]/60 bg-[#2e9e58]/30" style={{ transform: "rotateX(90deg) translateZ(28px)" }} />
      </div>
    </div>
  );
}

function PlayMotion() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-8">
      <div className="ds-bounce h-6 w-6 rounded-md bg-[#1e6b3c]" />
      <div className="relative h-1 w-full rounded bg-black/10">
        <div className="ds-scrub absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-[#111111]" />
      </div>
    </div>
  );
}

function PenIllu() {
  return (
    <svg viewBox="0 0 120 90" className="h-full w-full">
      <path
        className="ds-draw"
        d="M18 66 C 34 26, 52 22, 60 44 S 84 70, 102 30"
        fill="none"
        stroke="#111111"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle className="ds-draw-dot" cx="102" cy="30" r="3" fill="#E53E3E" />
    </svg>
  );
}

function ChartInfo() {
  return (
    <div className="flex h-full w-full items-end justify-center gap-2 px-10 pb-5">
      {[38, 62, 46, 78, 58].map((h, i) => (
        <div
          key={i}
          className="ds-grow w-4 rounded-t-sm bg-[#1e6b3c]"
          style={{ height: `${h}%`, animationDelay: `${i * 0.1}s`, opacity: 0.35 + i * 0.14 }}
        />
      ))}
    </div>
  );
}

function BeforeAfter() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img src="/assets/laptop_bad_v1.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
      <img src="/assets/laptop_premium_v1.jpg" alt="" aria-hidden className="ds-reveal absolute inset-0 h-full w-full object-cover" />
      <div className="ds-reveal-line absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_8px_rgba(0,0,0,0.4)]" />
    </div>
  );
}

function PrintSheet() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="ds-sheet absolute h-16 w-12 rounded-sm border border-black/10 bg-white shadow-sm" style={{ animationDelay: "0.2s" }} />
      <div className="ds-sheet absolute h-16 w-12 rounded-sm border border-black/10 bg-[#F5F5F3] shadow-sm" style={{ animationDelay: "0.1s" }} />
      <div className="ds-sheet absolute flex h-16 w-12 flex-col justify-between rounded-sm border border-black/10 bg-white p-1.5 shadow-md">
        <div className="h-1.5 w-1/2 rounded-sm bg-[#1e6b3c]" />
        <div className="space-y-0.5">
          <div className="h-0.5 w-full rounded bg-black/15" />
          <div className="h-0.5 w-3/4 rounded bg-black/15" />
        </div>
      </div>
    </div>
  );
}

function SignGlow() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-1.5">
      {"ELSIAA".split("").map((ch, i) => (
        <span
          key={i}
          className="ds-glow text-lg font-bold tracking-widest text-[#1e6b3c]"
          style={{ animationDelay: `${i * 0.16}s`, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

function MailSlide() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-[62%] overflow-hidden rounded-md border border-black/10 bg-white shadow-sm">
        <div className="h-3 w-full bg-[#1e6b3c]" />
        <div className="space-y-1 p-2">
          <div className="ds-bar h-1.5 w-4/5 rounded bg-black/20" />
          <div className="ds-bar h-1.5 w-3/5 rounded bg-black/10" style={{ animationDelay: "0.15s" }} />
          <div className="ds-bar mt-1.5 h-3 w-2/5 rounded-full bg-[#2e9e58]" style={{ animationDelay: "0.3s" }} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* data                                                                */
/* ------------------------------------------------------------------ */

type Service = {
  name: string;
  blurb: string;
  detail: string;
  preview: () => React.JSX.Element;
  beforeAfter?: boolean;
};

type Category = {
  eyebrow: string;
  title: string;
  lead: string;
  services: Service[];
};

const CATEGORIES: Category[] = [
  {
    eyebrow: "Identity",
    title: "Brand & Identity",
    lead: "The face your company shows the world — designed once, recognized forever.",
    services: [
      { name: "Logo Design", blurb: "Marks built to be remembered.", detail: "A logo is the single most repeated design decision your company will ever make. We design marks with mathematical construction, tested at every size from favicon to billboard, delivered in every format you'll ever need.", preview: MarkAssemble },
      { name: "Brand Identity Systems", blurb: "Color, type, and voice as one system.", detail: "A complete identity system: palettes, typography pairings, spacing rules, photography direction, and usage guidelines — so every touchpoint looks like it came from the same hand.", preview: SwatchSystem },
      { name: "Custom Visual Systems", blurb: "A design language only you own.", detail: "Bespoke grids, patterns, iconography, and motion rules that make your materials identifiable before anyone reads a word.", preview: MarkAssemble },
      { name: "Business Cards", blurb: "The handshake that stays behind.", detail: "Press-ready cards with real typographic care — stock, finish, and layout chosen to make the smallest canvas feel expensive.", preview: PrintSheet },
      { name: "Letterheads", blurb: "Documents that carry authority.", detail: "Letterheads and document templates that make every proposal, invoice, and letter feel official from the first glance.", preview: PrintSheet },
    ],
  },
  {
    eyebrow: "Digital",
    title: "Web & Product",
    lead: "Where your customers actually meet you — engineered to convert.",
    services: [
      { name: "Website Design", blurb: "Sites that sell while you sleep.", detail: "From landing pages to full corporate sites — designed around one job: turning visitors into inquiries. Fast, responsive, and built with intent in every scroll.", preview: BrowserWire },
      { name: "UI/UX Design", blurb: "Software people enjoy using.", detail: "Interface and experience design for web apps and platforms: user flows, wireframes, high-fidelity screens, and the interaction details that separate tools people tolerate from tools people love.", preview: BrowserWire },
      { name: "Mobile App Design", blurb: "Native-feeling, thumb-first design.", detail: "iOS and Android app design with platform-correct patterns, gesture-driven interactions, and design systems your developers can actually build from.", preview: PhoneUI },
      { name: "Interactive Graphics", blurb: "Visuals that respond to the visitor.", detail: "Scroll-driven stories, animated explainers, calculators, and live visualizations — the kind of experience you're inside right now.", preview: PlayMotion },
    ],
  },
  {
    eyebrow: "Growth",
    title: "Marketing & Advertising",
    lead: "Creative built to perform, not just to look good in a folder.",
    services: [
      { name: "Advertising Creatives", blurb: "Ads engineered to stop the scroll.", detail: "Concept-driven ad creative for every placement — static, carousel, and video — built in variants so you can test what actually converts.", preview: BeforeAfter, beforeAfter: true },
      { name: "Digital Ads", blurb: "Every size, every platform, one system.", detail: "Complete display and social ad sets: Meta, Google, LinkedIn, programmatic — resized and rebalanced by hand, not stretched.", preview: AdTiles },
      { name: "Social Media Graphics", blurb: "A feed that looks intentional.", detail: "Post templates, carousels, story frames, and cover art that make your channels look run by a design team — because they are.", preview: AdTiles },
      { name: "Email Designs", blurb: "Inboxes are design battlegrounds.", detail: "Newsletter and campaign templates that render beautifully in every client and drive clicks without shouting.", preview: MailSlide },
      { name: "Marketing Materials", blurb: "Everything sales needs to close.", detail: "One-pagers, brochures, case studies, and sales kits — consistent, current, and ready before the meeting.", preview: PrintSheet },
    ],
  },
  {
    eyebrow: "Product",
    title: "Product & Packaging",
    lead: "Make the thing you sell look like the best version of itself.",
    services: [
      { name: "Product Mockups", blurb: "Studio shots without the studio.", detail: "Amateur photos rebuilt as premium ad compositions — hero product centered, ingredients staged with intention, studio lighting, commercial finish. You watched this happen above.", preview: BeforeAfter, beforeAfter: true },
      { name: "Packaging Design", blurb: "Shelf presence you can feel.", detail: "Labels, boxes, and unboxing experiences designed for the two seconds a customer gives you before deciding.", preview: PackageBox },
      { name: "3D Graphics", blurb: "Products that turn in space.", detail: "3D renders, exploded views, and spins for products that don't exist yet — or ones you want to show from angles a camera can't reach.", preview: PackageBox },
    ],
  },
  {
    eyebrow: "Story",
    title: "Motion & Story",
    lead: "Movement is the difference between seen and remembered.",
    services: [
      { name: "Motion Graphics", blurb: "Logos and layouts that move.", detail: "Animated logos, kinetic type, promo videos, and cinemagraphs — motion design that gives your brand a pulse.", preview: PlayMotion },
      { name: "Illustrations", blurb: "Drawn in any voice you need.", detail: "Custom illustration from corporate-clean to deliberately hand-drawn (you met our office guy) — a visual voice no stock library can copy.", preview: PenIllu },
      { name: "Icons & Custom Assets", blurb: "The details that unify everything.", detail: "Icon sets, spot graphics, and UI assets drawn on one grid with one personality, so nothing in your product feels borrowed.", preview: PenIllu },
      { name: "Infographics", blurb: "Data people actually read.", detail: "Complex information redesigned into visuals that explain themselves — for reports, pitches, and social.", preview: ChartInfo },
      { name: "Presentation Design", blurb: "Decks that win the room.", detail: "Investor decks, sales presentations, and keynotes designed slide by slide — narrative first, decoration never.", preview: ChartInfo },
    ],
  },
  {
    eyebrow: "Physical",
    title: "Print & Environment",
    lead: "Design that survives contact with the real world.",
    services: [
      { name: "Print Design", blurb: "Ink, stock, and finish — mastered.", detail: "Brochures, posters, catalogs, and editorial layouts prepared press-ready, with color management handled properly.", preview: PrintSheet },
      { name: "Signage", blurb: "Readable at a glance, at a distance.", detail: "Storefront, wayfinding, and environmental signage designed for legibility, materials, and place.", preview: SignGlow },
      { name: "Event Graphics", blurb: "Own the room you're in.", detail: "Booth design, banners, badges, and stage visuals — a complete visual environment for launches, conferences, and trade shows.", preview: SignGlow },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* components                                                          */
/* ------------------------------------------------------------------ */

function ServiceCard({
  service,
  open,
  onToggle,
}: {
  service: Service;
  open: boolean;
  onToggle: () => void;
}) {
  const Preview = service.preview;
  return (
    <div
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-xl border transition-all duration-300 ${
        open
          ? "border-[#1e6b3c]/40 bg-white shadow-[0_24px_60px_-30px_rgba(30,107,60,0.35)]"
          : "border-black/[0.06] bg-[#FAFAF9] hover:-translate-y-1 hover:border-black/10 hover:bg-white hover:shadow-[0_18px_44px_-26px_rgba(17,17,17,0.3)]"
      }`}
      onClick={onToggle}
      role="button"
      aria-expanded={open}
    >
      <div className="ds-stage relative h-28 w-full overflow-hidden border-b border-black/[0.05]">
        <Preview />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h4
          className="text-[15px] font-semibold tracking-[-0.01em] text-[#111111]"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          {service.name}
        </h4>
        <p className="mt-1 text-[13px] leading-relaxed text-[#111111]/60" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
          {service.blurb}
        </p>
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-400 ease-out ${
            open ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <p className="text-[13px] leading-relaxed text-[#111111]/65" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
              {service.detail}
            </p>
            <a
              href="mailto:info@elsiaa.com?subject=Design%20project%20inquiry"
              onClick={(e) => e.stopPropagation()}
              className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[#1e6b3c]  transition-colors hover:text-[#2e9e58]"
              style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              Start a project <span>→</span>
            </a>
          </div>
        </div>
        <span
          className={`mt-auto pt-3 text-[13px]  transition-colors duration-300 ${
            open ? "text-[#1e6b3c]" : "text-[#111111]/50 group-hover:text-[#1e6b3c]/70"
          }`}
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          {open ? "− Close" : "+ Learn more"}
        </span>
      </div>
    </div>
  );
}

function CategoryBlock({ cat }: { cat: Category }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.classList.add("ds-in");
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="ds-cat mx-auto max-w-6xl px-6 py-16 md:py-20">
      <p
        className="text-[13px] text-[#1e6b3c] "
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
      >
        {cat.eyebrow}
      </p>
      <h3
        className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#111111] md:text-5xl"
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
      >
        {cat.title}
      </h3>
      <p className="mt-3 max-w-xl text-base text-[#111111]/60 md:text-lg" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}>
        {cat.lead}
      </p>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cat.services.map((s, i) => (
          <ServiceCard
            key={s.name}
            service={s}
            open={openIdx === i}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </div>
  );
}

export function DesignServices() {
  return (
    <section className="bg-white pb-8" id="design-services">
      <style>{`
        .ds-cat { opacity: 0; transform: translateY(36px); transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1); }
        .ds-cat.ds-in { opacity: 1; transform: none; }
        .ds-stage svg, .ds-stage > div { position: absolute; inset: 0; }
        @keyframes dsFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
        .ds-mark { transform-origin: 60px 44px; animation: dsFloat 3.4s ease-in-out infinite; }
        @keyframes dsOrbit { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        .ds-mark-dots { transform-origin: 60px 44px; animation: dsOrbit 9s linear infinite; }
        @keyframes dsPop { 0% { transform: translateY(10px) scale(.9); opacity: 0 } 60% { opacity: 1 } 100% { transform: none; opacity: 1 } }
        .ds-swatch { animation: dsPop .7s cubic-bezier(.22,.61,.36,1) both; }
        .group:hover .ds-swatch { animation: dsPop .7s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes dsBar { from { transform: scaleX(0); transform-origin: left } to { transform: scaleX(1); transform-origin: left } }
        .ds-bar { animation: dsBar .8s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes dsScreens { 0%, 28% { transform: translateX(0) } 33%, 61% { transform: translateX(-33.34%) } 66%, 94% { transform: translateX(-66.67%) } 100% { transform: translateX(0) } }
        .ds-screens { animation: dsScreens 7s ease-in-out infinite; }
        @keyframes dsTile { 0% { transform: scale(.7); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        .ds-tile { animation: dsTile .6s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes dsCube { from { transform: rotateX(-18deg) rotateY(0) } to { transform: rotateX(-18deg) rotateY(360deg) } }
        .ds-cube { animation: dsCube 8s linear infinite; }
        @keyframes dsBounce { 0%,100% { transform: translateY(0) scale(1) } 45% { transform: translateY(-14px) scale(1.04) } 55% { transform: translateY(-14px) } }
        .ds-bounce { animation: dsBounce 1.8s cubic-bezier(.34,1.56,.64,1) infinite; }
        @keyframes dsScrub { 0% { left: 0 } 100% { left: calc(100% - 12px) } }
        .ds-scrub { animation: dsScrub 1.8s ease-in-out infinite alternate; }
        @keyframes dsDraw { from { stroke-dashoffset: 200 } to { stroke-dashoffset: 0 } }
        .ds-draw { stroke-dasharray: 200; animation: dsDraw 2.6s ease-in-out infinite alternate; }
        @keyframes dsDot { 0%, 80% { opacity: 0 } 100% { opacity: 1 } }
        .ds-draw-dot { animation: dsDot 2.6s ease-in-out infinite alternate; }
        @keyframes dsGrow { from { transform: scaleY(0); transform-origin: bottom } to { transform: scaleY(1); transform-origin: bottom } }
        .ds-grow { animation: dsGrow .9s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes dsReveal { 0%, 12% { clip-path: inset(0 100% 0 0) } 48%, 62% { clip-path: inset(0 0 0 0) } 88%, 100% { clip-path: inset(0 100% 0 0) } }
        .ds-reveal { animation: dsReveal 6s ease-in-out infinite; }
        @keyframes dsRevealLine { 0%, 12% { left: 0 } 48%, 62% { left: 100% } 88%, 100% { left: 0 } }
        .ds-reveal-line { animation: dsRevealLine 6s ease-in-out infinite; }
        @keyframes dsSheet { 0% { transform: translateY(8px) rotate(0deg); } 100% { transform: translateY(0) rotate(var(--r, -6deg)); } }
        .ds-sheet { animation: dsSheet .8s cubic-bezier(.22,.61,.36,1) both; }
        .ds-sheet:nth-child(1) { --r: -8deg }
        .ds-sheet:nth-child(2) { --r: 6deg }
        .ds-sheet:nth-child(3) { --r: 0deg }
        @keyframes dsGlow { 0%, 100% { opacity: .25 } 50% { opacity: 1 } }
        .ds-glow { animation: dsGlow 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .ds-mark, .ds-mark-dots, .ds-swatch, .ds-bar, .ds-screens, .ds-tile, .ds-cube,
          .ds-bounce, .ds-scrub, .ds-draw, .ds-draw-dot, .ds-grow, .ds-reveal,
          .ds-reveal-line, .ds-sheet, .ds-glow { animation: none !important; }
          .ds-reveal { clip-path: inset(0 50% 0 0) !important; }
          .ds-cat { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="mx-auto max-w-6xl px-6 pt-24 pb-4 text-center md:pt-28">
        <p
          className="text-[13px] text-[#1e6b3c] "
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          Discover graphics
        </p>
        <h2
          className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-[#111111] md:text-6xl"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          Everything we design.
        </h2>
        <p
          className="mx-auto mt-5 max-w-xl text-base text-[#111111]/60 md:text-lg"
          style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          Twenty-five disciplines, one standard. Tap any card to go deeper.
        </p>
      </div>

      {CATEGORIES.map((cat) => (
        <CategoryBlock key={cat.title} cat={cat} />
      ))}
    </section>
  );
}
