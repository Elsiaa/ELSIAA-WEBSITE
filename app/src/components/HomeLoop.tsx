import { useEffect, useRef } from "react";

/*
  Home three-box live loop — a continuously flowing carousel of ELSIAA's
  three doors (Websites / Apps & Software / AI Automation), cycling through
  six cards so the loop never repeats back-to-back. Pauses on touch/hover.
*/

const CARDS = [
  {
    k: "Websites",
    d: "Live sites that win the three-second test.",
    img: "/assets/work_ad.jpg",
    href: "/designs",
    cta: "Discover designs",
  },
  {
    k: "Apps & Software",
    d: "Products your customers keep on their home screen.",
    img: "/assets/work_illustration.jpg",
    href: "/services",
    cta: "See services",
  },
  {
    k: "AI Automation",
    d: "Workflows that run while you sleep.",
    img: "/assets/work_lion.jpg",
    href: "/services",
    cta: "See services",
  },
  {
    k: "Product Ads",
    d: "One amateur photo in. One campaign out.",
    img: "/assets/laptop_premium_v1.jpg",
    href: "/designs",
    cta: "Discover designs",
  },
  {
    k: "Brand Identity",
    d: "A lion of a brand, built constellation by constellation.",
    img: "/assets/work_identity.jpg",
    href: "/designs",
    cta: "Discover designs",
  },
  {
    k: "Healthcare Brands",
    d: "Our specialty — clinical trust, rebuilt.",
    img: "/assets/office_premium_v1.jpg",
    href: "/designs",
    cta: "Discover designs",
  },
];

export function HomeLoop() {
  const railRef = useRef<HTMLDivElement | null>(null);
  const paused = useRef(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let pos = rail.scrollLeft;
    rail.addEventListener("scroll", () => {
      if (Math.abs(rail.scrollLeft - pos) > 2) pos = rail.scrollLeft;
    });
    const tick = () => {
      if (!paused.current) {
        pos += 0.9;
        const half = rail.scrollWidth / 2;
        if (pos >= half) pos -= half;
        rail.scrollLeft = pos;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className="bg-gradient-to-b from-white to-[#F5F5F3] py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p
          className="text-[13px] text-[#1e6b3c] "
          style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          What we build
        </p>
        <h2
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.035em] text-[#111111] md:text-5xl"
          style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          Three doors. One standard.
        </h2>
      </div>

      <div
        ref={railRef}
        onPointerEnter={() => (paused.current = true)}
        onPointerLeave={() => (paused.current = false)}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => (paused.current = false)}
        className="mt-10 flex gap-5 overflow-x-auto px-6 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {[...CARDS, ...CARDS].map((c, i) => (
          <a
            key={`${c.k}-${i}`}
            href={c.href}
            className="group relative w-[86vw] flex-none overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-[0_24px_60px_-36px_rgba(17,17,17,0.4)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_34px_80px_-36px_rgba(30,107,60,0.45)] sm:w-[420px]"
          >
            <div className="aspect-[4/3] overflow-hidden bg-[#F0F0EE]">
              <img
                src={c.img}
                alt={c.k}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            </div>
            <div className="flex items-start justify-between gap-4 p-6">
              <div>
                <h3
                  className="text-xl font-semibold tracking-[-0.02em] text-[#111111]"
                  style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {c.k}
                </h3>
                <p
                  className="mt-1.5 text-[14px] leading-relaxed text-[#111111]/60"
                  style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
                >
                  {c.d}
                </p>
              </div>
              <span
                className="mt-1 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-black/15 text-[#111111] transition-all duration-300 group-hover:border-[#1e6b3c] group-hover:bg-[#1e6b3c] group-hover:text-white"
                aria-hidden
              >
                →
              </span>
            </div>
            <span
              className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1 text-[13px] font-bold text-[#111111]  backdrop-blur"
              style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
            >
              ELSIAA
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
