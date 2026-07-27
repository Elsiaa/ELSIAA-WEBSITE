import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  completeInvitedSignUp,
  previewInvitation,
} from "../../lib/portal/invited-sign-up.functions";
import { portalFonts } from "./tokens";

export function PortalSignUpForm() {
  const { mono, sans } = portalFonts;
  const navigate = useNavigate();
  const search = useSearch({ from: "/sign-up" }) as { invitation?: string };
  const invitationToken = typeof search.invitation === "string" ? search.invitation : "";

  const [email, setEmail] = useState<string | null>(null);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [checking, setChecking] = useState(Boolean(invitationToken));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!invitationToken) {
        setEmail(null);
        setTokenInvalid(false);
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const res = await previewInvitation({
          data: { invitation: invitationToken },
        });
        if (cancelled) return;
        if (!res.ok) {
          setTokenInvalid(true);
          setEmail(null);
        } else {
          setTokenInvalid(false);
          setEmail(res.email);
        }
      } catch {
        if (!cancelled) {
          setTokenInvalid(true);
          setEmail(null);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [invitationToken]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!invitationToken) {
      setError("Missing invitation link. Open the link from your email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const res = await completeInvitedSignUp({
        data: { invitation: invitationToken, password },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.redirectTo === "/admin") {
        void navigate({ to: "/admin" });
      } else if (res.redirectTo === "/portal") {
        void navigate({ to: "/portal" });
      } else {
        void navigate({
          to: "/portal/sign-in",
          search: res.email ? { email: res.email } : {},
        });
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const hasInvitation = Boolean(invitationToken);
  const canSubmit = hasInvitation && !tokenInvalid && Boolean(email) && !checking;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F5F3] px-6 py-16 text-[#111]">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/assets/elsiaa-lion.png" alt="" className="h-8 w-8 object-contain" />
          <span className="text-[13px] font-bold tracking-wide" style={mono}>
            ELSIAA
          </span>
        </Link>
        <h1
          className="mt-10 text-3xl font-semibold tracking-[-0.035em] md:text-4xl"
          style={sans}
        >
          Create your account.
        </h1>

        {checking && (
          <p className="mt-4 text-[15px] text-[#111]/55" style={sans}>
            Checking invitation…
          </p>
        )}

        {!checking && !hasInvitation && (
          <p className="mt-4 text-[15px] leading-relaxed text-[#111]/55" style={sans}>
            Access is invite-only. Open the link from your invitation email to choose a
            password.
          </p>
        )}

        {!checking && hasInvitation && tokenInvalid && (
          <p
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800"
            style={sans}
            role="alert"
          >
            This invitation link is invalid or has expired. Ask your administrator to
            send a new invite.
          </p>
        )}

        {!checking && canSubmit && email && (
          <p className="mt-4 text-[15px] leading-relaxed text-[#111]/55" style={sans}>
            Create a password for{" "}
            <strong className="font-semibold text-[#111]">{email}</strong>. You can then
            sign in anytime with this email and password.
          </p>
        )}

        {canSubmit && (
          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-[12px] text-[#111]/45" style={mono}>
                Email
              </span>
              <input
                type="email"
                value={email ?? ""}
                readOnly
                disabled
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3.5 text-[15px] text-[#111]/70 outline-none"
                style={sans}
              />
            </label>
            <label className="block">
              <span className="text-[12px] text-[#111]/45" style={mono}>
                Password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
                placeholder="At least 8 characters"
                style={sans}
              />
            </label>
            <label className="block">
              <span className="text-[12px] text-[#111]/45" style={mono}>
                Confirm password
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] text-[#111] outline-none transition-colors placeholder:text-[#111]/30 focus:border-[#1e6b3c]"
                style={sans}
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full rounded-full bg-[#1e6b3c] py-3.5 text-[13px] font-bold text-white transition-colors hover:bg-[#155a32] disabled:opacity-40"
              style={mono}
            >
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        {error && (
          <p
            className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-relaxed text-red-800"
            style={sans}
            role="alert"
          >
            {error}
          </p>
        )}

        <p className="mt-8 text-[13px] text-[#111]/45" style={sans}>
          Already have a password?{" "}
          <Link to="/portal/sign-in" className="text-[#1e6b3c] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
