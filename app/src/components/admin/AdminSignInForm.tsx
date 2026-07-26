import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { adminSignIn, getAdminAuthState } from "../../lib/admin/auth.functions";
import { adminFonts } from "./tokens";

type Props = {
  initial: Awaited<ReturnType<typeof getAdminAuthState>>;
};

export function AdminSignInForm({ initial }: Props) {
  const { mono, sans } = adminFonts;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await adminSignIn({ data: { email, password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      void navigate({ to: "/admin" });
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready =
    initial.superAdminConfigured && initial.sessionReady && initial.supabaseReady;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F3] px-6 py-16 text-[#111]">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/assets/elsiaa-lion.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-[13px] font-bold tracking-wide" style={mono}>
            ELSIAA
          </span>
        </Link>
        <p className="mt-10 text-[13px] text-[#1e6b3c]" style={mono}>
          Super admin
        </p>
        <h1
          className="mt-3 text-3xl font-semibold tracking-[-0.035em] md:text-4xl"
          style={sans}
        >
          Admin console.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#111]/55" style={sans}>
          Sign in with your Supabase Auth password. Access requires{" "}
          <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[12px]">SUPER_ADMIN_EMAILS</code>{" "}
          and{" "}
          <code className="rounded bg-black/[0.06] px-1.5 py-0.5 text-[12px]">
            app_metadata.role = super_admin
          </code>
          . Data access uses RLS (not the service role).
        </p>

        {!initial.superAdminConfigured && (
          <p
            className="mt-6 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
            style={sans}
          >
            Set <code className="text-[12px]">SUPER_ADMIN_EMAILS</code> in your environment before
            signing in.
          </p>
        )}
        {!initial.supabaseReady && (
          <p
            className="mt-4 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-900"
            style={sans}
          >
            Set <code className="text-[12px]">SUPABASE_URL</code> and{" "}
            <code className="text-[12px]">SUPABASE_PUBLISHABLE_KEY</code>.
          </p>
        )}

        <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-[12px] text-[#111]/45" style={mono}>
              Super admin email
            </span>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
              placeholder="you@elsiaa.com"
              style={sans}
            />
          </label>
          <label className="block">
            <span className="text-[12px] text-[#111]/45" style={mono}>
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
              placeholder="Supabase Auth password"
              style={sans}
            />
          </label>
          <button
            type="submit"
            disabled={busy || !ready}
            className="mt-2 w-full rounded-full bg-[#1e6b3c] py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-[#155a32] disabled:opacity-40"
            style={mono}
          >
            {busy ? "Signing in…" : "Enter admin"}
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

        <p className="mt-8 text-[12px] text-[#111]/40" style={mono}>
          Allowlist: {initial.allowlistCount} · Cookie seal:{" "}
          {initial.sessionReady ? "ready" : "missing"} · Supabase:{" "}
          {initial.supabaseReady ? "ready" : "missing"}
        </p>
      </div>
    </main>
  );
}
