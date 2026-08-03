import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LionWalker } from "./LionWalker";
import { SiteSearch } from "./SiteSearch";
import { search as runSearch } from "../lib/search-engine";
import { LangSwitcher } from "./LangSwitcher";

/*
  ELSIAA site nav — fixed white bar, ink type.
  Menu overlay: a directory rather than a list — three grouped columns of
  destinations, a dark action rail carrying the two CTAs and the direct
  contacts, and the live lion walking the footer rule.
*/
const SANS =
  "var(--font-sans)";
const GOLD = "#b0812a";
const OFFICES = "New York · Los Angeles · London · Geneva · Antwerp · Tel Aviv";

/* the top bar keeps its short list; the overlay carries the full directory */
const PRIMARY = [
  { label: "Design", href: "/designs" },
  { label: "Automate", href: "/automate" },
  { label: "Contact", href: "/contact" },
  { label: "Sign in", href: "/portal/sign-in" },
];

const GROUPS: Array<{ title: string; items: Array<{ label: string; href: string }> }> = [
  {
    title: "What we build",
    items: [
      { label: "Deals", href: "/deals" },
      { label: "Design", href: "/designs" },
      { label: "Automate", href: "/automate" },
      { label: "Services", href: "/services" },
      { label: "Voice intake", href: "/intake" },
      { label: "Store", href: "/store" },
    ],
  },
  {
    title: "The company",
    items: [
      { label: "Why ELSIAA", href: "/why-elsiaa" },
      { label: "Team", href: "/team" },
      { label: "Locations", href: "/locations" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "The work",
    items: [
      { label: "Clients", href: "/clients" },
      { label: "Insights", href: "/insights" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/* secondary destinations inside the dark rail */
const RAIL = [
  { label: "Client sign in", href: "/portal/sign-in" },
  { label: "New client — the process", href: "/clients" },
  { label: "Full search", href: "/search" },
];

/** staggered entrance for the overlay's blocks */
function fade(open: boolean, delay: number): CSSProperties {
  return {
    opacity: open ? 1 : 0,
    transform: open ? "none" : "translateY(16px)",
    transition: `opacity .5s ease ${delay}s, transform .5s cubic-bezier(.2,.8,.2,1) ${delay}s`,
  };
}

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

  /* focus moves into the sheet on open and returns to the trigger on close,
     so the menu is usable from the keyboard rather than merely reachable */
  const sheetRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      sheetRef.current?.querySelector<HTMLElement>("input, a, button")?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [open]);
  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

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
                src="/assets/elsiaa-lion-192.png"
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
              ref={triggerRef}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => (open ? closeMenu() : setOpen(true))}
              className="group relative flex h-10 w-10 items-center justify-center"
            >
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "rotate-45" : "-translate-y-[7px]"}`} />
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "opacity-0" : "opacity-100"}`} />
              <span className={`absolute h-[1.5px] w-6 bg-[#111111] transition-all duration-300 ${open ? "-rotate-45" : "translate-y-[7px]"}`} />
            </button>
          </nav>
        </div>
      </header>

      {/* menu overlay — the directory: grouped index, action rail, lion band */}
      <div
        className={`fixed inset-0 z-[45] bg-white transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        // audit fix: without these the 18 controls below stay tabbable and
        // screen-reader-visible while the menu is shut
        {...(open ? {} : { inert: true, "aria-hidden": true })}
      >
        <div
          ref={sheetRef}
          className="mx-auto flex h-full max-w-6xl flex-col overflow-y-auto px-6 pt-24 pb-6 md:px-8 md:pt-28"
          onClick={(e) => e.stopPropagation()}
          style={{ fontFamily: SANS }}
        >
          {/* search — first thing, with the language control beside it so the
              switcher is reachable without scrolling the sheet on a phone */}
          <div style={fade(open, 0.04)}>
            <MenuSearch onNavigate={() => setOpen(false)} />
            <div className="mt-3 flex items-center gap-3 md:hidden">
              <span className="text-[13px] text-[#111111]/45">Language</span>
              <LangSwitcher />
            </div>
          </div>

          {/* the directory */}
          <div className="mt-11 grid flex-1 grid-cols-1 items-start gap-x-10 gap-y-11 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,19rem)]">
            {GROUPS.map((g, gi) => (
              <nav key={g.title} aria-label={g.title} style={fade(open, 0.1 + gi * 0.05)}>
                <p className="text-[11px] font-semibold tracking-[0.13em] uppercase" style={{ color: GOLD }}>
                  {g.title}
                </p>
                <ul className="mt-4 flex flex-col">
                  {g.items.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className="group flex min-h-[44px] items-center justify-between border-b border-black/[0.07] py-1"
                      >
                        <span className="text-[19px] font-medium tracking-[-0.02em] text-[#111111] transition-transform duration-200 group-hover:translate-x-1 md:text-[21px]">
                          {l.label}
                        </span>
                        <span
                          aria-hidden
                          className="translate-x-1 text-[15px] opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                          style={{ color: GOLD }}
                        >
                          →
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}

            {/* action rail */}
            <div
              className="rounded-2xl bg-[#0f110f] p-6 text-white sm:col-span-2 lg:col-span-1"
              style={fade(open, 0.26)}
            >
              <p className="text-[11px] font-semibold tracking-[0.13em] text-white/45 uppercase">
                Start here
              </p>
              <a
                href="/quote"
                onClick={() => setOpen(false)}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-6 text-[14px] font-semibold text-[#111111] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#f0d9a4]"
              >
                Get a quote →
              </a>
              <a
                href="/consultation"
                onClick={() => setOpen(false)}
                className="mt-2.5 flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/25 px-6 text-[14px] font-semibold text-white transition-colors duration-300 hover:border-white hover:bg-white/10"
              >
                Book a free call
              </a>

              <div className="mt-6 space-y-1 border-t border-white/12 pt-5">
                {RAIL.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[40px] items-center justify-between text-[14px] text-white/70 transition-colors hover:text-white"
                  >
                    {l.label}
                    <span aria-hidden style={{ color: GOLD }}>→</span>
                  </a>
                ))}
              </div>

              <div className="mt-5 border-t border-white/12 pt-5">
                <p className="text-[11px] font-semibold tracking-[0.13em] text-white/45 uppercase">
                  Direct
                </p>
                <a
                  href="mailto:info@elsiaa.com"
                  className="mt-2 block min-h-[40px] text-[15px] font-medium text-white transition-colors hover:text-[#f0d9a4]"
                >
                  info@elsiaa.com
                </a>
              </div>

            </div>
          </div>

          {/* lion band — the signature, walking the footer rule */}
          <div className="mt-10 border-t border-black/[0.08] pt-2" style={fade(open, 0.34)}>
            <div className="flex items-end justify-center">
              <video
                src="/assets/lion_walk_v1.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="pointer-events-none h-28 w-auto object-contain mix-blend-multiply md:h-32"
                aria-label="The ELSIAA lion, alive"
              />
            </div>
            <div className="flex flex-col items-center gap-2 border-t border-black/[0.08] pt-4 text-center sm:flex-row sm:justify-between sm:text-left">
              <p className="text-[12.5px] text-[#111111]/60">{OFFICES}</p>
              <p lang="he" dir="rtl" className="text-[12.5px] text-[#111111]/60">
                בעזרת ה׳ נעשה ונצליח
              </p>
            </div>
          </div>
        </div>
      </div>
      <SiteSearch open={search} onClose={() => setSearch(false)} />
    </>
  );
}

function MenuSearch({ onNavigate }: { onNavigate: () => void }) {
  const [q, setQ] = useState("");
  const { results, didYouMean } = (() => {
    if (!q.trim()) return { results: [], didYouMean: null as string | null };
    const r = runSearch(q, 5);
    return { results: r.hits.map((h) => h.entry), didYouMean: r.didYouMean };
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
      {didYouMean && (
        <button
          onClick={() => setQ(didYouMean)}
          className="mt-2 block text-[13px] text-[#111111]/60 hover:underline"
        >
          Did you mean <span className="font-semibold" style={{ color: GOLD }}>{didYouMean}</span>?
        </button>
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
