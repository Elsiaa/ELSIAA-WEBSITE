import { S3Client } from "@aws-sdk/client-s3";

/**
 * Primary Cloudflare R2 bucket (S3-compatible API).
 *
 * Holds: chat-files/, support-files/, meeting uploads, PDF signatures, etc.
 *
 * Unified setup (recommended): use the same bucket as admin company files — set
 * `R2_BUCKET_NAME` to that bucket (e.g. the one behind files.elsiaa.com), then
 * **omit** `R2_COMPANY_FILES_BUCKET_NAME` so `@/lib/r2-company-files` falls back here.
 * Set `R2_PUBLIC_URL` to the same public hostname (e.g. https://files.elsiaa.com) so
 * stored attachment URLs and `attachment-preview` allowlisting stay consistent.
 *
 * Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
  // SDK v3.934+ adds automatic CRC32 checksums and content-length as a signed header,
  // both of which break browser CORS preflight for presigned PUT URLs.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

// Validate configuration on import (server only). `chat.ts` imports this module from
// client bundles too — server-only env vars are stripped there, so these checks would
// always false-positive in the browser.
const isServerRuntime = typeof window === "undefined";
if (isServerRuntime) {
  if (!process.env.R2_ACCOUNT_ID) {
    console.warn("R2_ACCOUNT_ID is not set. R2 uploads will fail.");
  }

  if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
    console.warn("R2 credentials are not set. R2 uploads will fail.");
  }

  if (!R2_BUCKET_NAME) {
    console.warn("R2_BUCKET_NAME is not set. R2 uploads will fail.");
  }
}
