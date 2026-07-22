import { useEffect, useMemo, useRef, useState } from "react";

/*
  Site-wide search — ⌘K / tap the magnifier. Client-side index of every
  page, division, service, city, and role. Instant filtering, keyboard
  navigation, jump on enter.
*/
export type Entry = { label: string; group: string; href: string; keys?: string };

export const SEARCH_INDEX: Entry[] = [
  { label: "Home", group: "Pages", href: "/" },
  { label: "Clients — new & existing", group: "Pages", href: "/clients", keys: "clients onboarding start portal login existing new" },
  { label: "Services", group: "Pages", href: "/services" },
  { label: "Work — our work", group: "Pages", href: "/designs", keys: "portfolio showcase work designs" },
  { label: "Careers — we are hiring", group: "Pages", href: "/careers", keys: "jobs hiring apply application" },
  { label: "Contact", group: "Pages", href: "mailto:isya@elsiaa.com", keys: "email reach us" },

  { label: "Design division", group: "Divisions", href: "/designs" },
  { label: "Automation division", group: "Divisions", href: "/services" },
  { label: "Software division", group: "Divisions", href: "/services" },
  { label: "Consultation division", group: "Divisions", href: "/#consultation", keys: "advice strategy pricing" },

  { label: "Website Design & Development", group: "Services", href: "/designs", keys: "web ui ux saas ecommerce dashboards" },
  { label: "UI/UX Design", group: "Services", href: "/designs" },
  { label: "Mobile App Design", group: "Services", href: "/designs", keys: "ios android ui" },
  { label: "Branding & Logo Design", group: "Services", href: "/designs", keys: "brand identity packaging print" },
  { label: "Marketing Graphics", group: "Services", href: "/designs", keys: "social media motion presentation" },
  { label: "3D Product Renders", group: "Services", href: "/designs", keys: "product staging commercial imagery" },
  { label: "Sales Automation", group: "Services", href: "/services", keys: "outreach crm pipelines" },
  { label: "Operations Automation", group: "Services", href: "/services", keys: "workflows back office" },
  { label: "Customer Support Automation", group: "Services", href: "/services", keys: "follow-up email slack discord bots" },
  { label: "Finance Automation", group: "Services", href: "/services", keys: "invoice reporting dashboards" },
  { label: "AI Workflow Automation", group: "Services", href: "/services", keys: "agents assistants" },
  { label: "Custom Software", group: "Services", href: "/services", keys: "web mobile enterprise infrastructure" },
  { label: "Strategy Consultation", group: "Services", href: "/#consultation", keys: "1-on-1 calls advisory" },
  { label: "Consultation pricing", group: "Services", href: "/#consultation", keys: "basic sprint advisory 350 1850 book session" },

  { label: "New York City office", group: "Locations", href: "/locations", keys: "nyc usa america" },
  { label: "London office", group: "Locations", href: "/locations", keys: "uk england" },
  { label: "Geneva office", group: "Locations", href: "/locations", keys: "switzerland" },
  { label: "Antwerp office", group: "Locations", href: "/locations", keys: "belgium" },
  { label: "Tel Aviv office", group: "Locations", href: "/locations", keys: "israel" },
  { label: "Los Angeles office", group: "Locations", href: "/locations", keys: "la california usa" },

  { label: "Apply — Designers", group: "Careers", href: "/careers", keys: "design job" },
  { label: "Apply — Engineers", group: "Careers", href: "/careers", keys: "engineering developer job" },
  { label: "Apply — Sales", group: "Careers", href: "/careers", keys: "sales job" },
  { label: "The team", group: "Company", href: "/#team", keys: "yisrael krug david heimowitz jacob rubelow chaim lieberman izzy eisenberg founder ceo cto legal" },
];

function score(e: Entry, q: string): number {
  const hay = `${e.label} ${e.group} ${e.keys ?? ""}`.toLowerCase();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  let sc = 0;
  for (const w of words) {
    if (!hay.includes(w)) return 0;
    sc += e.label.toLowerCase().startsWith(w) ? 3 : e.label.toLowerCase().includes(w) ? 2 : 1;
  }
  return sc;
}

export function SiteSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!q.trim()) return SEARCH_INDEX.slice(0, 8);
    return SEARCH_INDEX.map((e) => [score(e, q), e] as const)
      .filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0])
      .map(([, e]) => e)
      .slice(0, 10);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => setSel(0), [q]);

  const go = (e: Entry) => {
    onClose();
    window.location.href = e.href;
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-[0_40px_120px_rgba(0,0,0,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.5" y2="16.5" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => Math.min(s + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter" && results[sel]) {
                go(results[sel]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search ELSIAA — services, locations, careers…"
            className="w-full bg-transparent py-4 text-[15px] outline-none placeholder:text-[#111111]/50"
            style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
          />
          <kbd
            className="hidden rounded border border-black/10 px-1.5 py-0.5 text-[10px] text-[#111111]/55 md:block"
            style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
          >
            ESC
          </kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="px-5 py-6 text-[14px] text-[#111111]/55">
              Nothing found — try "automation", "pricing", or "careers".
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.label}-${i}`}
              onClick={() => go(r)}
              onMouseEnter={() => setSel(i)}
              className={`flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors ${
                i === sel ? "bg-[#1e6b3c]/[0.07]" : ""
              }`}
            >
              <span
                className="text-[14px] font-medium text-[#111111]"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {r.label}
              </span>
              <span
                className="flex-none text-[10px] tracking-[0.2em] text-[#111111]/50 uppercase"
                style={{ fontFamily: "'SF Mono', ui-monospace, SFMono-Regular, 'IBM Plex Mono', monospace" }}
              >
                {r.group}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
