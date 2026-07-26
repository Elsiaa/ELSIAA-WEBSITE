"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Temporarily switches the document to Quanta `default-light` while ops UIs
 * (admin / client portal) are mounted. Restores the prior theme on unmount so
 * the marketing site stays dark.
 */
export function OpsLightTheme({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute("data-theme");
    const prevColorScheme = root.style.colorScheme;

    root.setAttribute("data-theme", "default-light");
    root.style.colorScheme = "light";

    return () => {
      if (prevTheme == null) {
        root.removeAttribute("data-theme");
      } else {
        root.setAttribute("data-theme", prevTheme);
      }
      root.style.colorScheme = prevColorScheme;
    };
  }, []);

  return (
    <div className="elsiaa-ops min-h-screen bg-[#F5F5F3] text-[#111]">
      {children}
    </div>
  );
}
