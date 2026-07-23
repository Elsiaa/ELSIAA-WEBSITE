import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteNav } from "../components/SiteNav";

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

const SANS =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";
const MONO =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif";

type Item = {
  title: string;
  href: string;
  category: string;
  keywords: string;
  snippet: string;
};

// A real, hand-built index of the site's key pages and sub-topics.
const INDEX: Item[] = [
  {
    title: "Home",
    href: "/",
    category: "Overview",
    keywords: "elsiaa start overview ai done better home",
    snippet: "The ELSIAA studio — AI, automation and design, done better.",
  },
  {
    title: "Clients",
    href: "/clients",
    category: "Clients",
    keywords: "clients new existing onboarding start here client portal login sign in get started",
    snippet: "Two ways in — new clients start with a call; existing clients sign in to the portal.",
  },
  {
    title: "Intake OS",
    href: "/intake",
    category: "Product",
    keywords: "intake os voice agent phone line ai receptionist doctor matching triage healthcare clinic routing scheduling playable",
    snippet: "The voice line that understands a caller in plain language, matches them to the right specialist, and books it — shown full-stack.",
  },
  {
    title: "Automate",
    href: "/automate",
    category: "Automation",
    keywords: "automation agents ai workflow dispatch operations systems",
    snippet: "Custom AI systems that run the busywork so your team doesn't.",
  },
  {
    title: "Dispatch OS",
    href: "/automate",
    category: "Automation",
    keywords: "dispatch os logistics routing operations fleet control tower",
    snippet: "An AI control tower for dispatch, routing and daily operations.",
  },
  {
    title: "AI Secretary",
    href: "/automate",
    category: "Automation",
    keywords: "ai secretary assistant scheduling inbox calls voice agent",
    snippet: "An always-on assistant that fields calls, books and follows up.",
  },
  {
    title: "Before / after walkthroughs",
    href: "/automate",
    category: "Automation",
    keywords: "before after walkthrough case study demo results proof",
    snippet: "See real workflows before and after we automated them.",
  },
  {
    title: "Services",
    href: "/services",
    category: "Services",
    keywords: "services offerings capabilities web branding apps development",
    snippet: "Websites, branding, apps and automation — the full studio menu.",
  },
  {
    title: "Designs",
    href: "/designs",
    category: "Work",
    keywords: "designs portfolio work showcase gallery projects visual",
    snippet: "Selected work — websites, brands and interfaces we've shipped.",
  },
  {
    title: "Consultation",
    href: "/consultation",
    category: "Get started",
    keywords: "consultation call strategy advice discovery book meeting",
    snippet: "Book a working session to map the right build for you.",
  },
  {
    title: "Insights",
    href: "/insights",
    category: "Insights",
    keywords: "insights blog articles writing ideas research thinking",
    snippet: "Notes on AI, automation and design from the ELSIAA team.",
  },
  {
    title: "Locations",
    href: "/locations",
    category: "Locations",
    keywords: "locations offices cities global where world map",
    snippet: "Where we work — offices across six cities worldwide.",
  },
  {
    title: "New York",
    href: "/locations",
    category: "Locations",
    keywords: "new york nyc usa office location america",
    snippet: "Our New York office and the work we do from it.",
  },
  {
    title: "London",
    href: "/locations",
    category: "Locations",
    keywords: "london uk england office location europe",
    snippet: "Our London office and the work we do from it.",
  },
  {
    title: "Geneva",
    href: "/locations",
    category: "Locations",
    keywords: "geneva switzerland office location europe swiss",
    snippet: "Our Geneva office and the work we do from it.",
  },
  {
    title: "Tel Aviv",
    href: "/locations",
    category: "Locations",
    keywords: "tel aviv israel office location middle east",
    snippet: "Our Tel Aviv office and the work we do from it.",
  },
  {
    title: "Team",
    href: "/team",
    category: "Company",
    keywords: "team people about who we are staff crew",
    snippet: "The people behind ELSIAA.",
  },
  {
    title: "Leadership",
    href: "/team",
    category: "Company",
    keywords: "leadership founders principals directors executives management",
    snippet: "Meet the leadership steering the studio.",
  },
  {
    title: "Contact",
    href: "/contact",
    category: "Get started",
    keywords: "contact email reach us get in touch talk hello",
    snippet: "Start a conversation — we usually reply the same day.",
  },
  {
    title: "Client Portal",
    href: "/portal",
    category: "Clients",
    keywords: "portal login client sign in account dashboard existing",
    snippet: "Existing clients — sign in to your project workspace.",
  },
  {
    title: "Get a Quote",
    href: "/quote",
    category: "Get started",
    keywords: "quote pricing estimate cost budget proposal quote",
    snippet: "Tell us the scope and get a tailored estimate back.",
  },
  {
    title: "Careers",
    href: "/careers",
    category: "Company",
    keywords: "careers jobs hiring roles openings work with us apply",
    snippet: "Open roles and what it's like to build here.",
  },
  {
    title: "Store",
    href: "/store",
    category: "Store",
    keywords: "store shop products templates buy purchase merch goods",
    snippet: "Ready-made templates and products from the studio.",
  },
];

