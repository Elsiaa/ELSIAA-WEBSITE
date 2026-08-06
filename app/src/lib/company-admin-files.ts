import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createRequire } from "node:module";
import { Readable } from "node:stream";
import {
  r2CompanyFilesClient,
  R2_COMPANY_FILES_BUCKET_NAME,
  R2_COMPANY_FILES_PUBLIC_URL,
} from "./r2-company-files";

const require = createRequire(import.meta.url);
// archiver is CJS; Vite SSR rejects `import archiver from 'archiver'`.
const archiver = require("archiver") as typeof import("archiver");

const ROOT = "company-admin-files";

/**
 * Default max upload size (bytes). Override with COMPANY_ADMIN_MAX_UPLOAD_BYTES.
 * Note: your host must accept large request bodies (multipart). Some platforms cap
 * request size much lower than 2 GiB unless you use direct-to-storage uploads.
 */
const DEFAULT_MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GiB

export function getMaxUploadBytes(): number {
  const raw = process.env.COMPANY_ADMIN_MAX_UPLOAD_BYTES;
  if (raw) {
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return DEFAULT_MAX_UPLOAD_BYTES;
}

export function companyFilesRootPrefix(companyId: string): string {
  return `${ROOT}/${companyId}/`;
}

/**
 * Ensure the company’s R2 prefix exists (zero-byte “directory” object).
 * Call when opening file sharing or after creating a company so older companies are backfilled.
 */
export async function ensureCompanyFilesRootExists(companyId: string): Promise<void> {
  const root = companyFilesRootPrefix(companyId);
  const resp = await r2CompanyFilesClient.send(
    new ListObjectsV2Command({
      Bucket: R2_COMPANY_FILES_BUCKET_NAME,
      Prefix: root,
      MaxKeys: 1,
    }),
  );
  if (
    (resp.Contents && resp.Contents.length > 0) ||
    (resp.CommonPrefixes && resp.CommonPrefixes.length > 0)
  ) {
    return;
  }
  if (resp.IsTruncated) {
    return;
  }
  await r2CompanyFilesClient.send(
    new PutObjectCommand({
      Bucket: R2_COMPANY_FILES_BUCKET_NAME,
      Key: root,
      Body: new Uint8Array(0),
      ContentLength: 0,
      ContentType: "application/x-directory",
    }),
  );
}

/**
 * Normalize optional relative path under company root (no .., no absolute).
 */
export function normalizeRelativePrefix(relative: string | undefined | null): string {
  if (!relative || relative.trim() === "") return "";
  const trimmed = relative.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed) return "";
  const segments = trimmed.split("/").filter(Boolean);
  for (const seg of segments) {
    if (seg === ".." || seg === "." || seg.includes("..")) {
      throw new Error("Invalid path");
    }
  }
  return segments.join("/") + "/";
}

export function assertKeyBelongsToCompany(companyId: string, key: string): void {
  const prefix = companyFilesRootPrefix(companyId);
  if (!key.startsWith(prefix) || key.slice(prefix.length).includes("..")) {
    throw new Error("Invalid file key");
  }
}

export function assertPrefixUnderCompany(companyId: string, fullPrefix: string): void {
  const root = companyFilesRootPrefix(companyId);
  if (!fullPrefix.startsWith(root)) {
    throw new Error("Invalid prefix");
  }
  const rest = fullPrefix.slice(root.length);
  if (rest.includes("..")) {
    throw new Error("Invalid prefix");
  }
}

/**
 * Create an empty S3/R2 “folder” (key ending with /) so it appears in delimiter listings.
 */
export async function createCompanyFolder(
  companyId: string,
  parentRelativePath: string | undefined | null,
  folderName: string,
): Promise<{ path: string }> {
  const root = companyFilesRootPrefix(companyId);
  const parentDir = normalizeRelativePrefix(parentRelativePath);
  const trimmed = folderName.trim();
  if (!trimmed) {
    throw new Error("Folder name is required");
  }
  if (/[/\\]/.test(trimmed) || trimmed === "." || trimmed === "..") {
    throw new Error("Folder name cannot be ., .., or contain slashes");
  }
  const sanitized = trimmed.replace(/\s+/g, " ").trim().slice(0, 200);
  if (!sanitized) {
    throw new Error("Invalid folder name");
  }

  const key = `${root}${parentDir}${sanitized}/`;
  assertKeyBelongsToCompany(companyId, key.replace(/\/$/, ""));

  await r2CompanyFilesClient.send(
    new PutObjectCommand({
      Bucket: R2_COMPANY_FILES_BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(0),
      ContentLength: 0,
      ContentType: "application/x-directory",
    }),
  );

  const parentTrim = parentRelativePath?.trim().replace(/\/+$/, "") ?? "";
  const pathOut = parentTrim ? `${parentTrim}/${sanitized}` : sanitized;
  return { path: pathOut };
}

