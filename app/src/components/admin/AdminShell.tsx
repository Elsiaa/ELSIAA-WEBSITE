import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { signOutAndHardRedirect } from "../../lib/auth-sign-out-client";
import { OpsLightTheme } from "../ops/OpsLightTheme";
import {
  ADMIN_GREEN,
  ADMIN_PAGE_BG,
  adminFonts,
  type AdminNavEntry,
  type AdminTabId,
} from "./tokens";

type Props = {
  active: AdminTabId;
  onNavigate: (id: AdminTabId) => void;
  email: string;
  roleLabel: string;
  nav: AdminNavEntry[];
  onRefresh?: () => void;
  refreshing?: boolean;
  children: ReactNode;
};

function groupContains(entry: AdminNavEntry, tab: AdminTabId): boolean {
  if (entry.kind === "group") return entry.children.some((c) => c.id === tab);
  if (entry.kind === "item") return entry.id === tab;
  return false;
}

export function AdminShell({
  active,
  onNavigate,
  email,
  roleLabel,
  nav,
  onRefresh,
  refreshing,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { mono, sans } = adminFonts;

  const initiallyOpen = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of nav) {
      if (entry.kind === "group" && groupContains(entry, active)) ids.add(entry.id);
    }
    return ids;
  }, [nav, active]);

  const [expanded, setExpanded] = useState<Set<string>>(initiallyOpen);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const entry of nav) {
        if (entry.kind === "group" && groupContains(entry, active)) next.add(entry.id);
      }
      return next;
    });
  }, [active, nav]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    await signOutAndHardRedirect("/");
  }

  function selectTab(id: AdminTabId) {
    onNavigate(id);
    setOpen(false);
  }

  return (
    <OpsLightTheme>
      <div className="min-h-screen text-[#111111]" style={{ backgroundColor: ADMIN_PAGE_BG }}>
        <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 md:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close menu" : "Open menu"}
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
              <Link to="/" className="flex items-center gap-2">
                <img src="/assets/elsiaa-lion-192.png" alt="" className="h-7 w-7 object-contain" />
                <span className="text-[13px] font-bold tracking-wide text-[#111]" style={mono}>
                  ELSIAA
                </span>
              </Link>
              <span className="hidden text-[13px] text-[#111]/35 md:inline" style={mono}>
                /
              </span>
              <span
                className="hidden text-[13px] md:inline"
                style={{ ...mono, color: ADMIN_GREEN }}
              >
                {roleLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {onRefresh ? (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-2 text-[12px] font-bold text-[#111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c] disabled:opacity-50"
                  style={mono}
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{refreshing ? "Refreshing…" : "Refresh"}</span>
                </button>
              ) : null}
              <p className="hidden text-[12px] text-[#111]/50 sm:block" style={mono}>
                {email}
              </p>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={signingOut}
                className="rounded-full border border-black/10 px-4 py-2 text-[12px] font-bold text-[#111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c] disabled:opacity-50"
                style={mono}
              >
                {signingOut ? "…" : "Sign out"}
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-[1400px] gap-0 md:gap-8 md:px-6 md:py-8">
          <aside
            className={`${
              open ? "fixed inset-0 z-30 pt-14" : "hidden"
            } w-full shrink-0 md:static md:block md:w-60 md:pt-0`}
            style={{ backgroundColor: ADMIN_PAGE_BG }}
          >
            <nav className="flex flex-col gap-1 overflow-y-auto p-4 md:max-h-[calc(100vh-7rem)] md:p-0">
              {nav.map((entry) => {
                if (entry.kind === "link") {
                  return (
                    <a
                      key={entry.id}
                      href={entry.href}
                      className="rounded-xl px-4 py-3 text-left text-[#111111]/70 transition-colors hover:bg-white hover:text-[#111111]"
                      onClick={() => setOpen(false)}
                    >
                      <span className="block text-[13px] font-bold" style={mono}>
                        {entry.label}
                      </span>
                      {entry.blurb ? (
                        <span
                          className="mt-0.5 block text-[12px] leading-snug text-[#111111]/45"
                          style={sans}
                        >
                          {entry.blurb}
                        </span>
                      ) : null}
                    </a>
                  );
                }

                if (entry.kind === "item") {
                  const isActive = entry.id === active;
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      className={`rounded-xl px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-[#111111]/70 hover:bg-white hover:text-[#111111]"
                      }`}
                      style={isActive ? { backgroundColor: ADMIN_GREEN } : undefined}
                      onClick={() => selectTab(entry.id)}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="block text-[13px] font-bold" style={mono}>
                          {entry.label}
                        </span>
                        {entry.badge != null ? (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                              isActive ? "bg-white/20 text-white" : "bg-black/[0.06] text-[#111]/55"
                            }`}
                            style={mono}
                          >
                            {entry.badge}
                          </span>
                        ) : null}
                      </span>
                      {entry.blurb ? (
                        <span
                          className={`mt-0.5 block text-[12px] leading-snug ${
                            isActive ? "text-white/70" : "text-[#111111]/45"
                          }`}
                          style={sans}
                        >
                          {entry.blurb}
                        </span>
                      ) : null}
                    </button>
                  );
                }

                const isOpen = expanded.has(entry.id);
                const childActive = groupContains(entry, active);
                return (
                  <div key={entry.id} className="mt-1">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                        childActive && !isOpen ? "text-white" : "text-[#111111]/80 hover:bg-white"
                      }`}
                      style={childActive && !isOpen ? { backgroundColor: ADMIN_GREEN } : undefined}
                      onClick={() => {
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(entry.id)) next.delete(entry.id);
                          else next.add(entry.id);
                          return next;
                        });
                        if (!childActive && entry.children[0]) {
                          selectTab(entry.children[0].id);
                        }
                      }}
                    >
                      <span>
                        <span className="block text-[13px] font-bold" style={mono}>
                          {entry.label}
                        </span>
                        {entry.blurb ? (
                          <span
                            className={`mt-0.5 block text-[12px] leading-snug ${
                              childActive && !isOpen ? "text-white/70" : "text-[#111111]/45"
                            }`}
                            style={sans}
                          >
                            {entry.blurb}
                          </span>
                        ) : null}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 opacity-60 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen ? (
                      <div className="ml-2 mt-1 space-y-0.5 border-l border-black/[0.08] pl-2">
                        {entry.children.map((child) => {
                          const isActive = child.id === active;
                          return (
                            <button
                              key={child.id}
                              type="button"
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                                isActive
                                  ? "text-white"
                                  : "text-[#111111]/65 hover:bg-white hover:text-[#111111]"
                              }`}
                              style={isActive ? { backgroundColor: ADMIN_GREEN } : undefined}
                              onClick={() => selectTab(child.id)}
                            >
                              <span>
                                <span className="block text-[12px] font-bold" style={mono}>
                                  {child.label}
                                </span>
                                {child.blurb ? (
                                  <span
                                    className={`mt-0.5 block text-[11px] leading-snug ${
                                      isActive ? "text-white/70" : "text-[#111111]/40"
                                    }`}
                                    style={sans}
                                  >
                                    {child.blurb}
                                  </span>
                                ) : null}
                              </span>
                              {child.badge != null ? (
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : "bg-black/[0.06] text-[#111]/55"
                                  }`}
                                  style={mono}
                                >
                                  {child.badge}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </aside>

          <main className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">{children}</main>
        </div>
      </div>
    </OpsLightTheme>
  );
}