const POPULAR = [
  "Automate",
  "Services",
  "Get a Quote",
  "Careers",
  "Locations",
  "Contact",
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

function SearchPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read ?q= and autofocus once mounted (SSR-safe).
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initial = new URLSearchParams(window.location.search).get("q");
      if (initial) setQ(initial);
    }
    inputRef.current?.focus();
  }, []);

  // Keep ?q= in sync with the field.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (q.trim()) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url.toString());
  }, [q]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return INDEX.map((item) => [score(item, terms), item] as const)
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0])
      .map(([, item]) => item);
  }, [q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  const go = (href: string) => {
    if (typeof window !== "undefined") window.location.href = href;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setQ("");
      return;
    }
    if (!results.length) return;
    if (e.key === "Enter") {
      e.preventDefault();
      go(results[Math.min(active, results.length - 1)].href);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
  };

  const hasQuery = q.trim().length > 0;

  return (
    <main className="min-h-screen bg-white text-[#111111]">
      <SiteNav />
      <section className="mx-auto max-w-3xl px-6 pt-36 pb-28 md:pt-44">
        <p
          className="text-[13px] text-[#1e6b3c] "
          style={{ fontFamily: MONO }}
        >
          Search
        </p>
        <h1
          className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-5xl"
          style={{ fontFamily: SANS }}
        >
          What are you looking for?
        </h1>
        <p
          className="mt-3 text-[15px] leading-relaxed text-[#111111]/55"
          style={{ fontFamily: SANS }}
        >
          Search across every page — services, automation, locations, careers and more.
        </p>

        {/* the field */}
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-black/[0.06] bg-white px-5 py-4 transition-colors focus-within:border-[#1e6b3c]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1e6b3c"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Services, divisions, cities, careers…"
            aria-label="Search the site"
            className="w-full bg-transparent text-[17px] outline-none placeholder:text-[#111111]/45"
            style={{ fontFamily: SANS }}
          />
          {hasQuery && (
            <button
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="shrink-0 rounded-md px-2 py-1 text-[13px] text-[#111111]/50  transition-colors hover:text-[#111111]"
              style={{ fontFamily: MONO }}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* result count / hint */}
        {hasQuery && (
          <p
            className="mt-4 text-[13px] text-[#111111]/50 "
            style={{ fontFamily: MONO }}
          >
            {results.length} result{results.length === 1 ? "" : "s"}
            {results.length > 0 ? " · press enter to open the top match" : ""}
          </p>
        )}

        {/* initial state — popular links */}
        {!hasQuery && (
          <div className="mt-10">
            <p
              className="text-[13px] text-[#111111]/55 "
              style={{ fontFamily: MONO }}
            >
              Popular
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {POPULAR.map((label) => (
                <button
                  key={label}
                  onClick={() => {
                    setQ(label);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] text-[#111111]/70 transition-colors duration-200 hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                  style={{ fontFamily: SANS }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* results */}
        {hasQuery && (
          <div className="mt-8">
            {results.length === 0 ? (
              <div className="rounded-xl border border-black/[0.06] bg-white p-8">
                <p
                  className="text-[15px] text-[#111111]/70"
                  style={{ fontFamily: SANS }}
                >
                  No matches for “{q.trim()}” — try Automate, Services, or Contact.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {POPULAR.slice(0, 4).map((label) => (
                    <button
                      key={label}
                      onClick={() => {
                        setQ(label);
                        inputRef.current?.focus();
                      }}
                      className="rounded-full border border-black/[0.06] px-4 py-2 text-[13px] text-[#111111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c]"
                      style={{ fontFamily: SANS }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-black/[0.06] bg-white">
                {results.map((item, i) => (
                  <a
                    key={`${item.title}-${item.href}`}
                    href={item.href}
                    onMouseEnter={() => setActive(i)}
                    className={`group block px-5 py-4 transition-colors ${
                      i > 0 ? "border-t border-black/[0.06]" : ""
                    } ${active === i ? "bg-[#1e6b3c]/[0.04]" : "hover:bg-[#1e6b3c]/[0.04]"}`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span
                        className="text-[13px] text-[#1e6b3c] "
                        style={{ fontFamily: MONO }}
                      >
                        {item.category}
                      </span>
                      <span
                        className="shrink-0 text-[13px] tracking-[0.12em] text-[#111111]/35"
                        style={{ fontFamily: MONO }}
                      >
                        {item.href}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-4">
                      <span
                        className="text-[16px] font-medium text-[#111111]"
                        style={{ fontFamily: SANS }}
                      >
                        {item.title}
                      </span>
                      <span
                        className={`shrink-0 transition-all ${
                          active === i
                            ? "translate-x-0.5 text-[#1e6b3c]"
                            : "text-[#111111]/40 group-hover:translate-x-0.5 group-hover:text-[#1e6b3c]"
                        }`}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                    <p
                      className="mt-1.5 text-[14px] leading-relaxed text-[#111111]/55"
                      style={{ fontFamily: SANS }}
                    >
                      {item.snippet}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
