import { randomBytes } from 'node:crypto';
import { authPool } from '@/lib/auth-pool';
import {
  getMaxUploadBytes,
  listCompanyFilesRecursive,
  normalizeRelativePrefix,
} from '@/lib/company-admin-files';

export type PublicUploadLinkRow = {
  id: string;
  token: string;
  company_id: string;
  relative_dir: string;
  label: string | null;
  created_by_auth_user_id: string;
  max_bytes: string | null;
  max_uploads: number | null;
  upload_count: number;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
};

export type PublicUploadExistingFile = {
  /** Path under the link folder (e.g. subfolder/report.pdf) */
  path: string;
  displayName: string;
  size: number | undefined;
  lastModified: string | undefined;
};

export type PublicUploadLinkPublicInfo = {
  label: string | null;
  folderTitle: string;
  relativeDir: string;
  maxBytes: number;
  expiresAt: string | null;
  uploadsRemaining: number | null;
  uploadCount: number;
  existingFiles: PublicUploadExistingFile[];
};

function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

function normalizeStoredRelativeDir(relative: string | undefined | null): string {
  const norm = normalizeRelativePrefix(relative ?? '');
  return norm.replace(/\/+$/, '');
}

/** Ensure an upload target stays within the link's folder. */
export function assertUploadRelativeDirAllowed(
  linkRelativeDir: string,
  requestedRelativeDir: string
): void {
  const base = normalizeStoredRelativeDir(linkRelativeDir);
  const req = normalizeStoredRelativeDir(requestedRelativeDir);
  if (!base) return;
  if (req === base) return;
  if (req.startsWith(`${base}/`)) return;
  throw new Error('Upload path is outside this link folder.');
}

function displayPathUnderLink(linkRelativeDir: string, fileRelativePath: string): string {
  const base = normalizeStoredRelativeDir(linkRelativeDir);
  const filePath = fileRelativePath.replace(/^\/+|\/+$/g, '');
  if (!base) return filePath;
  if (filePath === base) {
    return filePath.split('/').pop() ?? filePath;
  }
  if (filePath.startsWith(`${base}/`)) {
    return filePath.slice(base.length + 1);
  }
  return filePath;
}

export async function listExistingFilesForPublicLink(
  link: PublicUploadLinkRow
): Promise<PublicUploadExistingFile[]> {
  const files = await listCompanyFilesRecursive(link.company_id, link.relative_dir || undefined);
  return files.map((f) => ({
    path: displayPathUnderLink(link.relative_dir, f.relativePath),
    displayName: f.displayName ?? f.relativePath.split('/').pop() ?? f.relativePath,
    size: f.size,
    lastModified: f.lastModified,
  }));
}

function rowToLink(row: PublicUploadLinkRow): PublicUploadLinkRow {
  return row;
}

export function folderTitleFromRelativeDir(relativeDir: string): string {
  const trimmed = relativeDir.trim();
  if (!trimmed) return 'Company files';
  return trimmed.split('/').filter(Boolean).pop() ?? 'Folder';
}

export function validatePublicUploadLinkActive(
  link: PublicUploadLinkRow
): { ok: true } | { ok: false; reason: string } {
  if (link.revoked_at) {
    return { ok: false, reason: 'This upload link has been revoked.' };
  }
  if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: 'This upload link has expired.' };
  }
  if (link.max_uploads != null && link.upload_count >= link.max_uploads) {
    return { ok: false, reason: 'This upload link has reached its upload limit.' };
  }
  return { ok: true };
}

export function effectiveMaxBytesForLink(link: PublicUploadLinkRow): number {
  const globalMax = getMaxUploadBytes();
  if (link.max_bytes == null) return globalMax;
  const n = Number(link.max_bytes);
  if (!Number.isFinite(n) || n <= 0) return globalMax;
  return Math.min(n, globalMax);
}

export async function toPublicInfo(link: PublicUploadLinkRow): Promise<PublicUploadLinkPublicInfo> {
  const active = validatePublicUploadLinkActive(link);
  const uploadsRemaining =
    link.max_uploads != null
      ? Math.max(0, link.max_uploads - link.upload_count)
      : null;

  let existingFiles: PublicUploadExistingFile[] = [];
  try {
    existingFiles = await listExistingFilesForPublicLink(link);
  } catch (err) {
    console.error('listExistingFilesForPublicLink:', err);
  }

  return {
    label: link.label,
    folderTitle: folderTitleFromRelativeDir(link.relative_dir),
    relativeDir: link.relative_dir,
    maxBytes: effectiveMaxBytesForLink(link),
    expiresAt: link.expires_at,
    uploadsRemaining: active.ok ? uploadsRemaining : 0,
    uploadCount: link.upload_count,
    existingFiles,
  };
}

export async function createPublicUploadLink(params: {
  companyId: string;
  relativeDir?: string;
  createdByAuthUserId: string;
  label?: string | null;
  maxBytes?: number | null;
  maxUploads?: number | null;
  expiresAt?: Date | null;
}): Promise<PublicUploadLinkRow> {
  const relativeDir = normalizeStoredRelativeDir(params.relativeDir);
  const token = generateToken();
  const label = params.label?.trim().slice(0, 200) || null;

  const r = await authPool.query<PublicUploadLinkRow>(
    `INSERT INTO public.public_upload_links
      (token, company_id, relative_dir, label, created_by_auth_user_id, max_bytes, max_uploads, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      token,
      params.companyId,
      relativeDir,
      label,
      params.createdByAuthUserId,
      params.maxBytes ?? null,
      params.maxUploads ?? null,
      params.expiresAt ?? null,
    ]
  );

  return rowToLink(r.rows[0]);
}

export async function getPublicUploadLinkByToken(token: string): Promise<PublicUploadLinkRow | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const r = await authPool.query<PublicUploadLinkRow>(
    `SELECT * FROM public.public_upload_links WHERE token = $1 LIMIT 1`,
    [trimmed]
  );
  return r.rows[0] ? rowToLink(r.rows[0]) : null;
}

export async function recordPublicUploadSuccess(token: string): Promise<void> {
  await authPool.query(
    `UPDATE public.public_upload_links
     SET upload_count = upload_count + 1,
         last_used_at = now()
     WHERE token = $1`,
    [token.trim()]
  );
}

export async function revokePublicUploadLink(
  token: string,
  companyId: string
): Promise<boolean> {
  const r = await authPool.query(
    `UPDATE public.public_upload_links
     SET revoked_at = now()
     WHERE token = $1 AND company_id = $2 AND revoked_at IS NULL`,
    [token.trim(), companyId]
  );
  return (r.rowCount ?? 0) > 0;
}

export async function listPublicUploadLinksForCompany(
  companyId: string,
  relativeDir?: string
): Promise<PublicUploadLinkRow[]> {
  const dir = normalizeStoredRelativeDir(relativeDir);
  const r = await authPool.query<PublicUploadLinkRow>(
    `SELECT * FROM public.public_upload_links
     WHERE company_id = $1 AND relative_dir = $2 AND revoked_at IS NULL
     ORDER BY created_at DESC
     LIMIT 50`,
    [companyId, dir]
  );
  return r.rows.map(rowToLink);
}
