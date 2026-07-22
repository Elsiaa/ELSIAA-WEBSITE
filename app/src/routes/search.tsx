import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";
import { SEARCH_INDEX, type Entry } from "../components/SiteSearch";
import { SiteFooter } from "../components/SiteFooter";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — ELSIAA · AI Done Better" },
      {
        name: "description",
        content: "Search everything ELSIAA — services, divisions, locations, careers.",
      },
    ],
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/search" }],
  }),
  component: SearchPage,
});

const SUGGESTED = [
  "Website design",
  "Branding",
  "Automation",
  "AI agents",
  "Mobile apps",
  "Pricing",
  "Careers",
  "Locations",
  "Consultation",
];

function score(e: Entry, q: string): number {
  const hay = `${e.label} ${e.group} ${e.keys ?? ""}`.toLowerCase();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 0;
  let s = 0;
  for (const t of terms) {
    if (e.label.toLowerCase().startsWith(t)) s += 5;
    else if (e.label.toLowerCase().includes(t)) s += 3;
    else if (hay.includes(t)) s += 1;
    else return 0; // every term must land somewhere
  }
  return s;
}

function SearchPage() {
  const [q, setQ] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
  }, [q]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    return SEARCH_INDEX.map((e) => [score(e, q), e] as const)
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0])
      .map(([, e]) => e);
  }, [q]);

  const related = useMemo(() => {
    if (!results.length) return [];
    const groups = new Set(results.slice(0, 3).map((e) => e.group));
    const shown = new Set(results.map((e) => e.label));
    return SEARCH_INDEX.filter(
      (e) => groups.has(e.group) && !shown.has(e.label)
    ).slice(0, 6);
  }, [results]);

  const grouped = useMemo(() => {
    const m = new Map<string, Entry[]>();
    for (const e of results) {
      m.set(e.group, [...(m.get(e.group) ?? []), e]);
    }
    return [...m.entries()];
  }, [results]);

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-24 md:pt-44">
        <p
          className="text-[10px] tracking-[0.32em] text-[#1e6b3c] uppercase"
          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
        >
          Search
        </p>
        <h1
          className="mt-2 text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          What are you looking for?
        </h1>

        {/* the field */}
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-5 py-4 shadow-[0_18px_44px_-30px_rgba(17,17,17,0.35)] transition-colors focus-within:border-[#1e6b3c]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e6b3c" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Services, divisions, cities, careers…"
            className="w-full bg-transparent text-[17px] outline-none placeholder:text-[#111111]/50"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="text-[#111111]/55 transition-colors hover:text-[#111111]"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
        </div>

        {/* suggested searches */}
        {!q.trim() && (
          <div className="mt-8">
            <p
              className="text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Suggested searches
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTED.map((sug) => (
                <button
                  key={sug}
                  onClick={() => setQ(sug)}
                  className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-[#111111]/70 transition-all duration-200 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* results */}
        {q.trim() && (
          <div className="mt-10">
            {grouped.length === 0 ? (
              <div className="rounded-2xl border border-black/[0.07] bg-white p-8">
                <p className="text-[15px] text-[#111111]/60">
                  Nothing matched "{q}". Try one of these instead:
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {SUGGESTED.slice(0, 5).map((sug) => (
                    <button
                      key={sug}
                      onClick={() => setQ(sug)}
                      className="rounded-full border border-black/12 px-4 py-2 text-[13px] text-[#111111]/70 transition-all hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              grouped.map(([group, entries]) => (
                <div key={group} className="mb-8">
                  <p
                    className="text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {group}
                  </p>
                  <div className="mt-2 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
                    {entries.map((e, i) => (
                      <a
                        key={e.label}
                        href={e.href}
                        className={`group flex items-center justify-between px-5 py-4 transition-colors hover:bg-[#1e6b3c]/[0.04] ${
                          i > 0 ? "border-t border-black/[0.05]" : ""
                        }`}
                      >
                        <span
                          className="text-[15px] font-medium text-[#111111]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {e.label}
                        </span>
                        <span className="text-[#111111]/50 transition-all group-hover:translate-x-0.5 group-hover:text-[#1e6b3c]">
                          →
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* related results */}
            {related.length > 0 && (
              <div className="mt-12 border-t border-black/[0.06] pt-8">
                <p
                  className="text-[10px] tracking-[0.24em] text-[#111111]/55 uppercase"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  Related
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {related.map((e) => (
                    <a
                      key={e.label}
                      href={e.href}
                      className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-[#111111]/70 transition-all duration-200 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {e.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
