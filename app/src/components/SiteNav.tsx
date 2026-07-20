import { useEffect, useState } from "react";

/*
  ELSIAA site nav — fixed, minimal, self-adapting.
  mix-blend-difference + white text renders correctly over both the white
  story sections and the near-black hero/closing bands, with zero JS
  section-tracking.
*/
export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mix-blend-difference"
      aria-label="Site"
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-500 ${
          scrolled ? "py-4" : "py-6"
        }`}
      >
        <a
          href="/"
          className="pointer-events-auto text-[13px] font-semibold tracking-[0.42em] text-white uppercase transition-opacity hover:opacity-70"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          ELSIAA
        </a>
        <nav className="pointer-events-auto flex items-center gap-7">
          <a
            href="/services"
            className="hidden text-[11px] tracking-[0.26em] text-white/80 uppercase transition-opacity hover:opacity-60 md:inline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Services
          </a>
          <a
            href="/designs"
            className="hidden text-[11px] tracking-[0.26em] text-white/80 uppercase transition-opacity hover:opacity-60 md:inline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Designs
          </a>
          <a
            href="/careers"
            className="hidden text-[11px] tracking-[0.26em] text-white/80 uppercase transition-opacity hover:opacity-60 md:inline"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Careers
          </a>
          <a
            href="mailto:isya@elsiaa.com"
            className="border border-white/40 px-5 py-2 text-[11px] tracking-[0.26em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
