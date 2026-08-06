/**
 * Only URLs under our public R2 base may be proxied (prevents SSRF).
 * Support + chat uploads both live under this prefix.
 * Reads env here (not `@/lib/r2`) so API routes do not load the S3 client.
 */
export function isAllowedPublicR2AssetUrl(urlStr: string): boolean {
  const base = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
  if (!base) return false;
  if (!urlStr.startsWith("https://") && !urlStr.startsWith("http://")) return false;
  const prefix = `${base}/`;
  return urlStr.startsWith(prefix);
}

/** Same-origin path for embedding R2 assets in iframes (Chrome blocks cross-origin PDF embeds). */
export function proxiedAttachmentPreviewPath(sourceUrl: string): string {
  return `/api/support/attachment-preview?url=${encodeURIComponent(sourceUrl)}`;
}

/** Use direct blob/data or same-origin URLs; otherwise proxy so iframe src stays on this app. */
export function pdfIframeSrcForEmbed(url: string): string {
  if (url.startsWith("blob:") || url.startsWith("data:")) return url;
  try {
    if (typeof window !== "undefined" && new URL(url).origin === window.location.origin) {
      return url;
    }
  } catch {
    return url;
  }
  return proxiedAttachmentPreviewPath(url);
}