/**
 * File base name as embedded in the object key (and stored in `original-filename` metadata for uploads).
 * Aligned with the admin UI, which shows this — not a separate over-sanitized header.
 */
function sanitizeUploadFileBaseName(basename: string): string {
  const sanitized = basename.replace(/[^a-zA-Z0-9.\-_()\[\]@%+\s]/g, "_").replace(/^\s+|\s+$/g, "");
  return sanitized || "file";
}

/**
 * `File#name` is usually a basename, but some browsers and zip unpack paths supply a rel path
 * (e.g. "Project Folder/report.pdf"). Sanitizing that in one string turns "/" into "___" and
 * the parent folder name (often the company) gets glued into the visible filename. Structure
 * must use `relativeDir` + webkit path only; the key's filename segment is always the last
 * path segment of the client name.
 */
function storageBasenameFromClientFileName(originalName: string): string {
  const t = originalName.replace(/\\/g, "/").trim();
  if (!t) {
    return sanitizeUploadFileBaseName("file");
  }
  const seg = t.split("/").filter(Boolean).pop() || t;
  return sanitizeUploadFileBaseName(seg);
}

function buildObjectKey(companyId: string, relativeDir: string, originalName: string): string {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativeDir);
  const base = storageBasenameFromClientFileName(originalName);
  const timestamp = Date.now();
  return `${root}${dir}${timestamp}-${base}`;
}

/**
 * Presigned PUT so the browser uploads directly to R2 (bypasses app server body limits).
 * Caller must send the same Content-Type and Content-Length on the PUT.
 */
export async function presignCompanyFileUpload(
  companyId: string,
  relativeDir: string | undefined,
  fileName: string,
  contentType: string,
  contentLength: number,
): Promise<{ uploadUrl: string; key: string; expiresInSeconds: number }> {
  const maxBytes = getMaxUploadBytes();
  if (contentLength > maxBytes) {
    throw new Error(`File exceeds maximum size of ${maxBytes} bytes`);
  }
  if (contentLength < 0) {
    throw new Error("Invalid file size");
  }

  const key = buildObjectKey(companyId, relativeDir ?? "", fileName);
  assertKeyBelongsToCompany(companyId, key);

  const ct = contentType && contentType.length > 0 ? contentType : "application/octet-stream";

  // ContentLength is intentionally omitted from the presigned command — including it adds
  // content-length to X-Amz-SignedHeaders, which browsers treat as a forbidden header and
  // never include in CORS preflights, causing R2 to reject the preflight.
  const command = new PutObjectCommand({
    Bucket: R2_COMPANY_FILES_BUCKET_NAME,
    Key: key,
    ContentType: ct,
  });

  const expiresInSeconds = 15 * 60;
  const uploadUrl = await getSignedUrl(r2CompanyFilesClient, command, {
    expiresIn: expiresInSeconds,
  });

  return { uploadUrl, key, expiresInSeconds };
}

export interface CompanyFileListItem {
  key: string;
  /** Path relative to company root (for display / zip entries) */
  relativePath: string;
  /** File name in current folder (for Drive-style UI) */
  displayName?: string;
  size: number | undefined;
  lastModified: string | undefined;
}

export interface BrowseFolder {
  /** Single path segment label */
  name: string;
  /** Path under company root, no leading/trailing slashes (e.g. contracts/2025) */
  path: string;
}

/**
 * List immediate subfolders and files at one "folder" level (S3 delimiter semantics).
 */
