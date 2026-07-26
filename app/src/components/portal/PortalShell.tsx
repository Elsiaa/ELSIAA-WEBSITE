import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { signOutAndHardRedirect } from "../../lib/auth-sign-out-client";
import { portalNavMeta } from "../../lib/portal/modules";
import type { PortalNavId } from "../../lib/portal/types";
import { portalFonts } from "./tokens";

type Props = {
  active: PortalNavId;
  onNavigate: (id: PortalNavId) => void;
  /** When set, only these nav items render (module access). */
  allowedNav?: PortalNavId[];
  companyName?: string;
  userName?: string;
  /** From server auth state — Supabase env is not visible in the browser. */
  backendReady?: boolean;
  isSuperAdmin?: boolean;
  children: ReactNode;
};

export function PortalShell({
  active,
  onNavigate,
  allowedNav,
  companyName = "Your company",
  userName = "Client",
  backendReady = false,
  isSuperAdmin = false,
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { mono, sans } = portalFonts;

  const navIds =
    allowedNav && allowedNav.length > 0
      ? allowedNav
      : (Object.keys(portalNavMeta) as PortalNavId[]);

  async function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    await signOutAndHardRedirect("/portal/sign-in");
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111111]">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
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
              <img src="/assets/elsiaa-lion.png" alt="" className="h-7 w-7 object-contain" />
              <span className="text-[13px] font-bold tracking-wide text-[#111111]" style={mono}>
                ELSIAA
              </span>
            </Link>
            <span className="hidden text-[13px] text-[#111111]/35 md:inline" style={mono}>
              /
            </span>
            <span className="hidden text-[13px] text-[#111111]/55 md:inline" style={mono}>
              Client portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold tracking-[-0.01em]" style={sans}>
                {userName}
              </p>
              <p className="text-[12px] text-[#111111]/45" style={mono}>
                {companyName}
              </p>
            </div>
            {isSuperAdmin && (
              <Link
                to="/admin"
                className="rounded-full bg-[#1e6b3c] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#155a32]"
                style={mono}
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              disabled={signingOut}
              onClick={() => void onSignOut()}
              className="rounded-full border border-black/10 px-4 py-2 text-[12px] font-bold text-[#111111]/70 transition-colors hover:border-[#1e6b3c] hover:text-[#1e6b3c] disabled:opacity-50"
              style={mono}
            >
              {signingOut ? "…" : "Sign out"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-0 md:gap-8 md:px-6 md:py-8">
        <aside
          className={`${
            open ? "fixed inset-0 z-30 bg-[#F5F5F3] pt-14" : "hidden"
          } w-full shrink-0 border-black/[0.06] md:static md:block md:w-56 md:border-0 md:bg-transparent md:pt-0`}
        >
          <nav className="flex max-h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-4 md:p-0">
            {navIds.map((id) => {
              const item = portalNavMeta[id];
              const isActive = id === active;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onNavigate(id);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-4 py-3 text-left transition-colors ${
                    isActive
                      ? "bg-[#1e6b3c] text-white"
                      : "text-[#111111]/70 hover:bg-white hover:text-[#111111]"
                  }`}
                >
                  <span className="block text-[13px] font-bold" style={mono}>
                    {item.label}
                  </span>
                  <span
                    className={`mt-0.5 block text-[12px] leading-snug ${
                      isActive ? "text-white/70" : "text-[#111111]/45"
                    }`}
                    style={sans}
                  >
                    {item.blurb}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">
          {!backendReady && (
            <div className="mb-5 rounded-2xl border border-amber-300/80 bg-amber-50 px-5 py-4">
              <p className="text-[13px] font-bold text-amber-950" style={mono}>
                Backend not connected yet
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#111111]/65" style={sans}>
                Set <code className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[12px]">SUPABASE_URL</code>{" "}
                and{" "}
                <code className="rounded bg-black/[0.04] px-1.5 py-0.5 text-[12px]">
                  SUPABASE_PUBLISHABLE_KEY
                </code>{" "}
                on the server, then restart.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
