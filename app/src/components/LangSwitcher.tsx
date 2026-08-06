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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        aria-expanded={open}
        className={`flex min-h-[44px] items-center gap-1.5 px-1 ${ink} transition-opacity hover:opacity-60 md:min-h-0 md:px-0`}
      >
        {/* globe */}
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
        <span className="text-[13px] " style={{ fontFamily: "var(--font-sans)" }}>
          {current.code}
        </span>
      </button>

      {open && (
        <div
          className="absolute top-full left-0 z-50 mt-2 max-h-[52vh] w-44 overflow-y-auto rounded-xl border border-black/[0.08] bg-white py-1 shadow-[0_24px_60px_-30px_rgba(17,17,17,0.4)] md:right-0 md:left-auto md:mt-3"
          role="listbox"
          data-no-translate
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
              className={`flex min-h-[44px] w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-[#1e6b3c]/[0.06] ${
                l.code === lang ? "bg-[#1e6b3c]/[0.08]" : ""
              }`}
              dir={l.rtl ? "rtl" : "ltr"}
            >
              <span
                className="text-[13px] text-[#111111]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {l.native}
              </span>
              <span
                className={`text-[13px]  ${l.code === lang ? "text-[#1e6b3c]" : "text-[#111111]/35"}`}
                style={{ fontFamily: "var(--font-sans)" }}
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
