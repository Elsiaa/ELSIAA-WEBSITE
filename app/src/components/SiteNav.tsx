import { useEffect, useState } from "react";
import { LionWalker } from "./LionWalker";
import { SiteSearch } from "./SiteSearch";

/*
  ELSIAA site nav — fixed, minimal, self-adapting.
  mix-blend-difference + white text renders over light and dark bands alike.
  Tabs (hamburger) icon opens a full menu overlay — primary nav on mobile,
  available everywhere.
*/
const LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "Designs", href: "/designs" },
  { label: "Consultation", href: "/consultation" },
  { label: "Careers", href: "/careers" },
  { label: "Team", href: "/team" },
  { label: "Insights", href: "/insights" },
  { label: "Search", href: "/search" },
  { label: "Client Login", href: "/portal" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <LionWalker />
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
            className="group pointer-events-auto flex items-center gap-3 transition-opacity hover:opacity-80"
            aria-label="ELSIAA — home"
          >
            {/* mark: rotated square node with inner dot */}
            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <span className="absolute inset-0 rotate-45 border border-white/80 transition-transform duration-500 group-hover:rotate-[135deg]" />
              <span className="h-[4px] w-[4px] rotate-45 bg-white" />
            </span>
            <span className="flex flex-col leading-none">
              <span
                className="text-[13px] font-semibold tracking-[0.42em] text-white uppercase"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                ELSIAA
              </span>
              <span className="mt-[5px] flex items-center gap-2">
                <span className="h-px w-4 bg-white/40" />
                <span
                  className="text-[6.5px] tracking-[0.34em] whitespace-nowrap text-white/60 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  AI Done Better
                </span>
                <span className="h-px flex-1 bg-white/40" />
              </span>
            </span>
          </a>
          <nav className="pointer-events-auto flex items-center gap-5 md:gap-7">
            {LINKS.slice(1, 4).map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="hidden text-[11px] tracking-[0.26em] text-white/80 uppercase transition-opacity hover:opacity-60 md:inline"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="mailto:isya@elsiaa.com"
              className="hidden border border-white/40 px-5 py-2 text-[11px] tracking-[0.26em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-black md:inline-block"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Contact
            </a>
            {/* search icon */}
            <button
              aria-label="Search"
              onClick={() => { window.location.href = "/search"; }}
              className="flex h-10 w-8 items-center justify-center transition-opacity hover:opacity-60"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
            </button>
            {/* tabs icon */}
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="group relative flex h-10 w-10 items-center justify-center"
            >
              <span
                className={`absolute h-[1.5px] w-6 bg-white transition-all duration-300 ${
                  open ? "rotate-45" : "-translate-y-[7px]"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-6 bg-white transition-all duration-300 ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-6 bg-white transition-all duration-300 ${
                  open ? "-rotate-45" : "translate-y-[7px]"
                }`}
              />
            </button>
          </nav>
        </div>
      </header>

      {/* menu overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[#0c0c0c] transition-opacity duration-400 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      >
        <nav
          className="mx-auto flex h-full max-w-6xl flex-col justify-center gap-2 px-8"
          onClick={(e) => e.stopPropagation()}
        >
          {LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="group flex items-baseline gap-4 py-2"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(18px)",
                transition: `opacity .5s ease ${0.08 + i * 0.06}s, transform .5s cubic-bezier(.2,.8,.2,1) ${0.08 + i * 0.06}s`,
              }}
            >
              <span
                className="text-[10px] tracking-[0.3em] text-[#2e9e58]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                0{i + 1}
              </span>
              <span
                className="text-4xl font-semibold tracking-[-0.03em] text-white transition-colors group-hover:text-[#2e9e58] md:text-5xl"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {l.label}
              </span>
            </a>
          ))}
          <button
            onClick={() => {
              setOpen(false);
              setSearch(true);
            }}
            className="group mt-6 flex w-fit items-center gap-4 py-2 text-left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2e9e58" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
            <span
              className="text-[13px] tracking-[0.26em] text-white/70 uppercase transition-colors group-hover:text-white"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Search
            </span>
          </button>
          <a
            href="mailto:isya@elsiaa.com"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex w-fit items-center gap-3 border border-white/30 px-7 py-3 text-[11px] tracking-[0.26em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
            style={{
              fontFamily: "'Inter', sans-serif",
              opacity: open ? 1 : 0,
              transition: "opacity .5s ease .4s, border-color .3s, background .3s, color .3s",
            }}
          >
            Contact — isya@elsiaa.com
          </a>
          <p
            className="mt-10 text-[11px] tracking-[0.2em] text-white/30 uppercase"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              opacity: open ? 1 : 0,
              transition: "opacity .5s ease .5s",
            }}
          >
            בעזרת ה׳ נעשה ונצליח
          </p>
        </nav>
      </div>
      <SiteSearch open={search} onClose={() => setSearch(false)} />
    </>
  );
}
