import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

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
    links: [{ rel: "canonical", href: "https://elsiaa.higgsfield.app/search" }],
  }),
  component: SearchPage,
});

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const MONO = SANS;

type Item = {
  title: string;
  href: string;
  category: string;
  keywords: string;
  snippet: string;
};

// A real, hand-built index of the site's key pages and sub-topics.
const INDEX: Item[] = [
  { title: "Home", href: "/", category: "Overview", keywords: "elsiaa start overview ai done better home custom software", snippet: "ELSIAA builds custom software that puts AI to work inside your business." },
  { title: "Automate", href: "/automate", category: "Custom software", keywords: "automate custom software ai implementation systems build agents workflow", snippet: "Custom software and AI systems, designed, built, and implemented for how you actually operate." },
  { title: "Custom AI Intake + Scheduling System", href: "/intake", category: "Case study", keywords: "intake scheduling healthcare clinic voice line triage routing booking playable custom", snippet: "A phone line and web intake that understand a patient, match the right specialist, and book it. Built from scratch, running in production." },
  { title: "Custom Dispatch & Field Service OS", href: "/automate", category: "Case study", keywords: "dispatch field service os routing logistics operations fleet control tower custom", snippet: "One board that takes the job, routes the nearest tech, sends the ETA, and reconciles the ticket." },
  { title: "Custom Sales + CRM Automation Layer", href: "/automate", category: "Case study", keywords: "sales crm automation pipeline leads enrichment routing follow-up custom revenue", snippet: "Every lead captured, enriched, and routed the moment it lands — nothing worked twice or dropped." },
  { title: "Custom Finance Reconciliation Engine", href: "/automate", category: "Case study", keywords: "finance reconciliation invoices payments matching close back office custom", snippet: "Invoices and payments matched automatically; the month-end close measured in hours, not a week." },
  { title: "The build process", href: "/automate", category: "How we work", keywords: "process build map design custom system implement prove hand over insured method", snippet: "Six steps: map the real work, design the custom system, build live, embed AI, prove results, hand it over running." },
  { title: "Design", href: "/designs", category: "Design", keywords: "design branding websites interfaces portfolio work visual identity", snippet: "Websites, brands, and interfaces — the design division and selected work." },
  { title: "Services", href: "/services", category: "Services", keywords: "services offerings capabilities web branding apps development automation", snippet: "The full menu — from the first wireframe to the cloud it runs on." },
  { title: "Fixed-scope quote", href: "/quote", category: "Get started", keywords: "quote fixed scope pricing estimate cost budget proposal", snippet: "Tell us the scope; get a tailored, fixed-scope estimate back." },
  { title: "Book a strategy call", href: "/contact", category: "Get started", keywords: "contact book strategy call email reach talk consultation discovery", snippet: "Show us one process — we'll design and build the system that replaces it." },
  { title: "Consultation", href: "/consultation", category: "Get started", keywords: "consultation call strategy advice discovery book meeting", snippet: "Book a working session to map the right build for you." },
  { title: "Clients", href: "/clients", category: "Clients", keywords: "clients new existing onboarding start here insured fully owned", snippet: "How we engage — fully insured builds, fully owned by the client." },
  { title: "Client Portal", href: "/portal", category: "Clients", keywords: "portal login client sign in account dashboard existing", snippet: "Existing clients — sign in to your project workspace." },
  { title: "Insights", href: "/insights", category: "Insights", keywords: "insights blog articles writing ideas research thinking ai", snippet: "Notes on custom software, AI implementation, and design from the ELSIAA team." },
  { title: "Locations", href: "/locations", category: "Locations", keywords: "locations offices cities global where world on the ground insured anywhere", snippet: "People on the ground in six cities — and able to deploy anywhere in the world." },
  { title: "New York", href: "/locations", category: "Locations", keywords: "new york nyc usa america on the ground", snippet: "On-site team in New York, by appointment." },
  { title: "Los Angeles", href: "/locations", category: "Locations", keywords: "los angeles la california usa west coast", snippet: "On-site team in Los Angeles, by appointment." },
  { title: "London", href: "/locations", category: "Locations", keywords: "london uk england europe", snippet: "On-site team in London, by appointment." },
  { title: "Geneva", href: "/locations", category: "Locations", keywords: "geneva switzerland europe swiss", snippet: "On-site team in Geneva, by appointment." },
  { title: "Antwerp", href: "/locations", category: "Locations", keywords: "antwerp belgium benelux europe", snippet: "On-site team in Antwerp, by appointment." },
  { title: "Tel Aviv", href: "/locations", category: "Locations", keywords: "tel aviv israel middle east engineering", snippet: "On-site team in Tel Aviv, by appointment." },
  { title: "Team", href: "/team", category: "Company", keywords: "team people about who we are staff leadership", snippet: "The people who design, build, and implement the work." },
  { title: "Careers", href: "/careers", category: "Company", keywords: "careers jobs hiring roles openings work with us apply", snippet: "Open roles and what it's like to build here." },
  { title: "Store", href: "/store", category: "Store", keywords: "store shop products templates buy purchase", snippet: "Ready-made templates and products from the studio." },
];

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

function score(item: Item, terms: string[]): number {
  const title = item.title.toLowerCase();
  const keys = item.keywords.toLowerCase();
  const snip = item.snippet.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (title === t) s += 12;
    else if (title.startsWith(t)) s += 8;
    else if (title.includes(t)) s += 6;
    else if (keys.includes(t)) s += 3;
    else if (snip.includes(t)) s += 1;
    else return 0; // every term must land somewhere
  }
  return s;
}

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
  const results = useMemo(() => {
    if (!terms.length) return [];
    return INDEX.map((item) => [score(item, terms), item] as const)
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0])
      .map(([, item]) => item);
  }, [terms]);

  useEffect(() => setActive(0), [q]);

  // "People also search for" — categories present in the results, minus the query.
  const related = useMemo(() => {
    const cats = Array.from(new Set(results.map((r) => r.category)));
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
          <div className="mt-12 space-y-10">
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
                <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-[0_30px_80px_-60px_rgba(17,17,17,0.4)]">
                  {results.map((item, i) => (
                    <a
                      key={`${item.title}-${item.href}-${i}`}
                      href={item.href}
                      onMouseEnter={() => setActive(i)}
                      className={`group block px-5 py-4 transition-colors ${i > 0 ? "border-t border-black/[0.06]" : ""} ${active === i ? "bg-[#1e6b3c]/[0.05]" : "hover:bg-[#1e6b3c]/[0.04]"}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex items-center rounded-full bg-[#1e6b3c]/[0.08] px-2.5 py-0.5 text-[11.5px] font-medium tracking-[0.02em] text-[#1e6b3c]" style={{ fontFamily: MONO }}>
                          {item.category}
                        </span>
                        <span className="shrink-0 text-[12px] tracking-[0.1em] text-[#111111]/30" style={{ fontFamily: MONO }}>{item.href}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4">
                        <span className="text-[17px] font-semibold tracking-[-0.015em] text-[#111111]" style={{ fontFamily: SANS }}>
                          {highlight(item.title, terms)}
                        </span>
                        <span className={`shrink-0 transition-all ${active === i ? "translate-x-0.5 text-[#1e6b3c]" : "text-[#111111]/30 group-hover:translate-x-0.5 group-hover:text-[#1e6b3c]"}`} aria-hidden>→</span>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[#111111]/55" style={{ fontFamily: SANS }}>
                        {highlight(item.snippet, terms)}
                      </p>
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
