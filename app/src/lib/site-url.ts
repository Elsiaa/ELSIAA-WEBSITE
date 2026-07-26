/**
 * Public site origin for canonical / og: absolute URLs.
 *
 * Prefer `VITE_SITE_URL` (set in Vercel env). Fallbacks: Vercel system hosts,
 * then the production domain.
 */
export function getSiteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof process !== "undefined") {
    const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
    if (production) return `https://${production.replace(/^https?:\/\//, "")}`;
    const preview = process.env.VERCEL_URL?.trim();
    if (preview) return `https://${preview.replace(/^https?:\/\//, "")}`;
  }

  return "https://elsiaa.com";
}

export function getSiteHost(): string {
  return getSiteUrl().replace(/^https?:\/\//, "");
}

export function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return getSiteUrl();
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  return pathOrUrl.startsWith("/") ? `${base}${pathOrUrl}` : `${base}/${pathOrUrl}`;
}
