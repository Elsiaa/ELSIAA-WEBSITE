/** Edge-safe helpers for Poel demo subdomains (used from middleware). */

/**
 * Vanity host for time tracking (CNAME → Vercel). Defaults to `clock.elsiaa.com`.
 * Override with `POEL_CLOCK_HOST`, or legacy `POEL_CLOCK_DEMO_HOST`.
 */
export const POEL_CLOCK_HOST = (() => {
  const fromEnv =
    (typeof process.env.POEL_CLOCK_HOST === "string" && process.env.POEL_CLOCK_HOST.trim()) ||
    (typeof process.env.POEL_CLOCK_DEMO_HOST === "string" &&
      process.env.POEL_CLOCK_DEMO_HOST.trim()) ||
    "";
  return fromEnv || "clock.elsiaa.com";
})();

/** @deprecated Alias for `POEL_CLOCK_HOST` (same value). */
export const POEL_CLOCK_DEMO_HOST = POEL_CLOCK_HOST;

/** True when the request host is the dedicated time-tracking vanity domain (see middleware). */
export function isPoelClockHost(hostHeader: string | null): boolean {
  const first = hostHeader?.split(",")[0]?.trim() ?? "";
  const hostOnly = first.split(":")[0]?.toLowerCase() ?? "";
  return hostOnly === POEL_CLOCK_HOST.toLowerCase();
}

export const POEL_DEMO_RESERVED_SLUGS = new Set([
  "www",
  "api",
  "mail",
  "ftp",
  "cdn",
  "staging",
  "dev",
  "app",
  "admin",
  /** Dedicated in-app route on this deployment — see middleware rewrite to `/time-tracking`. */
  "clock",
  /** Keeps `demo.elsiaa.com` free for a normal site / CNAME (not `*.demo.elsiaa.com`). */
  "demo",
]);

/**
 * True when `parsePoelDemoSlug` would use `POEL_DEMO_DEV_SLUG` on loopback (localhost dev shortcut).
 * Middleware uses this to fall through to the normal app if that slug has no `poel_demo_hosts` row yet.
 *
 * Host rules (see `parsePoelDemoSlug`): `<slug>.demo.elsiaa.com`, legacy `<slug>.poel.ai`, and local testing
 * with `POEL_DEMO_DEV_SLUG` on localhost / 127.0.0.1 / ::1 in development (`AUTH_URL` / `NEXTAUTH_URL`
 * should match your dev origin for sign-in).
 */
export function isPoelDemoDevLoopbackHost(hostHeader: string | null): boolean {
  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";
  if (process.env.NODE_ENV !== "development" || !process.env.POEL_DEMO_DEV_SLUG?.trim())
    return false;
  const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!loopback) return false;
  const slug = process.env.POEL_DEMO_DEV_SLUG.trim().toLowerCase();
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) && !POEL_DEMO_RESERVED_SLUGS.has(slug);
}

/** Parse demo host header → slug, or `null` if not a demo host. */
export function parsePoelDemoSlug(hostHeader: string | null): string | null {
  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";

  if (isPoelDemoDevLoopbackHost(hostHeader)) {
    return process.env.POEL_DEMO_DEV_SLUG!.trim().toLowerCase();
  }

  if (!hostHeader) return null;

  const underDemo = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.demo\.poel\.ai$/.exec(host);
  if (underDemo) {
    const slug = underDemo[1];
    if (POEL_DEMO_RESERVED_SLUGS.has(slug)) return null;
    return slug;
  }

  const legacy = /^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)\.poel\.ai$/.exec(host);
  if (legacy) {
    const slug = legacy[1];
    if (POEL_DEMO_RESERVED_SLUGS.has(slug)) return null;
    return slug;
  }

  return null;
}
