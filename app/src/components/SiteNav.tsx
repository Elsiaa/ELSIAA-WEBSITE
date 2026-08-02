import { useEffect, useState } from "react";
import { LionWalker } from "./LionWalker";
import { SiteSearch, SEARCH_INDEX } from "./SiteSearch";
import { LangSwitcher } from "./LangSwitcher";

/*
  ELSIAA site nav — fixed white bar, ink type.
  Menu overlay: white sheet, black type, search at the very top, quiet
  editorial styling (sentence case, no mono, no numbering), warm gold
  accent, live lion at the bottom.
*/
const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const GOLD = "#b0812a";

const PRIMARY = [
  { label: "Design", href: "/designs" },
  { label: "Automate", href: "/automate" },
  { label: "Contact", href: "/contact" },
  { label: "Sign in", href: "/portal/sign-in" },
];
const MORE = [
  { label: "Why ELSIAA", href: "/why-elsiaa" },
  { label: "Services", href: "/services" },
  { label: "Clients", href: "/clients" },
  { label: "Insights", href: "/insights" },
  { label: "Locations", href: "/locations" },
  { label: "Team", href: "/team" },
  { label: "Careers", href: "/careers" },
  { label: "Store", href: "/store" },
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
      if (e.key === "Escape") setOpen(false);
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
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px] bg-white">
              <img
                src="/assets/elsiaa-lion.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full scale-[1.18] object-cover"
              />
            </span>
            <span
              className="text-[15px] font-semibold text-[#111111]"
              style={{ fontFamily: SANS }}
            >
              ELSIAA
            </span>
          </a>
          <nav className="pointer-events-auto flex items-center gap-5 md:gap-7">
            {PRIMARY.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`hidden text-[13px] font-medium text-[#111111]/75 transition-opacity hover:opacity-60 md:inline ${open ? "pointer-events-none opacity-0" : ""}`}
                style={{ fontFamily: SANS }}
              >
                {l.label}
              </a>
            ))}
            <a
              href="/quote"
              className={`hidden rounded-full border px-5 py-2 text-[13px] font-medium transition-all duration-300 md:inline-block ${open ? "pointer-events-none opacity-0" : "border-[#111111]/25 text-[#111111] hover:border-[#111111] hover:bg-[#111111] hover:text-white"}`}
              style={{ fontFamily: SANS }}
            >
              Get a quote
            </a>
            <div className={`hidden md:block ${open ? "pointer-events-none opacity-0" : ""} transition-opacity`}>
              <LangSwitcher />
            </div>
            <button
              aria-label="Search"
              onClick={() => { window.location.href = "/search"; }}
              className={`hidden h-10 w-8 items-center justify-center transition-opacity hover:opacity-60 md:flex ${open ? "pointer-events-none opacity-0" : ""}`}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.5" y2="16.5" />
              </svg>
            </button>
            <a
              href="/contact"
              className={`inline-flex min-h-[40px] items-center rounded-full bg-[#1e6b3c] px-4 text-[13px] font-semibold text-white md:hidden ${open ? "pointer-events-none opacity-0" : ""}`}
              style={{ fontFamily: SANS }}
            >
              Book a call
            </a>
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="group relative flex h-10 w-10 items-center justify-center"
            >
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "rotate-45" : "-translate-y-[7px]"}`} />
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "-rotate-45" : "translate-y-[7px]"}`} />
            </button>
          </nav>
        </div>
      </header>

      {/* menu overlay — white sheet, ink type */}
      <div
        className={`fixed inset-0 z-40 bg-white transition-opacity duration-400 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      >
        <div
          className="mx-auto flex h-full max-w-6xl flex-col overflow-y-auto px-6 pt-24 pb-8 md:px-8 md:pt-28"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: SANS }}
        >
          {/* search — first thing */}
          <div
            style={{
              opacity: open ? 1 : 0,
              transform: open ? "none" : "translateY(14px)",
              transition: "opacity .45s ease .05s, transform .45s cubic-bezier(.2,.8,.2,1) .05s",
            }}
          >
            <MenuSearch onNavigate={() => setOpen(false)} />
          </div>

          <div className="mt-10 grid flex-1 grid-cols-1 gap-x-20 gap-y-10 md:grid-cols-[1.15fr_1fr]">
            {/* nav column */}
            <nav className="flex flex-col gap-0.5">
              {PRIMARY.map((l, i) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline border-b border-black/[0.08] py-3"
                  style={{
                    opacity: open ? 1 : 0,
                    transform: open ? "none" : "translateY(18px)",
                    transition: `opacity .5s ease ${0.12 + i * 0.05}s, transform .5s cubic-bezier(.2,.8,.2,1) ${0.12 + i * 0.05}s`,
                  }}
                >
                  <span className="text-[26px] font-semibold tracking-[-0.02em] text-[#111111] transition-all duration-200 group-hover:translate-x-1 md:text-[32px]">
                    {l.label}
                  </span>
                  <span className="ml-auto translate-x-1 text-[20px] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" style={{ color: GOLD }}>
                    →
                  </span>
                </a>
              ))}
              <div
                className="mt-6 flex flex-wrap gap-x-7 gap-y-3"
                style={{ opacity: open ? 1 : 0, transition: "opacity .5s ease .4s" }}
              >
                {MORE.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="text-[22px] font-medium tracking-[-0.02em] text-[#111111]/70 transition-colors hover:text-[#1e6b3c] md:text-[24px]"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </nav>

            {/* utility column */}
            <div
              className="flex flex-col gap-7"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? "none" : "translateY(18px)",
                transition: "opacity .6s ease .3s, transform .6s cubic-bezier(.2,.8,.2,1) .3s",
              }}
            >
              <div className="border-t border-black/[0.08] pt-5">
                <p className="text-[13px] font-medium text-[#111111]/45">Clients</p>
                <a
                  href="/clients"
                  onClick={() => setOpen(false)}
                  className="group mt-3 flex items-baseline justify-between border-b border-black/[0.06] py-2"
                >
                  <span className="text-[15px] font-medium text-[#111111]/85 transition-colors group-hover:text-[#111111]">
                    New client — start here
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: GOLD }}>The process →</span>
                </a>
                <a
                  href="/portal/sign-in"
                  onClick={() => setOpen(false)}
                  className="group flex items-baseline justify-between py-2"
                >
                  <span className="text-[15px] font-medium text-[#111111]/85 transition-colors group-hover:text-[#111111]">
                    Existing client — Sign in
                  </span>
                  <span className="text-[13px] font-medium" style={{ color: GOLD }}>Sign in →</span>
                </a>
              </div>
              <div className="border-t border-black/[0.08] pt-5">
                <p className="text-[13px] font-medium text-[#111111]/45">Direct</p>
                <a
                  href="mailto:info@elsiaa.com"
                  className="mt-3 block text-[17px] font-medium text-[#111111] transition-colors"
                  style={{ ["--gold" as string]: GOLD }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#111111")}
                >
                  info@elsiaa.com
                </a>
                <a
                  href="/quote"
                  onClick={() => setOpen(false)}
                  className="mt-4 inline-flex w-fit items-center gap-3 rounded-full bg-[#111111] px-6 py-3 text-[13px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_-18px_rgba(0,0,0,0.55)]"
                >
                  Get a quote →
                </a>
              </div>
              <div className="border-t border-black/[0.08] pt-5">
                <p className="text-[13px] font-medium text-[#111111]/45">Offices</p>
                <p className="mt-3 text-[13px] leading-relaxed text-[#111111]/60">
                  New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv
                </p>
              </div>
            </div>
          </div>

          {/* the ELSIAA lion — forged in wire, a signature plate */}
          <div
            className="mt-8 flex justify-center"
            style={{ opacity: open ? 1 : 0, transition: "opacity .7s ease .45s" }}
          >
            <video
              src="/assets/lion_walk_v1.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="pointer-events-none h-40 w-auto object-contain mix-blend-multiply md:h-48"
              aria-label="The ELSIAA lion, alive"
            />
          </div>

          {/* overlay footer */}
          <div
            className="mt-4 flex items-center justify-between border-t border-black/[0.08] pt-4"
            style={{ opacity: open ? 1 : 0, transition: "opacity .5s ease .5s" }}
          >
            <p className="text-[13px] text-[#111111]/50">Elsiaa</p>
            <p
              title="With God's help we shall do and succeed."
              className="cursor-help text-[13px] text-[#111111]/50"
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
      <div className="flex items-center gap-3 rounded-2xl border border-black/[0.12] bg-black/[0.03] px-5 py-4 transition-all duration-200 focus-within:border-[#b0812a] focus-within:bg-white focus-within:shadow-[0_18px_50px_-34px_rgba(176,129,42,0.5)]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b0812a" strokeWidth="2" strokeLinecap="round">
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
          placeholder="Search services, cities, careers…"
          className="w-full bg-transparent text-[16px] text-[#111111] outline-none placeholder:text-[#111111]/40"
        />
      </div>
      {results.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-sm">
          {results.map((e, i) => (
            <a
              key={e.label}
              href={e.href}
              onClick={onNavigate}
              className={`flex items-center justify-between px-5 py-3 text-[14px] text-[#111111]/80 transition-colors hover:bg-black/[0.03] hover:text-[#111111] ${i > 0 ? "border-t border-black/[0.05]" : ""}`}
            >
              <span>{e.label}</span>
              <span className="text-[13px] text-[#111111]/40">{e.group}</span>
            </a>
          ))}
        </div>
      )}
      {q.trim() && (
        <a
          href={`/search?q=${encodeURIComponent(q)}`}
          onClick={onNavigate}
          className="mt-2 inline-block text-[13px] font-medium hover:underline"
          style={{ color: "#b0812a" }}
        >
          Full search →
        </a>
      )}
    </div>
  );
}
