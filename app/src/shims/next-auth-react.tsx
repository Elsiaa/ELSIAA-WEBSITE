/** next-auth/react shim — loads ELSIAA portal/admin cookie session for Poel UI. */
import { useEffect, useState, type ReactNode } from "react";
import { getAppSessionState } from "../lib/app-session.functions";

type SessionUser = { email?: string; name?: string; id?: string };
type SessionData = { user?: SessionUser } | null;

export function useSession() {
  const [data, setData] = useState<SessionData>(null);
  const [status, setStatus] = useState<
    "authenticated" | "unauthenticated" | "loading"
  >("loading");

  useEffect(() => {
    let cancelled = false;
    void getAppSessionState()
      .then((s) => {
        if (cancelled) return;
        if (s.authenticated && (s.userId || s.email)) {
          setData({
            user: {
              id: s.userId ?? undefined,
              email: s.email ?? undefined,
              name: s.name ?? undefined,
            },
          });
          setStatus("authenticated");
        } else {
          setData(null);
          setStatus("unauthenticated");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setData(null);
        setStatus("unauthenticated");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    data,
    status,
    update: async () => data,
  };
}

export async function signIn() {
  return { error: "Use /portal/sign-in or /admin/sign-in" };
}

export async function signOut(options?: { callbackUrl?: string }) {
  const path = options?.callbackUrl || "/portal/sign-in";
  if (typeof window !== "undefined") {
    const { signOutAndHardRedirect } = await import("../lib/auth-sign-out-client");
    await signOutAndHardRedirect(path);
  }
  return { url: path };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  return children as React.ReactElement;
}
