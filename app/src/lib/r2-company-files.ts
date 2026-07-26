import { S3Client } from '@aws-sdk/client-s3';

/**
 * Admin company file storage (`company-admin-files/…` keys).
 *
 * **Single-bucket mode (recommended):** leave `R2_COMPANY_FILES_BUCKET_NAME` unset;
 * this module uses `R2_BUCKET_NAME` from `@/lib/r2` (same bucket as chat, PDFs, meetings).
 * Set `R2_COMPANY_FILES_PUBLIC_URL` (e.g. https://files.elsiaa.com) to the public hostname
 * bound to that bucket so “Copy link” matches where objects live.
 *
 * Optional dedicated R2 bucket for admin company file storage only.
 * Falls back to main `R2_*` vars when company-files-specific vars are unset.
 *
 * Env:
 * - R2_COMPANY_FILES_BUCKET_NAME — bucket name (set this to use a separate bucket)
 * - R2_COMPANY_FILES_ACCOUNT_ID — optional; default R2_ACCOUNT_ID
 * - R2_COMPANY_FILES_ACCESS_KEY_ID / R2_COMPANY_FILES_SECRET_ACCESS_KEY — optional; default R2_*
 * - R2_COMPANY_FILES_PUBLIC_URL — optional; e.g. https://files.elsiaa.com if you publish reads on that host
 *
 * Folder page links (/share/files + ZIP download) also need:
 * - COMPANY_FILES_SHARE_TOKEN_SECRET — at least 16 chars; encrypts folder share tokens
 */
const accountId =
  process.env.R2_COMPANY_FILES_ACCOUNT_ID || process.env.R2_ACCOUNT_ID || '';
const accessKeyId =
  process.env.R2_COMPANY_FILES_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey =
  process.env.R2_COMPANY_FILES_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY || '';

export const r2CompanyFilesClient = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
  // SDK v3.934+ adds automatic CRC32 checksums and includes content-length in presigned
  // signed headers. Both break browser→R2 CORS preflight. Disable checksums so presigned
  // PUT URLs work from the browser.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

/** When unset, matches legacy single-bucket setup (same as R2_BUCKET_NAME). */
export const R2_COMPANY_FILES_BUCKET_NAME =
  process.env.R2_COMPANY_FILES_BUCKET_NAME || process.env.R2_BUCKET_NAME || '';

export const R2_COMPANY_FILES_PUBLIC_URL =
  process.env.R2_COMPANY_FILES_PUBLIC_URL || '';

const usingDedicatedBucket = Boolean(process.env.R2_COMPANY_FILES_BUCKET_NAME);

if (usingDedicatedBucket) {
  if (!accountId) {
    console.warn('R2_COMPANY_FILES_BUCKET_NAME is set but R2_ACCOUNT_ID (or R2_COMPANY_FILES_ACCOUNT_ID) is missing.');
  }
  if (!accessKeyId || !secretAccessKey) {
    console.warn('R2 company-files bucket: set R2_* or R2_COMPANY_FILES_* access credentials.');
  }
  if (!R2_COMPANY_FILES_BUCKET_NAME) {
    console.warn('R2_COMPANY_FILES_BUCKET_NAME is invalid or empty.');
  }
}
