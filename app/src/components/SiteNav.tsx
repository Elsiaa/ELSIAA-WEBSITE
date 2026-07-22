import { useEffect, useState } from "react";
import { LionWalker } from "./LionWalker";
import { SiteSearch, SEARCH_INDEX } from "./SiteSearch";
import { LangSwitcher } from "./LangSwitcher";

/*
  ELSIAA site nav — fixed, minimal, on a solid white bar.
  Ink text on a white backdrop-blur bar so page content never collides with
  the nav while scrolling; colors invert to white when the menu overlay opens.
  Tabs (hamburger) icon opens a full menu overlay — primary nav on mobile,
  available everywhere.
*/
const LINKS = [
  { label: "Home", href: "/" },
  { label: "Automate", href: "/#automate" },
  { label: "Services", href: "/services" },
  { label: "Designs", href: "/designs" },
  { label: "Contact Us", href: "/contact" },
  { label: "Store", href: "/store" },
  { label: "Locations", href: "/locations" },
  { label: "Get a Quote", href: "/quote" },
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
        className={`pointer-events-none fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
          open
            ? "bg-transparent"
            : `bg-white/95 backdrop-blur-sm ${scrolled ? "border-b border-black/[0.07]" : ""}`
        }`}
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
              <span className={`absolute inset-0 rotate-45 border transition-transform duration-500 group-hover:rotate-[135deg] ${open ? "border-white/80" : "border-[#111111]/80"}`} />
              <span className={`h-[4px] w-[4px] rotate-45 ${open ? "bg-white" : "bg-[#111111]"}`} />
            </span>
            <span className="flex flex-col leading-none">
              <span
                className={`text-[13px] font-semibold tracking-[0.42em] uppercase ${open ? "text-white" : "text-[#111111]"}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                ELSIAA
              </span>
              <span className="mt-[5px] flex items-center gap-2">
                <span className={`h-px w-4 ${open ? "bg-white/40" : "bg-[#111111]/30"}`} />
                <span
                  className={`text-[8px] tracking-[0.34em] whitespace-nowrap uppercase ${open ? "text-white/60" : "text-[#111111]/60"}`}
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  AI Done Better
                </span>
                <span className={`h-px flex-1 ${open ? "bg-white/40" : "bg-[#111111]/30"}`} />
              </span>
            </span>
          </a>
          <nav className="pointer-events-auto flex items-center gap-5 md:gap-7">
            {[
              LINKS.find((x) => x.href === "/#automate")!,
              LINKS.find((x) => x.href === "/services")!,
              LINKS.find((x) => x.href === "/designs")!,
              LINKS.find((x) => x.href === "/locations")!,
              LINKS.find((x) => x.href === "/contact")!,
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`hidden text-[11px] tracking-[0.26em] uppercase transition-opacity hover:opacity-60 md:inline ${open ? "pointer-events-none opacity-0" : "text-[#111111]/80"}`}
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/quote"
              className={`hidden border px-5 py-2 text-[11px] tracking-[0.26em] uppercase transition-all duration-300 md:inline-block ${open ? "pointer-events-none opacity-0" : "border-[#111111]/30 text-[#111111] hover:border-[#111111] hover:bg-[#111111] hover:text-white"}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Get a Quote
            </a>
            {/* language switcher */}
            <div className={`${open ? "pointer-events-none opacity-0" : ""} transition-opacity`}>
              <LangSwitcher />
            </div>
            {/* search icon */}
            <button
              aria-label="Search"
              onClick={() => { window.location.href = "/search"; }}
              className={`flex h-10 w-8 items-center justify-center transition-opacity hover:opacity-60 ${open ? "pointer-events-none opacity-0" : ""}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={open ? "white" : "#111111"} strokeWidth="2" strokeLinecap="round">
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
                className={`absolute h-[1.5px] w-6 transition-all duration-300 ${open ? "bg-white" : "bg-[#111111]"} ${
                  open ? "rotate-45" : "-translate-y-[7px]"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-6 transition-all duration-300 ${open ? "bg-white" : "bg-[#111111]"} ${
                  open ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute h-[1.5px] w-6 transition-all duration-300 ${open ? "bg-white" : "bg-[#111111]"} ${
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
        <div
          className="mx-auto flex h-full max-w-6xl flex-col overflow-y-auto px-8 pt-28 pb-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid flex-1 grid-cols-1 gap-x-20 gap-y-12 md:grid-cols-[1.15fr_1fr]">
            {/* nav column */}
            <nav className="flex flex-col justify-center gap-0.5">
              <p
                className="mb-4 text-[10px] tracking-[0.32em] text-white/50 uppercase"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  opacity: open ? 1 : 0,
                  transition: "opacity .5s ease .05s",
                }}
              >
                Menu
              </p>
              {LINKS.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline gap-4 border-b border-white/[0.06] py-2.5"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "none" : "translateY(18px)",
                    transition: `opacity .5s ease ${0.08 + i * 0.05}s, transform .5s cubic-bezier(.2,.8,.2,1) ${0.08 + i * 0.05}s`,
                  }}
                >
                  <span
                    className="w-6 text-[10px] tracking-[0.3em] text-[#2e9e58]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="text-[22px] font-semibold tracking-[-0.02em] text-white/90 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white md:text-[27px]"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {l.label}
                  </span>
                  <span className="ml-auto text-white/0 transition-colors duration-200 group-hover:text-[#2e9e58]">
                    →
                  </span>
                </a>
              ))}
            </nav>

            {/* utility column */}
            <div
              className="flex flex-col justify-center gap-8"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(18px)",
                transition: "opacity .6s ease .3s, transform .6s cubic-bezier(.2,.8,.2,1) .3s",
              }}
            >
              <MenuSearch onNavigate={() => setOpen(false)} />
              <div className="border-t border-white/[0.08] pt-6">
                <p
                  className="text-[10px] tracking-[0.32em] text-white/50 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Clients
                </p>
                <a
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="group mt-3 flex items-baseline justify-between border-b border-white/[0.06] py-2"
                >
                  <span className="text-[15px] font-medium text-white/85 transition-colors group-hover:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                    New client — start here
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-[#2e9e58] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    The process →
                  </span>
                </a>
                <a
                  href="/portal"
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline justify-between py-2"
                >
                  <span className="text-[15px] font-medium text-white/85 transition-colors group-hover:text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Existing client — Client Portal
                  </span>
                  <span className="text-[10px] tracking-[0.2em] text-[#2e9e58] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    Sign in →
                  </span>
                </a>
              </div>
              <div className="border-t border-white/[0.08] pt-6">
                <p
                  className="text-[10px] tracking-[0.32em] text-white/50 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Direct
                </p>
                <a
                  href="mailto:isya@elsiaa.com"
                  className="mt-3 block text-[17px] font-medium text-white transition-colors hover:text-[#2e9e58]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  isya@elsiaa.com
                </a>
                <a
                  href="/quote"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex w-fit items-center gap-3 border border-white/25 px-6 py-3 text-[11px] tracking-[0.26em] text-white uppercase transition-all duration-300 hover:border-white hover:bg-white hover:text-black"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Get a Quote →
                </a>
              </div>
              <div className="border-t border-white/[0.08] pt-6">
                <p
                  className="text-[10px] tracking-[0.32em] text-white/50 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Offices
                </p>
                <p
                  className="mt-3 text-[13px] leading-relaxed text-white/55"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv
                </p>
              </div>
            </div>
          </div>

          {/* overlay footer */}
          <div
            className="mt-10 flex items-center justify-between border-t border-white/[0.08] pt-5"
            style={{
              opacity: open ? 1 : 0,
              transition: "opacity .5s ease .5s",
            }}
          >
            <p
              className="text-[10px] tracking-[0.2em] text-white/50 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ELSIAA — AI Done Better
            </p>
            <p
              title="With God's help we shall do and succeed."
              className="cursor-help text-[10px] tracking-[0.2em] text-white/50 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              בעזרת ה׳ נעשה ונצליח
            </p>
          </div>
        </div>
      </div>
      <SiteSearch open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function MenuSearch({ onNavigate }: { onNavigate: () => void }) {
  const [q, setQ] = useState("");
  const results = (() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return SEARCH_INDEX.filter((e) =>
      `${e.label} ${e.group} ${e.keys ?? ""}`.toLowerCase().includes(t),
    ).slice(0, 5);
  })();
  return (
    <div>
      <p
        className="text-[10px] tracking-[0.32em] text-white/50 uppercase"
        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
      >
        Search
      </p>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 transition-colors focus-within:border-[#2e9e58]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2e9e58" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.5" y2="16.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onNavigate();
              window.location.href = `/search?q=${encodeURIComponent(q)}`;
            }
          }}
          placeholder="Services, cities, careers…"
          className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-white/50"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
      </div>
      {results.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
          {results.map((e, i) => (
            <a
              key={e.label}
              href={e.href}
              onClick={onNavigate}
              className={`flex items-center justify-between px-4 py-2.5 text-[14px] text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white ${i > 0 ? "border-t border-white/[0.06]" : ""}`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <span>{e.label}</span>
              <span
                className="text-[10px] tracking-[0.2em] text-white/50 uppercase"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {e.group}
              </span>
            </a>
          ))}
        </div>
      )}
      {q.trim() && (
        <a
          href={`/search?q=${encodeURIComponent(q)}`}
          onClick={onNavigate}
          className="mt-2 inline-block text-[11px] tracking-[0.22em] text-[#2e9e58] uppercase hover:underline"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Full search →
        </a>
      )}
    </div>
  );
}