export async function listCompanyBrowse(
  companyId: string,
  relativePrefix?: string,
): Promise<{ folders: BrowseFolder[]; files: CompanyFileListItem[] }> {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativePrefix);
  const prefix = `${root}${dir}`;

  const folderMap = new Map<string, BrowseFolder>();
  const fileMap = new Map<string, CompanyFileListItem>();
  let continuationToken: string | undefined;

  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: prefix,
        Delimiter: "/",
        ContinuationToken: continuationToken,
      }),
    );

    for (const cp of resp.CommonPrefixes ?? []) {
      if (!cp.Prefix || !cp.Prefix.startsWith(root)) continue;
      const rel = cp.Prefix.slice(root.length).replace(/\/+$/, "");
      if (!rel) continue;
      const name = rel.split("/").filter(Boolean).pop() ?? rel;
      folderMap.set(rel, { name, path: rel });
    }

    for (const obj of resp.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      const tail = obj.Key.slice(prefix.length);
      if (!tail || tail.includes("/")) continue;
      const cleanName = stripTimestampPrefix(tail);
      fileMap.set(obj.Key, {
        key: obj.Key,
        relativePath: obj.Key.slice(root.length),
        displayName: cleanName,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
      });
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  const folders = [...folderMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const files = [...fileMap.values()].sort((a, b) =>
    (a.displayName ?? "").localeCompare(b.displayName ?? ""),
  );
  return { folders, files };
}

/** Flat list (all descendants) — retained for scripts or future use */
export async function listCompanyFiles(
  companyId: string,
  relativePrefix?: string,
): Promise<CompanyFileListItem[]> {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativePrefix);
  const prefix = `${root}${dir}`;

  const items: CompanyFileListItem[] = [];
  let continuationToken: string | undefined;

  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of resp.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      const rel = obj.Key.slice(root.length);
      const rawName = rel.includes("/") ? rel.split("/").pop()! : rel;
      const displayName = stripTimestampPrefix(rawName);
      items.push({
        key: obj.Key,
        relativePath: rel,
        displayName,
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
      });
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  items.sort((a, b) => (a.relativePath < b.relativePath ? -1 : 1));
  return items;
}

/**
 * True if any non-folder-marker object exists under this path (including nested subfolders).
 */
export async function companyHasFilesUnderRelativePrefix(
  companyId: string,
  relativePrefix?: string | null,
): Promise<boolean> {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativePrefix);
  const fullPrefix = `${root}${dir}`;
  assertPrefixUnderCompany(companyId, fullPrefix);

  let continuationToken: string | undefined;
  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: fullPrefix,
        MaxKeys: 500,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents ?? []) {
      if (obj.Key && !obj.Key.endsWith("/")) {
        return true;
      }
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return false;
}

