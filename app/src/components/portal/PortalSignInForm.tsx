import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { getPortalAuthState, portalSignIn } from "../../lib/portal/auth.functions";
import { portalFonts } from "./tokens";

type Props = {
  initial: Awaited<ReturnType<typeof getPortalAuthState>>;
  initialEmail?: string;
  next?: "/portal" | "/admin";
};

export function PortalSignInForm({ initial, initialEmail, next }: Props) {
  const { mono, sans } = portalFonts;
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await portalSignIn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const to =
        next === "/admin"
          ? "/admin"
          : next === "/portal"
            ? "/portal"
            : res.isSuperAdmin
              ? "/admin"
              : "/portal";
      void navigate({ to });
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = initial.authReady;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F3] px-6 py-16 text-[#111]">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/assets/elsiaa-lion-192.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-[13px] font-bold tracking-wide" style={mono}>
            ELSIAA
          </span>
        </Link>
        <h1 className="mt-10 text-3xl font-semibold tracking-[-0.035em] md:text-4xl" style={sans}>
          Sign in.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#111]/55" style={sans}>
          Sign in with your ELSIAA email and password.
        </p>

        {!initial.supabaseReady && (
          <p
            className="mt-6 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
            style={sans}
          >
            Sign-in is temporarily unavailable. Please try again later or contact support.
          </p>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[12px] text-[#111]/45" style={mono}>
              Email
            </span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
              placeholder="you@company.com"
              style={sans}
            />
          </label>
          <label className="block">
            <span className="text-[12px] text-[#111]/45" style={mono}>
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
              placeholder="••••••••"
              style={sans}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !ready}
            className="mt-2 w-full rounded-full bg-[#1e6b3c] py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-[#155a32] disabled:opacity-40"
            style={mono}
          >
            {busy ? "Signing in…" : "Continue"}
          </button>
        </form>

        {error && (
          <p
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800"
            style={sans}
          >
            {error}
          </p>
        )}

        <p className="mt-8 text-[13px] text-[#111]/45" style={sans}>
          Trouble signing in?{" "}
          <a href="mailto:info@elsiaa.com" className="text-[#1e6b3c] hover:underline">
            info@elsiaa.com
          </a>
        </p>
      </div>
    </main>
  );
}
