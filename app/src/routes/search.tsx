import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { search as runSearch, type Entry } from "../lib/search-engine";
import { absoluteUrl } from "../lib/site-url";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — ELSIAA · AI Done Better" },
      {
        name: "description",
        content:
          "Search everything ELSIAA builds — custom software, AI systems, case studies, the build process, locations and careers.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/search") }],
  }),
  component: SearchPage,
});

const SANS =
  "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const MONO = SANS;


// Discovery — suggested deep paths, trending, and areas.
const SUGGESTED = [
  "Custom AI systems",
  "Implementation process",
  "Fixed-scope builds",
  "Intake OS",
  "Dispatch OS",
  "AI agents",
  "Case studies",
  "Book a strategy call",
];
const TRENDING = ["Custom software", "AI implementation", "Automate", "Locations", "Careers"];
const AREAS: Array<{ label: string; href: string; note: string }> = [
  { label: "Custom software", href: "/automate", note: "Systems built for your operations" },
  { label: "AI implementation", href: "/automate", note: "AI embedded where it earns its place" },
  { label: "Case studies", href: "/automate", note: "Real systems, running in production" },
  { label: "Design", href: "/designs", note: "Brands and interfaces we've shipped" },
  { label: "Locations", href: "/locations", note: "On the ground in six cities" },
  { label: "Get started", href: "/contact", note: "Strategy call or fixed-scope quote" },
];

