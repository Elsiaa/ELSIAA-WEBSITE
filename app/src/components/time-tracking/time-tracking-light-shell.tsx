"use client";

import { useEffect } from "react";
import { themes } from "@/styles/theme";

/**
 * Time tracking matches the main app light palette. Temporarily clears `dark` / theme classes
 * on `<html>` and restores the user's saved theme on unmount.
 */
export function TimeTrackingLightShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;

    const applyFromStorage = () => {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem("theme") : null;
      const t = raw && raw in themes ? (raw as keyof typeof themes) : "dark";
      Object.keys(themes).forEach((k) => root.classList.remove(k));
      root.classList.remove("dark");
      if (t !== "light") {
        root.classList.add(t);
      }
      if (t === "dark") {
        root.classList.add("dark");
      }
    };

    Object.keys(themes).forEach((k) => root.classList.remove(k));
    root.classList.remove("dark");

    return () => {
      applyFromStorage();
    };
  }, []);

  return <>{children}</>;
}