async function listAllKeysWithPrefix(fullPrefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents ?? []) {
      if (obj.Key && !obj.Key.endsWith("/")) keys.push(obj.Key);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

/** All object keys under prefix (includes zero-byte “folder/” markers). */
async function listEveryObjectKeyUnderPrefix(fullPrefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

/**
 * Delete every object under a folder path (relative to company root), including nested files and folder markers.
 */
export async function deleteCompanyFolderRecursive(
  companyId: string,
  relativePath: string,
): Promise<{ deleted: number }> {
  const trimmed = relativePath.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) {
    throw new Error("Cannot delete the company root folder");
  }

  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(trimmed);
  const fullPrefix = `${root}${dir}`;
  assertPrefixUnderCompany(companyId, fullPrefix);

  const keys = await listEveryObjectKeyUnderPrefix(fullPrefix);
  if (keys.length === 0) {
    return { deleted: 0 };
  }

  for (const key of keys) {
    await deleteCompanyFile(companyId, key);
  }
  return { deleted: keys.length };
}

export async function uploadCompanyFile(
  companyId: string,
  file: File,
  relativeDir?: string,
): Promise<CompanyFileListItem> {
  const maxBytes = getMaxUploadBytes();
  if (file.size > maxBytes) {
    throw new Error(`File exceeds maximum size of ${maxBytes} bytes`);
  }

  const key = buildObjectKey(companyId, relativeDir ?? "", file.name);
  assertKeyBelongsToCompany(companyId, key);

  const contentType = file.type && file.type.length > 0 ? file.type : "application/octet-stream";

  const metaName = storageBasenameFromClientFileName(file.name).slice(0, 200);

  if (file.size <= 5 * 1024 * 1024) {
    const buf = Buffer.from(await file.arrayBuffer());
    await r2CompanyFilesClient.send(
      new PutObjectCommand({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Key: key,
        Body: buf,
        ContentType: contentType,
        ContentLength: buf.length,
        Metadata: { "original-filename": metaName },
      }),
    );
  } else {
    const webStream = file.stream();
    const nodeStream = Readable.fromWeb(webStream as import("stream/web").ReadableStream);
    const upload = new Upload({
      client: r2CompanyFilesClient,
      queueSize: 4,
      partSize: 8 * 1024 * 1024,
      params: {
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Key: key,
        Body: nodeStream,
        ContentType: contentType,
        ContentLength: file.size,
        Metadata: { "original-filename": metaName },
      },
    });
    await upload.done();
  }

  const root = companyFilesRootPrefix(companyId);
  const relativePath = key.slice(root.length);
  return {
    key,
    relativePath,
    displayName: companyFileDisplayBasenameFromObjectKey(key),
    size: file.size,
    lastModified: new Date().toISOString(),
  };
}

export async function deleteCompanyFile(companyId: string, key: string): Promise<void> {
  assertKeyBelongsToCompany(companyId, key);
  await r2CompanyFilesClient.send(
    new DeleteObjectCommand({
      Bucket: R2_COMPANY_FILES_BUCKET_NAME,
      Key: key,
    }),
  );
}

/** `bucket/key` with each key segment URL-encoded for CopySource. */
function s3CopySourceValue(bucket: string, objectKey: string): string {
  return `${bucket}/${objectKey.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * Move a file to another folder under the same company (server-side copy + delete).
 * Object name segment (e.g. `1739…-report.pdf`) is preserved.
 */
export async function moveCompanyFile(
  companyId: string,
  sourceKey: string,
  destinationRelativePrefix: string | undefined | null,
): Promise<{ key: string }> {
  assertKeyBelongsToCompany(companyId, sourceKey);
  if (sourceKey.endsWith("/")) {
    throw new Error("Only files can be moved");
  }

  const root = companyFilesRootPrefix(companyId);
  const sourceRelative = sourceKey.slice(root.length);
  const sourceParent = sourceRelative.includes("/")
    ? sourceRelative.slice(0, sourceRelative.lastIndexOf("/"))
    : "";

  const destDir = normalizeRelativePrefix(destinationRelativePrefix);
  const destParentPath = destDir.replace(/\/+$/, "");

  if (sourceParent === destParentPath) {
    return { key: sourceKey };
  }

  const tail = sourceKey.slice(sourceKey.lastIndexOf("/") + 1);
  if (!tail) {
    throw new Error("Invalid source key");
  }

  const destKey = `${root}${destDir}${tail}`;
  assertKeyBelongsToCompany(companyId, destKey);

  if (sourceKey === destKey) {
    return { key: sourceKey };
  }

  const bucket = R2_COMPANY_FILES_BUCKET_NAME;
  await r2CompanyFilesClient.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: destKey,
      CopySource: s3CopySourceValue(bucket, sourceKey),
      MetadataDirective: "COPY",
    }),
  );

  await deleteCompanyFile(companyId, sourceKey);
  return { key: destKey };
}

export async function getCompanyFileForDownload(companyId: string, key: string) {
  assertKeyBelongsToCompany(companyId, key);
  const resp = await r2CompanyFilesClient.send(
    new GetObjectCommand({
      Bucket: R2_COMPANY_FILES_BUCKET_NAME,
      Key: key,
    }),
  );
  return resp;
}

export async function presignCompanyFileDownload(
  companyId: string,
  key: string,
  expiresInSeconds: number,
): Promise<string> {
  assertKeyBelongsToCompany(companyId, key);
  const clamped = Math.min(Math.max(expiresInSeconds, 60), 60 * 60 * 24 * 7); // 1 min .. 7 days
  const command = new GetObjectCommand({
    Bucket: R2_COMPANY_FILES_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(r2CompanyFilesClient, command, { expiresIn: clamped });
}

/**
 * Permanent public read URL when the bucket is exposed on a custom host (e.g. Cloudflare R2 public access).
 * Set R2_COMPANY_FILES_PUBLIC_URL (e.g. https://files.elsiaa.com).
 */
export function buildCompanyFilePublicReadUrl(objectKey: string): string | null {
  const base = R2_COMPANY_FILES_PUBLIC_URL.trim().replace(/\/+$/, "");
  if (!base) return null;
  const path = objectKey.split("/").map(encodeURIComponent).join("/");
  return `${base}/${path}`;
}

/**
 * Strip the leading timestamp from a filename segment (e.g. "1711234567890-report.pdf" → "report.pdf").
 */
function stripTimestampPrefix(name: string): string {
  const dash = name.indexOf("-");
  if (dash > 0 && /^\d+$/.test(name.slice(0, dash))) {
    return name.slice(dash + 1) || name;
  }
  return name;
}

/**
 * User-facing name for a stored object: same rule as the admin file list and ZIP/presigned downloads.
 * Uses the S3 key’s last segment (the stored filename), not `original-filename` metadata — that field
 * used to be over-sanitized with `\\w` and no longer match the key or the UI.
 */
export function companyFileDisplayBasenameFromObjectKey(key: string): string {
  const part = key.split("/").pop() || "file";
  return stripTimestampPrefix(part);
}

/** All files under a folder prefix (recursive), relative to company root. */
export async function listCompanyFilesRecursive(
  companyId: string,
  relativePrefix?: string,
): Promise<CompanyFileListItem[]> {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativePrefix);
  const fullPrefix = `${root}${dir}`;
  assertPrefixUnderCompany(companyId, fullPrefix);

  const items: CompanyFileListItem[] = [];
  let continuationToken: string | undefined;

  do {
    const resp = await r2CompanyFilesClient.send(
      new ListObjectsV2Command({
        Bucket: R2_COMPANY_FILES_BUCKET_NAME,
        Prefix: fullPrefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of resp.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith("/")) continue;
      items.push({
        key: obj.Key,
        relativePath: obj.Key.slice(root.length),
        displayName: companyFileDisplayBasenameFromObjectKey(obj.Key),
        size: obj.Size,
        lastModified: obj.LastModified?.toISOString(),
      });
    }
    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  items.sort((a, b) => (a.relativePath < b.relativePath ? -1 : 1));
  return items;
}

/**
 * Node Readable stream of a zip of all objects under the company prefix (optionally narrowed by relativePrefix).
 * Throws if there are no objects under the prefix.
 */
export async function createCompanyFilesZipReadable(
  companyId: string,
  relativePrefix?: string,
): Promise<Readable> {
  const root = companyFilesRootPrefix(companyId);
  const dir = normalizeRelativePrefix(relativePrefix);
  const fullPrefix = `${root}${dir}`;
  assertPrefixUnderCompany(companyId, fullPrefix);

  const keys = await listAllKeysWithPrefix(fullPrefix);
  if (keys.length === 0) {
    throw new Error("This folder is empty — there are no files to zip.");
  }

  const archive = archiver("zip", { zlib: { level: 1 } });

  void (async () => {
    try {
      const CONCURRENCY = 20;
      for (let i = 0; i < keys.length; i += CONCURRENCY) {
        const batch = keys.slice(i, i + CONCURRENCY);

        const gets = await Promise.all(
          batch.map(async (key) => {
            const get = await r2CompanyFilesClient.send(
              new GetObjectCommand({
                Bucket: R2_COMPANY_FILES_BUCKET_NAME,
                Key: key,
              }),
            );
            return { key, body: get.Body };
          }),
        );

        for (const { key, body } of gets) {
          if (!body) continue;
          const rawPath = key.slice(fullPrefix.length) || key.split("/").pop() || "file";
          const lastSlash = rawPath.lastIndexOf("/");
          const pathFromKey = lastSlash === -1 ? "" : rawPath.slice(0, lastSlash);
          const keyFileSegment = lastSlash === -1 ? rawPath : rawPath.slice(lastSlash + 1);
          const baseName = stripTimestampPrefix(keyFileSegment);
          const entryName = pathFromKey ? `${pathFromKey}/${baseName}` : baseName;
          archive.append(body as Readable, { name: entryName });
        }
      }
      await archive.finalize();
    } catch (err) {
      archive.destroy(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return archive;
}

/** Convert Node Readable to Web ReadableStream for NextResponse.body */
export function nodeStreamToWeb(stream: Readable): ReadableStream<Uint8Array> {
  return Readable.toWeb(stream) as ReadableStream<Uint8Array>;
}
