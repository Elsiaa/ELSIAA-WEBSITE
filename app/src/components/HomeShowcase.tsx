import { useEffect, useRef } from "react";
import { Reveal } from "./Reveal";

/*
  HomeShowcase — built from Isya's hand-drawn homepage sketch:
  centered statement, three boxes visible as a LIVE LOOPING carousel
  (continuous auto-drift, pauses on touch/hover), CTA beneath.
*/


const BOXES = [
  {
    eyebrow: "Websites",
    title: "Two live sites. One business.",
    desc: "Scroll the original next to the ELSIAA rebuild — feel what design changes.",
    href: "/designs",
    media: (
      <img
        src="/mr-bins/mrbins-shoes-poster.jpg"
        alt="Mr. Bins website rebuilt by ELSIAA"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
    ),
  },
  {
    eyebrow: "Product ads",
    title: "One photo in. One campaign out.",
    desc: "Amateur shots rebuilt as studio-grade compositions — layer by layer.",
    href: "/designs",
    media: (
      <img
        src="/assets/laptop_premium_v1.jpg"
        alt="Premium product ad by ELSIAA"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
    ),
  },
  {
    eyebrow: "Brand identity",
    title: "An identity that survives everything.",
    desc: "The constellation lion — one system across cards, screens, and cities.",
    href: "/services",
    media: (
      <img
        src="/assets/work_identity.jpg"
        alt="ELSIAA constellation lion identity"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
    ),
  },
  {
    eyebrow: "Apps",
    title: "Design your users open daily.",
    desc: "Native-feeling mobile apps — from first tap to App Store shelf.",
    href: "/designs",
    media: (
      <div className="flex h-full w-full items-center justify-center bg-[#F5F5F3]">
        <div className="h-[82%] w-auto overflow-hidden rounded-[16px] border-[3px] border-[#111111] bg-white p-2 shadow-xl" style={{ aspectRatio: "9/18" }}>
          <div className="h-2.5 w-full rounded-sm bg-[#1e6b3c]" />
          <div className="mt-1.5 h-1.5 w-4/5 rounded-sm bg-black/15" />
          <div className="mt-2 h-9 w-full rounded-md bg-[#1e6b3c]/12" />
          <div className="mt-1.5 h-9 w-full rounded-md bg-[#1e6b3c]/25" />
          <div className="mt-2 h-4 w-full rounded-full bg-[#111111]" />
        </div>
      </div>
    ),
  },
  {
    eyebrow: "AI automation",
    title: "Work that runs itself.",
    desc: "Follow-ups, reporting, and client comms handed to systems that never sleep.",
    href: "/services",
    media: (
      <div className="flex h-full w-full items-center justify-center bg-[#070907] p-6">
        <div className="w-full space-y-2.5">
          {[80, 62, 92].map((w, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="h-2 w-2 flex-none rounded-full bg-[#2e9e58]" />
              <div className="h-2 rounded-full bg-white/15" style={{ width: `${w}%` }}>
                <div className="hm-auto h-full rounded-full bg-[#2e9e58]/70" style={{ animationDelay: `${i * 0.5}s` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    eyebrow: "The signature",
    title: "Bad designs, where they belong.",
    desc: "The film that closes our designs page — scrubbed by your scroll.",
    href: "/designs",
    media: (
      <img
        src="/assets/office_premium_v1.jpg"
        alt="The ELSIAA office scene, premium render"
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
    ),
  },
];

export function HomeShowcase() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = rail.scrollLeft;
    const tick = () => {
      if (!paused.current) {
        pos += 0.7;
        const half = rail.scrollWidth / 2;
        if (pos >= half) pos -= half;
        rail.scrollLeft = pos;
      } else {
        pos = rail.scrollLeft;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
 <section className="bg-gradient-to-b from-white to-[#F5F5F3] py-24">
      <style>{`
        @keyframes hmflow { 0% { width: 12% } 55% { width: 100% } 100% { width: 12% } }
        .hm-auto { animation: hmflow 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .hm-auto { animation: none; width: 100% } }
      `}</style>
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <p
            className="text-[13px] text-[#1e6b3c] "
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            ELSIAA · AI Done Better
          </p>
          <h2
            className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.035em] text-balance text-[#111111] md:text-6xl md:leading-[1.04]"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Everything your business shows the world — done right.
          </h2>
          <p
            className="mx-auto mt-5 max-w-xl text-lg text-[#111111]/60 md:text-xl"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Websites, apps, ads, and automation. One standard.
          </p>
        </Reveal>
      </div>

      {/* the live loop — three boxes in view, drifting forever */}
      <div
        ref={railRef}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
        className="mt-14 flex gap-5 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...BOXES, ...BOXES].map((b, i) => (
          <a
            key={`${b.eyebrow}-${i}`}
            href={b.href}
            className="group flex w-[86vw] flex-none flex-col overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_20px_50px_-30px_rgba(17,17,17,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-[#1e6b3c]/30 hover:shadow-[0_30px_70px_-30px_rgba(30,107,60,0.4)] sm:w-[46vw] lg:w-[30.5vw]"
          >
            <div className="aspect-[4/3] overflow-hidden">{b.media}</div>
            <div className="flex flex-1 flex-col p-6 text-left">
              <p
                className="text-[13px] text-[#1e6b3c] "
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {b.eyebrow}
              </p>
              <h3
                className="mt-2 text-[19px] font-semibold tracking-[-0.02em] text-[#111111]"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {b.title}
              </h3>
              <p
                className="mt-1.5 text-[13.5px] leading-relaxed text-[#111111]/60"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {b.desc}
              </p>
              <span
                className="mt-auto pt-4 text-[13px] text-[#111111]/50  transition-colors duration-300 group-hover:text-[#1e6b3c]"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                Explore →
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Reveal>
          <a
            href="/designs"
            className="inline-flex items-center gap-3 rounded-full border border-[#111111] bg-[#111111] px-9 py-3.5 text-[13px] text-white  transition-colors duration-300 hover:border-[#1e6b3c] hover:bg-[#1e6b3c]"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          >
            Discover designs →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
