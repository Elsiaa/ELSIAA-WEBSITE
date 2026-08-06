"use client";

const DEFAULT_PATH = "/";

/**
 * Ends the single app session then hard-navigates (default: home).
 */
export async function signOutAndHardRedirect(callbackPath: string = DEFAULT_PATH): Promise<void> {
  const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
  try {
    await Promise.race([
      fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    /* still leave the page */
  }
  window.location.assign(path);
}