function highlight(text: string, terms: string[]) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  const parts = text.split(re);
  return parts.map((p, i) =>
    terms.some((t) => p.toLowerCase() === t.toLowerCase()) ? (
      <mark key={i} className="rounded bg-[#1e6b3c]/12 px-0.5 text-[#1e6b3c]">{p}</mark>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function Chip({ label, onClick, href, small }: { label: string; onClick?: () => void; href?: string; small?: boolean }) {
  const cls = `inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white ${small ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13px]"} text-[#111111]/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1e6b3c] hover:text-[#1e6b3c]`;
  if (href) return <a href={href} className={cls} style={{ fontFamily: SANS }}>{label}</a>;
  return <button onClick={onClick} className={cls} style={{ fontFamily: SANS }}>{label}</button>;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-black/[0.1] bg-white px-1.5 text-[11px] font-medium text-[#111111]/55" style={{ fontFamily: MONO }}>
      {children}
    </kbd>
  );
}

function SearchPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingT = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const initial = new URLSearchParams(window.location.search).get("q");
      if (initial) setQ(initial);
    }
    inputRef.current?.focus();
    // ⌘K / Ctrl-K to focus
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (q.trim()) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
    // brief "typing/loading" shimmer for perceived intelligence
    setTyping(true);
    clearTimeout(typingT.current);
    typingT.current = window.setTimeout(() => setTyping(false), 180);
  }, [q]);

  const terms = useMemo(() => q.toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const { results, didYouMean } = useMemo(() => {
    if (!terms.length) return { results: [] as Entry[], didYouMean: null as string | null };
    const r = runSearch(q, 40);
    return { results: r.hits.map((h) => h.entry), didYouMean: r.didYouMean };
  }, [terms, q]);

  useEffect(() => setActive(0), [q]);

  // "People also search for" — categories present in the results, minus the query.
  const related = useMemo(() => {
    const cats = Array.from(new Set(results.map((r) => r.group)));
    const extra = SUGGESTED.filter((s) => !s.toLowerCase().includes(q.trim().toLowerCase()));
    return [...cats, ...extra].slice(0, 6);
  }, [results, q]);

  const go = (href: string) => { if (typeof window !== "undefined") window.location.href = href; };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") { setQ(""); return; }
    if (!results.length) return;
    if (e.key === "Enter") { e.preventDefault(); go(results[Math.min(active, results.length - 1)].href); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
  };

  const hasQuery = q.trim().length > 0;

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />

      {/* ambient warmth */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden" aria-hidden>
        <div className="absolute left-1/2 top-[-30%] h-[420px] w-[820px] -translate-x-1/2 rounded-full blur-[130px]" style={{ background: "radial-gradient(circle, rgba(30,107,60,0.07), transparent 66%)" }} />
      </div>

      <section className="relative mx-auto max-w-3xl px-6 pt-36 pb-28 md:pt-44">
        <p className="text-[13px] tracking-[0.06em] text-[#1e6b3c]" style={{ fontFamily: MONO }}>Search</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] md:text-[3.25rem] md:leading-[1.02]" style={{ fontFamily: SANS }}>
          Find anything ELSIAA builds.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
          A deep search across every system, case study, process, service, and location — the same precision we bring to the software we build.
        </p>

        {/* command bar */}
        <div className="group mt-8 flex items-center gap-3 rounded-2xl border border-black/[0.1] bg-white px-5 py-4 shadow-[0_20px_60px_-40px_rgba(17,17,17,0.5)] transition-all duration-200 focus-within:border-[#1e6b3c] focus-within:shadow-[0_24px_70px_-38px_rgba(30,107,60,0.4)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search custom systems, case studies, cities, careers…"
            aria-label="Search the site"
            className="w-full bg-transparent text-[17px] outline-none placeholder:text-[#111111]/40"
            style={{ fontFamily: SANS }}
          />
          {hasQuery ? (
            <button onClick={() => { setQ(""); inputRef.current?.focus(); }} className="shrink-0 rounded-md px-2 py-1 text-[13px] text-[#111111]/50 transition-colors hover:text-[#111111]" style={{ fontFamily: MONO }} aria-label="Clear search">Clear</button>
          ) : (
            <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
          )}
        </div>

        {/* keyboard hint + status */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-[#111111]/45" style={{ fontFamily: MONO }}>
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1.5"><Kbd>⏎</Kbd> open</span>
          <span className="flex items-center gap-1.5"><Kbd>esc</Kbd> clear</span>
          {hasQuery && (
            <span className="ml-auto text-[#111111]/50">
              {typing ? "Searching…" : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </span>
          )}
        </div>

        {/* ---------- empty / discovery state ---------- */}
        {!hasQuery && (
          <div className="mt-9 space-y-10">
            <div>
              <p className="text-[13px] text-[#111111]/55" style={{ fontFamily: MONO }}>Suggested deep paths</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTED.map((label) => (
                  <Chip key={label} label={label} onClick={() => { setQ(label); inputRef.current?.focus(); }} />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[13px] text-[#111111]/55" style={{ fontFamily: MONO }}>Explore by area</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AREAS.map((a) => (
                  <a key={a.label} href={a.href} className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white px-5 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1e6b3c]/40 hover:shadow-[0_24px_60px_-48px_rgba(17,17,17,0.4)]">
                    <span>
                      <span className="block text-[15px] font-semibold tracking-[-0.01em] text-[#111111]" style={{ fontFamily: SANS }}>{a.label}</span>
                      <span className="mt-0.5 block text-[13px] text-[#111111]/50" style={{ fontFamily: SANS }}>{a.note}</span>
                    </span>
                    <span className="text-[#111111]/30 transition-all group-hover:translate-x-0.5 group-hover:text-[#1e6b3c]" aria-hidden>→</span>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[13px] text-[#111111]/55" style={{ fontFamily: MONO }}>Trending</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {TRENDING.map((label) => (
                  <Chip key={label} small label={label} onClick={() => { setQ(label); inputRef.current?.focus(); }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------- results state ---------- */}
        {hasQuery && (
          <div className="mt-8" style={{ opacity: typing ? 0.55 : 1, transition: "opacity 0.2s ease" }}>
            {results.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.08] bg-white p-8 text-center">
                <p className="text-[17px] font-semibold tracking-[-0.02em] text-[#111111]" style={{ fontFamily: SANS }}>
                  No direct match for "{q.trim()}".
                </p>
                {didYouMean && (
                  <button
                    onClick={() => { setQ(didYouMean); inputRef.current?.focus(); }}
                    className="mt-3 text-[15px] font-semibold text-[#1e6b3c] hover:underline"
                    style={{ fontFamily: SANS }}
                  >
                    Did you mean "{didYouMean}"?
                  </button>
                )}
                <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
                  Tell us what you're trying to build and we'll point you to the right system — or scope it from scratch.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {SUGGESTED.slice(0, 5).map((label) => (
                    <Chip key={label} small label={label} onClick={() => { setQ(label); inputRef.current?.focus(); }} />
                  ))}
                </div>
                <a href="/contact" className="mt-6 inline-block rounded-full bg-[#1e6b3c] px-6 py-3 text-[13px] font-bold text-white transition-all hover:bg-[#111111]" style={{ fontFamily: MONO }}>
                  Book a strategy call →
                </a>
              </div>
            ) : (
              <>
                {didYouMean && (
                  <p className="mb-3 text-[14px] text-[#111111]/60" style={{ fontFamily: SANS }}>
                    Showing results for{" "}
                    <button
                      onClick={() => { setQ(didYouMean); inputRef.current?.focus(); }}
                      className="font-semibold text-[#1e6b3c] hover:underline"
                    >
                      {didYouMean}
                    </button>
                  </p>
                )}
                <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_30px_80px_-60px_rgba(17,17,17,0.4)]">
                  {results.map((item, i) => (
                    <a
                      key={`${item.label}-${item.href}-${i}`}
                      href={item.href}
                      onMouseEnter={() => setActive(i)}
                      className={`group block px-5 py-4 transition-colors ${i > 0 ? "border-t border-black/[0.06]" : ""} ${active === i ? "bg-[#1e6b3c]/[0.05]" : "hover:bg-[#1e6b3c]/[0.04]"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center rounded-full bg-[#1e6b3c]/[0.08] px-2.5 py-0.5 text-[11.5px] font-medium tracking-[0.02em] text-[#1e6b3c]" style={{ fontFamily: MONO }}>
                          {item.group}
                        </span>
                        <span className="shrink-0 text-[12px] tracking-[0.1em] text-[#111111]/30" style={{ fontFamily: MONO }}>{item.href}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <span className="text-[17px] font-semibold tracking-[-0.015em] text-[#111111]" style={{ fontFamily: SANS }}>
                          {highlight(item.label, terms)}
                        </span>
                        <span className={`shrink-0 transition-all ${active === i ? "translate-x-0.5 text-[#1e6b3c]" : "text-[#111111]/30 group-hover:translate-x-0.5 group-hover:text-[#1e6b3c]"}`} aria-hidden>→</span>
                      </div>
                      {item.desc && (
                        <p className="mt-1.5 text-[14px] leading-relaxed text-[#111111]/60" style={{ fontFamily: SANS }}>
                          {highlight(item.desc, terms)}
                        </p>
                      )}
                    </a>
                  ))}
                </div>

                {/* people also search for */}
                {related.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[13px] text-[#111111]/55" style={{ fontFamily: MONO }}>People also search for</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {related.map((label) => (
                        <Chip key={label} small label={label} onClick={() => { setQ(label); inputRef.current?.focus(); }} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
