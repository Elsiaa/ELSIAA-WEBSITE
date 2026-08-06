import { useEffect, useMemo, useRef, useState } from "react";
import { SEARCH_INDEX, search, type Entry } from "../lib/search-engine";

/*
  Site-wide search — ⌘K / tap the magnifier. The index and the ranking now
  live in lib/search-engine (typo tolerance, entity aliases, did-you-mean);
  this file is the overlay UI around it.
*/
export { SEARCH_INDEX };
export type { Entry };

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { results, didYouMean } = useMemo(() => {
    if (!q.trim()) return { results: SEARCH_INDEX.slice(0, 8), didYouMean: null as string | null };
    const r = search(q, 10);
    return { results: r.hits.map((h) => h.entry), didYouMean: r.didYouMean };
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
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#666"
            strokeWidth="2"
            strokeLinecap="round"
          >
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
            style={{ fontFamily: "var(--font-sans)" }}
          />
          <kbd
            className="hidden rounded border border-black/10 px-1.5 py-0.5 text-[13px] text-[#111111]/55 md:block"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            ESC
          </kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto py-2">
          {results.length === 0 && (
            <div className="px-5 py-6">
              <p className="text-[14px] text-[#111111]/60">No matches for "{q.trim()}".</p>
              {didYouMean && (
                <button
                  onClick={() => setQ(didYouMean)}
                  className="mt-2 text-[14px] font-medium text-[#1e6b3c] hover:underline"
                >
                  Did you mean "{didYouMean}"?
                </button>
              )}
            </div>
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
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {r.label}
              </span>
              <span
                className="flex-none text-[13px] text-[#111111]/50 "
                style={{ fontFamily: "var(--font-sans)" }}
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
