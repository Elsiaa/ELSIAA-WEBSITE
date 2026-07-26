/**
 * Files larger than this use presigned PUT (browser → R2) so hosts like Vercel are not limited
 * by ~4.5 MiB Serverless body caps. Smaller files use same-origin FormData for simplicity.
 *
 * Set `NEXT_PUBLIC_COMPANY_FILES_PROXY_UPLOAD_MAX_BYTES` (bytes) to tune. Default 3 MiB leaves
 * headroom for multipart boundaries when proxying through the app.
 */
export function getProxyUploadMaxBytes(): number {
  const raw = process.env.NEXT_PUBLIC_COMPANY_FILES_PROXY_UPLOAD_MAX_BYTES;
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return 3 * 1024 * 1024;
}
