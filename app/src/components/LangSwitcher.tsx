import { useEffect, useRef, useState } from "react";
import { LANGS, useLang } from "../lib/i18n";

/*
  Language switcher — a globe button that opens a menu of native language names.
  Marked data-no-translate so the menu itself never gets translated.
*/
export function LangSwitcher({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const ink = dark ? "text-white/85" : "text-[#111111]/80";

  return (
    <div ref={ref} data-no-translate className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className={`flex items-center gap-1.5 ${ink} transition-opacity hover:opacity-60`}
      >
        {/* globe */}
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
        <span
          className="text-[13px] "
          style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
        >
          {current.code}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-3 w-44 overflow-hidden rounded-xl border border-black/[0.08] bg-white py-1 shadow-[0_24px_60px_-30px_rgba(17,17,17,0.4)]"
          role="listbox"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-2 text-left transition-colors hover:bg-[#1e6b3c]/[0.06] ${
                l.code === lang ? "bg-[#1e6b3c]/[0.08]" : ""
              }`}
              dir={l.rtl ? "rtl" : "ltr"}
            >
              <span
                className="text-[13px] text-[#111111]"
                style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {l.native}
              </span>
              <span
                className={`text-[13px]  ${l.code === lang ? "text-[#1e6b3c]" : "text-[#111111]/35"}`}
                style={{ fontFamily: "'Schibsted Grotesk', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', system-ui, sans-serif" }}
              >
                {l.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
