"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  Copy,
  Download,
  File,
  Folder,
  FolderArchive,
  FolderPlus,
  GripVertical,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { getProxyUploadMaxBytes } from "@/lib/company-files-upload-constants";
import { readApiJsonResponse } from "@/lib/read-api-json";
import { cn } from "@/components/ui/utils";
import { getFilesFromDataTransfer } from "@/lib/company-file-upload-folders";
import type { Company, User } from "@/types/company";

interface BrowseFolder {
  name: string;
  path: string;
}

interface CompanyFileListItem {
  key: string;
  relativePath: string;
  displayName?: string;
  size: number | undefined;
  lastModified: string | undefined;
}

function formatBytes(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Same-origin POST with upload progress (cookies sent for Clerk). */
function xhrPostFormData(
  url: string,
  form: FormData,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        try {
          const j = JSON.parse(xhr.responseText) as { error?: string };
          reject(new Error(j.error || xhr.statusText || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(xhr.statusText || `Upload failed (${xhr.status})`));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.send(form);
  });
}

/** Presigned PUT to R2 with progress. */
function xhrPutFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onload = () => {
      onProgress(100);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            xhr.responseText?.slice(0, 200) ||
              `Direct upload failed (${xhr.status}). Check R2 CORS for PUT from this origin.`,
          ),
        );
      }
    };
    xhr.onerror = () =>
      reject(
        Object.assign(
          new Error(
            "Network error uploading to R2. If this persists, the bucket CORS policy may need " +
              "AllowedMethods: PUT and AllowedHeaders: * for your site origin.",
          ),
          { isCorsLikelyError: true },
        ),
      );
    xhr.send(file);
  });
}

interface ActiveUploadRow {
  id: string;
  fileName: string;
  size: number;
  progress: number;
  error?: string;
}

/**
 * Map browser-reported MIME types to a small set of broadly-allowed types for the R2 presigned
 * PUT. This avoids CORS preflight failures when a bucket policy doesn't enumerate every exotic
 * MIME type (e.g. application/x-msdownload for .exe, application/x-msi, etc.).
 * The normalised type is stored in R2 metadata; the actual file bytes are unchanged.
 */
function normalizeContentTypeForUpload(browserType: string | undefined): string {
  const t = browserType?.trim() ?? "";
  if (!t) return "application/octet-stream";
  // Keep well-known text, image, audio, video, and document types as-is.
  if (
    t.startsWith("image/") ||
    t.startsWith("audio/") ||
    t.startsWith("video/") ||
    t.startsWith("text/") ||
    t === "application/pdf" ||
    t === "application/json" ||
    t === "application/zip" ||
    t === "application/gzip" ||
    t === "application/x-tar" ||
    t === "application/vnd.ms-excel" ||
    t === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    t === "application/vnd.ms-powerpoint" ||
    t === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    t === "application/msword" ||
    t === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return t;
  }
  return "application/octet-stream";
}

/** Custom data type so OS file drags are not confused with in-app file moves. */
const FILE_DRAG_TYPE = "application/x-vercatryx-company-file-key";

function parentPrefixFromRelativePath(relativePath: string): string {
  const t = relativePath.trim();
  if (!t.includes("/")) return "";
  return t.slice(0, t.lastIndexOf("/"));
}

/** Match server `storageBasenameFromClientFileName` — `File#name` can be a rel path in some cases. */
function fileBasenameForUpload(name: string): string {
  const t = name.replace(/\\/g, "/").trim();
  if (!t) return "file";
  return t.split("/").filter(Boolean).pop() || t;
}

function hasOsFilePayload(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes("Files");
}

function hasInternalFilePayload(e: React.DragEvent): boolean {
  return e.dataTransfer.types.includes(FILE_DRAG_TYPE);
}

function readInternalFileKey(e: React.DragEvent): string {
  return (
    e.dataTransfer.getData(FILE_DRAG_TYPE) ||
    e.dataTransfer.getData("text/plain") ||
    ""
  ).trim();
}

function buildBreadcrumbs(folderPath: string): { label: string; path: string }[] {
  const root = { label: "Company files", path: "" };
  if (!folderPath.trim()) return [root];
  const segments = folderPath.split("/").filter(Boolean);
  const crumbs = [root];
  segments.forEach((_, i) => {
    const path = segments.slice(0, i + 1).join("/");
    crumbs.push({ label: segments[i], path });
  });
  return crumbs;
}

const CRUMB_ALL_COMPANIES = "__all__";
const CRUMB_COMPANY_ROOT = "__co_root__";

function buildFileBreadcrumbs(
  multiCompanyPicker: boolean,
  selectedCompanyId: string,
  companies: Company[],
  folderPath: string,
): { label: string; path: string }[] {
  if (multiCompanyPicker && !selectedCompanyId) {
    return [{ label: "All companies", path: CRUMB_ALL_COMPANIES }];
  }
  if (multiCompanyPicker && selectedCompanyId) {
    const name = companies.find((c) => c.id === selectedCompanyId)?.name ?? "Company";
    const out: { label: string; path: string }[] = [
      { label: "All companies", path: CRUMB_ALL_COMPANIES },
      { label: name, path: CRUMB_COMPANY_ROOT },
    ];
    if (folderPath.trim()) {
      const segments = folderPath.split("/").filter(Boolean);
      segments.forEach((seg, i) => {
        out.push({ label: seg, path: segments.slice(0, i + 1).join("/") });
      });
    }
    return out;
  }
  return buildBreadcrumbs(folderPath);
}

/** `null` = not a valid drop target for moving a file (e.g. “All companies”). */
function moveTargetFromCrumbPath(crumbPath: string): string | null {
  if (crumbPath === CRUMB_ALL_COMPANIES) return null;
  if (crumbPath === CRUMB_COMPANY_ROOT) return "";
  return crumbPath;
}

interface CompanyFileStorageProps {
  companies: Company[];
  currentUser: User | null;
  isSuperAdmin: boolean;
  /** When true, use multi-company picker and send `companyId` on API calls (support agents with files-enabled companies). */
  supportAgentCompanyFiles?: boolean;
}

export default function CompanyFileStorage({
  companies,
  currentUser,
  isSuperAdmin,
  supportAgentCompanyFiles = false,
}: CompanyFileStorageProps) {
  const passCompanyIdToApi = isSuperAdmin || supportAgentCompanyFiles;
  const multiCompanyPicker = isSuperAdmin || supportAgentCompanyFiles;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    multiCompanyPicker ? "" : (currentUser?.company_id ?? ""),
  );
  /** Path under company root, no leading slash (e.g. contracts/2025) */
  const [folderPath, setFolderPath] = useState("");
  const [folders, setFolders] = useState<BrowseFolder[]>([]);
  const [files, setFiles] = useState<CompanyFileListItem[]>([]);
  const [listRefreshing, setListRefreshing] = useState(false);
  /** In-flight / failed upload rows shown above the file list */
  const [activeUploads, setActiveUploads] = useState<ActiveUploadRow[]>([]);
  /** Batch upload summary */
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    completed: number;
    failed: number;
    active: boolean;
  } | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [deletingFolderPath, setDeletingFolderPath] = useState<string | null>(null);
  /** e.g. `cdn:key`, `site:key`, `site-folder:path` for share copy buttons */
  const [shareBusy, setShareBusy] = useState<string | null>(null);
  const [zipping, setZipping] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [uploadLinkOpen, setUploadLinkOpen] = useState(false);
  const [uploadLinkBusy, setUploadLinkBusy] = useState(false);
  const [uploadLinkLabel, setUploadLinkLabel] = useState("");
  const [uploadLinkExpiresInDays, setUploadLinkExpiresInDays] = useState<string>("30");
  const [uploadLinkMaxUploads, setUploadLinkMaxUploads] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  /** Breadcrumb path or folder row path receiving a file move hover (`""` = root). */
  const [moveDragOverDest, setMoveDragOverDest] = useState<string | null>(null);
  const [draggingFileKey, setDraggingFileKey] = useState<string | null>(null);
  const [movingKey, setMovingKey] = useState<string | null>(null);
  const dragDepthRef = useRef(0);
  const uploadBusyRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const effectiveCompanyId = multiCompanyPicker
    ? selectedCompanyId
    : (currentUser?.company_id ?? "");

  /** Refresh list without clearing rows (no “Opening folder” spinner). */
  const refreshBrowseSilent = useCallback(async () => {
    if (!effectiveCompanyId) return;
    try {
      const params = new URLSearchParams();
      if (passCompanyIdToApi && effectiveCompanyId) params.set("companyId", effectiveCompanyId);
      if (folderPath.trim()) params.set("prefix", folderPath.trim());
      const url = params.toString()
        ? `/api/admin/company-files?${params}`
        : "/api/admin/company-files";
      const res = await fetch(url, { cache: "no-store" });
      const data = await readApiJsonResponse<{
        folders?: unknown;
        files?: unknown;
        error?: string;
      }>(res);
      if (!res.ok) {
        throw new Error(data.error || "Failed to load files");
      }
      setFolders(Array.isArray(data.folders) ? data.folders : []);
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load files");
    }
  }, [effectiveCompanyId, folderPath, passCompanyIdToApi]);

  useEffect(() => {
    const clearMoveDragUi = () => {
      setMoveDragOverDest(null);
      setDraggingFileKey(null);
    };
    window.addEventListener("dragend", clearMoveDragUi);
    return () => window.removeEventListener("dragend", clearMoveDragUi);
  }, []);

  const performMove = useCallback(
    async (sourceKey: string, destinationPrefix: string) => {
      if (!effectiveCompanyId) return;
      const item = files.find((x) => x.key === sourceKey);
      const parent = item ? parentPrefixFromRelativePath(item.relativePath) : "";
      const dest = destinationPrefix.trim();
      if (parent === dest) {
        toast.info("Already in that folder");
        return;
      }
      setMovingKey(sourceKey);
      try {
        const res = await fetch("/api/admin/company-files/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
            key: sourceKey,
            destinationPrefix: dest,
          }),
        });
        const data = await readApiJsonResponse<{ error?: string }>(res);
        if (!res.ok) throw new Error(data.error || "Move failed");
        toast.success("Moved");
        await refreshBrowseSilent();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Move failed");
      } finally {
        setMovingKey(null);
        setMoveDragOverDest(null);
        setDraggingFileKey(null);
      }
    },
    [effectiveCompanyId, files, passCompanyIdToApi, refreshBrowseSilent],
  );

  useEffect(() => {
    setFolderPath("");
  }, [effectiveCompanyId]);

  useEffect(() => {
    if (!effectiveCompanyId) {
      setFolders([]);
      setFiles([]);
      return;
    }

    const ac = new AbortController();
    setFolders([]);
    setFiles([]);
    setListRefreshing(true);

    const params = new URLSearchParams();
    if (passCompanyIdToApi && effectiveCompanyId) params.set("companyId", effectiveCompanyId);
    if (folderPath.trim()) params.set("prefix", folderPath.trim());
    const url = params.toString()
      ? `/api/admin/company-files?${params}`
      : "/api/admin/company-files";

    void fetch(url, { cache: "no-store", signal: ac.signal })
      .then(async (res) => {
        const data = await readApiJsonResponse<{
          folders?: unknown;
          files?: unknown;
          error?: string;
        }>(res);
        if (!res.ok) {
          throw new Error(data.error || "Failed to load files");
        }
        setFolders(Array.isArray(data.folders) ? data.folders : []);
        setFiles(Array.isArray(data.files) ? data.files : []);
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === "AbortError") return;
        toast.error(e instanceof Error ? e.message : "Failed to load files");
        setFolders([]);
        setFiles([]);
      })
      .finally(() => {
        if (!ac.signal.aborted) {
          setListRefreshing(false);
        }
      });

    return () => ac.abort();
  }, [effectiveCompanyId, folderPath, passCompanyIdToApi]);

  const onPickFile = () => fileInputRef.current?.click();

  /** Same-origin multipart upload (fine under ~few MiB; Vercel caps ~4.5 MiB). */
  const postFileUploadViaApp = useCallback(
    async (file: File, relativeDir: string, onProgress: (pct: number) => void): Promise<void> => {
      const form = new FormData();
      form.append("file", file);
      if (relativeDir) {
        form.append("relativeDir", relativeDir);
      }
      if (passCompanyIdToApi) {
        form.append("companyId", effectiveCompanyId);
      }
      onProgress(0);
      await xhrPostFormData("/api/admin/company-files", form, onProgress);
    },
    [passCompanyIdToApi, effectiveCompanyId],
  );

  /** Browser → R2 presigned PUT (no large body through Next.js / Vercel). */
  const postFileUploadDirectToR2 = useCallback(
    async (file: File, relativeDir: string, onProgress: (pct: number) => void): Promise<void> => {
      // Normalize to broadly-accepted types to avoid CORS preflight failures on unusual MIME
      // types (e.g. application/x-msdownload for .exe). Content is unaffected.
      const contentType = normalizeContentTypeForUpload(file.type);
      onProgress(1);
      const presignRes = await fetch("/api/admin/company-files/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
          fileName: fileBasenameForUpload(file.name),
          contentType,
          contentLength: file.size,
          relativeDir: relativeDir || undefined,
        }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) {
        throw new Error(presignData.error || `Presign failed for “${file.name}”`);
      }
      const uploadUrl = presignData.uploadUrl as string | undefined;
      if (!uploadUrl) {
        throw new Error("No upload URL returned");
      }
      onProgress(5);
      await xhrPutFile(uploadUrl, file, contentType, (p) => {
        onProgress(5 + Math.round((p / 100) * 95));
      });
    },
    [passCompanyIdToApi, effectiveCompanyId],
  );

  const postFileUpload = useCallback(
    async (file: File, relativeDir: string, onProgress: (pct: number) => void): Promise<void> => {
      const maxProxy = getProxyUploadMaxBytes();
      if (file.size > maxProxy) {
        await postFileUploadDirectToR2(file, relativeDir, onProgress);
      } else {
        try {
          await postFileUploadViaApp(file, relativeDir, onProgress);
        } catch (proxyErr) {
          // If the proxy path failed and the file would fit, try presigned PUT as a fallback.
          // This path is unlikely but covers edge cases (e.g. Vercel body size edge).
          try {
            await postFileUploadDirectToR2(file, relativeDir, onProgress);
          } catch {
            throw proxyErr;
          }
        }
      }
    },
    [postFileUploadViaApp, postFileUploadDirectToR2],
  );

  const dismissUploadRow = useCallback((id: string) => {
    setActiveUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const uploadFileList = useCallback(
    async (items: FileList | File[] | Array<{ file: File; relativePath?: string }>) => {
      const list = items instanceof FileList ? Array.from(items) : items;
      if (list.length === 0) return;
      if (!effectiveCompanyId) {
        toast.error("Open a company folder first.");
        return;
      }
      if (uploadBusyRef.current) {
        toast.info("Finish the current upload batch first.");
        return;
      }
      uploadBusyRef.current = true;

      try {
        const CONCURRENCY_LIMIT = 20;
        let ok = 0;
        let failed = 0;
        let lastError = "";

        // 1. Prepare all items and their paths
        const preparedItems = list.map((item) => {
          const file = "file" in item && !(item instanceof File) ? item.file : (item as File);
          const customRelativePath =
            "relativePath" in item && !(item instanceof File) ? item.relativePath : undefined;

          let fileRelativeDir = folderPath.trim();
          if (customRelativePath) {
            const parts = customRelativePath.split("/");
            if (parts.length > 1) {
              const subDir = parts.slice(0, -1).join("/");
              fileRelativeDir = fileRelativeDir ? `${fileRelativeDir}/${subDir}` : subDir;
            }
          } else if ("webkitRelativePath" in file && file.webkitRelativePath) {
            const parts = file.webkitRelativePath.split("/");
            if (parts.length > 1) {
              const subDir = parts.slice(0, -1).join("/");
              fileRelativeDir = fileRelativeDir ? `${fileRelativeDir}/${subDir}` : subDir;
            }
          }

          const id =
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `up-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          return { id, file, fileRelativeDir };
        });

        setBatchProgress({
          total: preparedItems.length,
          completed: 0,
          failed: 0,
          active: true,
        });

        // Don't show individual file rows for batch uploads -- the global bar is enough

        // 2. Fetch presigned URLs in batches of 1000 to avoid request size limits
        const BATCH_SIZE = 1000;
        const uploadUrls = new Map<string, string>();

        for (let i = 0; i < preparedItems.length; i += BATCH_SIZE) {
          const batch = preparedItems.slice(i, i + BATCH_SIZE);

          const reqBody = {
            ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
            files: batch.map((item) => ({
              id: item.id,
              fileName: fileBasenameForUpload(item.file.name),
              contentType: normalizeContentTypeForUpload(item.file.type),
              contentLength: item.file.size,
              relativeDir: item.fileRelativeDir || undefined,
            })),
          };

          try {
            const presignRes = await fetch("/api/admin/company-files/presign-batch", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(reqBody),
            });
            const presignData = await presignRes.json().catch(() => ({}));

            if (!presignRes.ok) throw new Error(presignData.error || "Batch presign failed");

            for (const result of presignData.results || []) {
              if (result.error) {
                failed++;
                setBatchProgress((p) => (p ? { ...p, failed: p.failed + 1 } : p));
              } else if (result.uploadUrl) {
                uploadUrls.set(result.id, result.uploadUrl);
              }
            }
          } catch (err) {
            for (const item of batch) {
              failed++;
              setBatchProgress((p) => (p ? { ...p, failed: p.failed + 1 } : p));
            }
          }
        }

        // 3. Upload files concurrently
        let currentIndex = 0;
        const worker = async () => {
          while (currentIndex < preparedItems.length) {
            const index = currentIndex++;
            const item = preparedItems[index];
            const url = uploadUrls.get(item.id);

            if (!url) continue; // Failed presign

            try {
              const contentType = normalizeContentTypeForUpload(item.file.type);

              const maxProxy = getProxyUploadMaxBytes();
              if (item.file.size <= maxProxy) {
                await postFileUploadViaApp(item.file, item.fileRelativeDir, () => {});
              } else {
                await xhrPutFile(url, item.file, contentType, () => {});
              }

              ok++;
              setBatchProgress((p) => (p ? { ...p, completed: p.completed + 1 } : p));
            } catch (e) {
              failed++;
              setBatchProgress((p) => (p ? { ...p, failed: p.failed + 1 } : p));
              lastError = e instanceof Error ? e.message : "Upload failed";
            }
          }
        };

        const workers = [];
        for (let i = 0; i < Math.min(CONCURRENCY_LIMIT, preparedItems.length); i++) {
          workers.push(worker());
        }
        await Promise.all(workers);

        setBatchProgress(null);

        if (ok > 0) {
          toast.success(
            failed > 0
              ? `Uploaded ${ok} file(s); ${failed} failed${lastError ? `: ${lastError}` : ""}`
              : ok === 1
                ? "File uploaded"
                : `Uploaded ${ok} files`,
          );
        } else if (failed > 0) {
          toast.error(lastError || "Upload failed");
        }
        if (ok > 0) {
          await refreshBrowseSilent();
        }
      } catch {
        /* per-file errors handled above */
      } finally {
        uploadBusyRef.current = false;
      }
    },
    [effectiveCompanyId, folderPath, postFileUpload, refreshBrowseSilent],
  );

  const uploadBusy = activeUploads.some((u) => !u.error);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    // Copy files before clearing input — `FileList` is live and empties when value is reset.
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) return;
    await uploadFileList(files);
  };

  const createFolder = async () => {
    if (!effectiveCompanyId || !newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/admin/company-files/folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
          parentPrefix: folderPath.trim(),
          name: newFolderName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Could not create folder");
      }
      toast.success("Folder created");
      setNewFolderOpen(false);
      setNewFolderName("");
      if (data.path && typeof data.path === "string") {
        setFolderPath(data.path);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasOsFilePayload(e)) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasOsFilePayload(e)) return;
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasOsFilePayload(e)) {
      e.dataTransfer.dropEffect = "copy";
    } else if (hasInternalFilePayload(e)) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    setMoveDragOverDest(null);
    if (!effectiveCompanyId) return;

    if (hasInternalFilePayload(e)) {
      const key = readInternalFileKey(e);
      if (key) await performMove(key, folderPath);
      return;
    }

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const items = await getFilesFromDataTransfer(e.dataTransfer.items);
      if (!items.length) return;
      await uploadFileList(items);
    } else {
      const { files: dtFiles } = e.dataTransfer;
      if (!dtFiles?.length) return;
      await uploadFileList(dtFiles);
    }
  };

  const downloadHref = (key: string) => {
    const params = new URLSearchParams();
    params.set("key", key);
    if (passCompanyIdToApi && effectiveCompanyId) params.set("companyId", effectiveCompanyId);
    return `/api/admin/company-files/download?${params.toString()}`;
  };

  const postShareLink = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/company-files/share-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
        ...body,
      }),
    });
    const data = await readApiJsonResponse<{
      error?: string;
      publicUrl?: string | null;
      siteShareUrl?: string | null;
      hasFiles?: boolean;
      hint?: string;
    }>(res);
    if (!res.ok) {
      throw new Error(data.error || "Could not create link");
    }
    return data as {
      publicUrl?: string | null;
      siteShareUrl?: string | null;
      hasFiles?: boolean;
      hint?: string;
    };
  };

  const copyFileLink = async (key: string) => {
    setShareBusy(`link:${key}`);
    try {
      const data = await postShareLink({ key });
      if (!data.publicUrl) {
        toast.error(
          data.hint ||
            "Set R2_COMPANY_FILES_PUBLIC_URL (e.g. https://files.elsiaa.com) on the server to copy a CDN link.",
        );
        return;
      }
      await navigator.clipboard.writeText(data.publicUrl);
      toast.success("Link copied");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setShareBusy(null);
    }
  };

  const copyFolderLink = async (path: string) => {
    setShareBusy(`link-folder:${path}`);
    try {
      const data = await postShareLink({ folderPrefix: path });
      if (!data.siteShareUrl) {
        throw new Error("No link returned");
      }
      await navigator.clipboard.writeText(data.siteShareUrl);
      if (data.hasFiles === false) {
        toast.success("Link copied", {
          description:
            "This folder is empty — the shared page will explain that there is nothing to ZIP yet.",
        });
      } else {
        toast.success("Link copied");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setShareBusy(null);
    }
  };

  const createUploadLink = async () => {
    if (!effectiveCompanyId) {
      toast.error("Open a company folder first.");
      return;
    }
    setUploadLinkBusy(true);
    try {
      const expiresRaw = uploadLinkExpiresInDays.trim();
      const expiresInDays =
        expiresRaw === "" || expiresRaw === "never" ? null : Number.parseInt(expiresRaw, 10);
      if (expiresInDays != null && (!Number.isFinite(expiresInDays) || expiresInDays < 1)) {
        throw new Error("Expiry must be a positive number of days or “Never”.");
      }

      const maxRaw = uploadLinkMaxUploads.trim();
      const maxUploads = maxRaw === "" ? null : Number.parseInt(maxRaw, 10);
      if (maxUploads != null && (!Number.isFinite(maxUploads) || maxUploads < 1)) {
        throw new Error("Max uploads must be a positive integer or left blank for unlimited.");
      }

      const res = await fetch("/api/admin/company-files/upload-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(passCompanyIdToApi ? { companyId: effectiveCompanyId } : {}),
          folderPrefix: folderPath.trim(),
          label: uploadLinkLabel.trim() || undefined,
          expiresInDays,
          maxUploads,
        }),
      });
      const data = await readApiJsonResponse<{ error?: string; uploadUrl?: string }>(res);
      if (!res.ok || !data.uploadUrl) {
        throw new Error(data.error || "Could not create upload link");
      }
      await navigator.clipboard.writeText(data.uploadUrl);
      toast.success("Upload link copied", {
        description: "Anyone with this link can upload files to this folder without signing in.",
      });
      setUploadLinkOpen(false);
      setUploadLinkLabel("");
      setUploadLinkExpiresInDays("30");
      setUploadLinkMaxUploads("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create upload link");
    } finally {
      setUploadLinkBusy(false);
    }
  };

  const deleteFile = async (key: string) => {
    if (!confirm("Delete this file permanently?")) return;
    setDeletingKey(key);
    try {
      const params = new URLSearchParams();
      params.set("key", key);
      if (passCompanyIdToApi && effectiveCompanyId) params.set("companyId", effectiveCompanyId);
      const res = await fetch(`/api/admin/company-files?${params}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Delete failed");
      }
      toast.success("File deleted");
      await refreshBrowseSilent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingKey(null);
    }
  };

  const downloadZipForPrefix = useCallback(
    async (prefix: string) => {
      if (!effectiveCompanyId) return;
      setZipping(true);
      try {
        const params = new URLSearchParams();
        if (passCompanyIdToApi) params.set("companyId", effectiveCompanyId);
        if (prefix.trim()) params.set("prefix", prefix.trim());
        const url = `/api/admin/company-files/zip?${params.toString()}`;
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) {
          const data = await readApiJsonResponse<{ error?: string }>(res);
          throw new Error(typeof data.error === "string" ? data.error : "Zip download failed");
        }
        const blob = await res.blob();
        const dispo = res.headers.get("Content-Disposition");
        let filename = "company-files.zip";
        const m = dispo?.match(/filename="([^"]+)"/);
        if (m?.[1]) filename = m[1];
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("ZIP download started");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Zip failed");
      } finally {
        setZipping(false);
      }
    },
    [effectiveCompanyId, passCompanyIdToApi],
  );

  const deleteFolderRecursive = async (path: string, displayName: string) => {
    if (
      !confirm(
        `Delete folder “${displayName}” and everything inside it from storage? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingFolderPath(path);
    try {
      const params = new URLSearchParams();
      params.set("recursive", "1");
      params.set("prefix", path);
      if (passCompanyIdToApi && effectiveCompanyId) params.set("companyId", effectiveCompanyId);
      const res = await fetch(`/api/admin/company-files?${params}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Delete folder failed");
      }
      const n = typeof data.deleted === "number" ? data.deleted : 0;
      toast.success(n > 0 ? `Folder removed (${n} object${n === 1 ? "" : "s"})` : "Folder removed");
      const wasInsideDeleted = folderPath === path || folderPath.startsWith(`${path}/`);
      if (wasInsideDeleted) {
        setFolderPath("");
        // Listing for '' is loaded by useEffect; avoid refresh with stale folderPath.
      } else {
        await refreshBrowseSilent();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete folder failed");
    } finally {
      setDeletingFolderPath(null);
    }
  };

  const crumbs = useMemo(
    () => buildFileBreadcrumbs(multiCompanyPicker, selectedCompanyId, companies, folderPath),
    [multiCompanyPicker, selectedCompanyId, companies, folderPath],
  );

  const navigateCrumb = (crumbPath: string) => {
    if (crumbPath === CRUMB_ALL_COMPANIES) {
      setSelectedCompanyId("");
      setFolderPath("");
    } else if (crumbPath === CRUMB_COMPANY_ROOT) {
      setFolderPath("");
    } else {
      setFolderPath(crumbPath);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FolderArchive className="h-6 w-6 text-primary" />
            File sharing
          </CardTitle>
          {isSuperAdmin ? (
            <CardDescription>
              Super admin: open a <strong className="text-foreground">company folder</strong> below
              (each company is its own storage root in R2). New companies get a root folder
              automatically; older ones are backfilled when you open them.
            </CardDescription>
          ) : supportAgentCompanyFiles ? (
            <CardDescription>
              Companies where this workspace has allowed support access to file storage. Pick a
              company to browse or upload files.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          {multiCompanyPicker && !effectiveCompanyId ? (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/30 text-sm text-muted-foreground">
                Companies — click a folder to manage that company&apos;s files
              </div>
              {companies.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No companies yet. Create one under the Companies tab.
                </p>
              ) : (
                <ul className="divide-y divide-border/40 max-h-[min(60vh,28rem)] overflow-y-auto">
                  {[...companies]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedCompanyId(c.id)}
                          className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <Folder className="h-6 w-6 shrink-0 text-amber-500/90" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-base">{c.name}</span>
                            <span className="text-xs text-muted-foreground">
                              Company file storage
                            </span>
                          </span>
                          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          ) : null}

          {!multiCompanyPicker && !effectiveCompanyId ? (
            <p className="text-sm text-muted-foreground">
              You need to be assigned to a company to use file sharing.
            </p>
          ) : null}

          {effectiveCompanyId ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 text-sm min-h-8">
                  {crumbs.map((c, i) => (
                    <span key={`${i}-${c.path}`} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                      <span
                        className={cn(
                          "rounded-md transition-colors",
                          moveTargetFromCrumbPath(c.path) !== null &&
                            moveDragOverDest === c.path &&
                            draggingFileKey &&
                            "bg-primary/15 ring-2 ring-primary ring-offset-2 ring-offset-background",
                        )}
                        onDragOver={(e) => {
                          if (!hasInternalFilePayload(e)) return;
                          if (moveTargetFromCrumbPath(c.path) === null) return;
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = "move";
                          setMoveDragOverDest(c.path);
                        }}
                        onDrop={(e) => {
                          if (!hasInternalFilePayload(e)) return;
                          e.preventDefault();
                          e.stopPropagation();
                          const dest = moveTargetFromCrumbPath(c.path);
                          if (dest === null) return;
                          const key = readInternalFileKey(e);
                          if (key) void performMove(key, dest);
                        }}
                      >
                        <button
                          type="button"
                          draggable={false}
                          onClick={() => navigateCrumb(c.path)}
                          className={`rounded-md px-2 py-1 transition-colors hover:bg-muted ${
                            i === crumbs.length - 1
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {c.label}
                        </button>
                      </span>
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={onFileSelected}
                  />
                  <input
                    ref={folderInputRef}
                    type="file"
                    multiple
                    // @ts-expect-error webkitdirectory is non-standard but supported by all major browsers
                    webkitdirectory=""
                    directory=""
                    className="hidden"
                    onChange={onFileSelected}
                  />
                  <Button
                    type="button"
                    onClick={onPickFile}
                    disabled={uploadBusy}
                    className="gap-2"
                  >
                    {uploadBusy ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload file
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => folderInputRef.current?.click()}
                    disabled={uploadBusy}
                    className="gap-2"
                  >
                    <FolderArchive className="h-4 w-4" />
                    Upload folder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewFolderOpen(true)}
                    disabled={uploadBusy}
                    className="gap-2"
                  >
                    <FolderPlus className="h-4 w-4" />
                    New folder
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void refreshBrowseSilent()}
                  >
                    Refresh
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    className="gap-2 font-semibold shadow-sm"
                    onClick={() => void downloadZipForPrefix(folderPath)}
                    disabled={zipping || listRefreshing}
                  >
                    {zipping ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Zipping…
                      </>
                    ) : (
                      <>
                        <Download className="h-5 w-5" />
                        Download
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void copyFolderLink(folderPath)}
                    disabled={shareBusy === `link-folder:${folderPath}`}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {shareBusy === `link-folder:${folderPath}` ? "…" : "Copy link"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadLinkOpen(true)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload link
                  </Button>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border-2 border-dashed bg-card overflow-hidden transition-colors",
                  isDragging && "border-primary/80 bg-primary/5 ring-2 ring-primary/20",
                  !isDragging && draggingFileKey && "border-amber-500/40 bg-amber-500/[0.03]",
                  !isDragging && !draggingFileKey && "border-border/60",
                )}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={(e) => void onDrop(e)}
              >
                {isDragging && (
                  <div className="px-4 py-2 text-center text-sm font-medium text-primary bg-primary/10 border-b border-primary/20">
                    Drop files here to upload to this folder
                  </div>
                )}
                <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_8.5rem_auto] gap-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground border-b border-border/50 bg-muted/30">
                  <span>Name · drag files to folders or breadcrumbs</span>
                  <span>Size</span>
                  <span>Modified</span>
                  <span className="text-right pr-2">Download & link</span>
                </div>

                {listRefreshing &&
                folders.length === 0 &&
                files.length === 0 &&
                activeUploads.length === 0 &&
                !batchProgress ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm font-medium">Opening folder…</span>
                  </div>
                ) : !listRefreshing &&
                  folders.length === 0 &&
                  files.length === 0 &&
                  activeUploads.length === 0 &&
                  !batchProgress ? (
                  <button
                    type="button"
                    onClick={onPickFile}
                    disabled={uploadBusy}
                    onDragOver={(e) => {
                      if (hasInternalFilePayload(e)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(e) => {
                      if (!hasInternalFilePayload(e)) return;
                      e.preventDefault();
                      e.stopPropagation();
                      const key = readInternalFileKey(e);
                      if (key) void performMove(key, folderPath);
                    }}
                    className="w-full py-16 px-4 text-center text-sm text-muted-foreground space-y-2 rounded-b-lg transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    <p className="font-medium text-foreground">This folder is empty.</p>
                    <p>
                      <span className="text-foreground underline-offset-4 hover:underline">
                        Click here to choose files
                      </span>{" "}
                      or drag and drop into this area. Use{" "}
                      <strong className="text-foreground">New folder</strong> above to add a
                      subfolder.
                    </p>
                  </button>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {batchProgress && (
                      <li className="flex flex-col gap-2 px-4 py-4 bg-primary/10 border-b border-primary/20 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-2 lg:py-3">
                        <span className="flex items-center gap-3 min-w-0">
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                          <span className="min-w-0">
                            <span className="block font-medium">
                              Uploading {batchProgress.total} file
                              {batchProgress.total === 1 ? "" : "s"}…
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {batchProgress.completed} of {batchProgress.total} completed
                              {batchProgress.failed > 0 ? ` · ${batchProgress.failed} failed` : ""}
                            </span>
                          </span>
                        </span>
                        <div className="pl-8 lg:pl-0 lg:pr-2 min-w-[200px]">
                          <Progress
                            value={
                              ((batchProgress.completed + batchProgress.failed) /
                                batchProgress.total) *
                              100
                            }
                            className="h-2.5"
                          />
                        </div>
                      </li>
                    )}
                    {activeUploads.map((u) => (
                      <li
                        key={u.id}
                        className="flex flex-col gap-2 px-4 py-4 bg-primary/5 border-b border-primary/10 lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_8.5rem_auto] lg:items-center lg:gap-2 lg:py-3"
                      >
                        <span className="flex items-center gap-3 min-w-0">
                          {u.error ? (
                            <File className="h-5 w-5 shrink-0 text-destructive" />
                          ) : (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate font-medium" title={u.fileName}>
                              {u.fileName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.error
                                ? "Upload failed"
                                : u.progress >= 100
                                  ? "Finishing…"
                                  : "Uploading to this folder…"}
                            </span>
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground pl-8 lg:pl-0">
                          {formatBytes(u.size)}
                        </span>
                        <span className="text-sm text-muted-foreground tabular-nums pl-8 lg:pl-0">
                          {u.error ? "—" : `${u.progress}%`}
                        </span>
                        <div className="pl-8 lg:pl-0 lg:pr-2 space-y-2">
                          {!u.error ? (
                            <Progress value={u.progress} className="h-2.5" />
                          ) : (
                            <p className="text-sm text-destructive break-words">{u.error}</p>
                          )}
                          {u.error && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => dismissUploadRow(u.id)}
                            >
                              Dismiss
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                    {folders.map((f) => (
                      <li
                        key={f.path}
                        className={cn(
                          "flex flex-col gap-3 px-4 py-4 hover:bg-muted/20 lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_8.5rem_auto] lg:items-center lg:gap-2 lg:py-3",
                          moveDragOverDest === f.path &&
                            draggingFileKey &&
                            "bg-primary/10 ring-2 ring-inset ring-primary",
                        )}
                        onDragOver={(e) => {
                          if (!hasInternalFilePayload(e)) return;
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = "move";
                          setMoveDragOverDest(f.path);
                        }}
                        onDrop={(e) => {
                          if (!hasInternalFilePayload(e)) return;
                          e.preventDefault();
                          e.stopPropagation();
                          if ((e.target as HTMLElement).closest("[data-folder-actions]")) return;
                          const key = readInternalFileKey(e);
                          if (key) void performMove(key, f.path);
                        }}
                      >
                        <button
                          type="button"
                          draggable={false}
                          onClick={() => setFolderPath(f.path)}
                          className="flex min-w-0 items-center gap-3 rounded-md text-left outline-offset-2 hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring py-1 -my-1 px-1 -mx-1 lg:min-w-0"
                        >
                          <Folder className="h-5 w-5 shrink-0 text-amber-500/90" />
                          <span className="truncate font-medium">{f.name}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground ml-auto lg:ml-0" />
                        </button>
                        <span className="text-sm text-muted-foreground lg:whitespace-nowrap pl-8 lg:pl-0">
                          Folder
                        </span>
                        <span className="text-sm text-muted-foreground lg:whitespace-nowrap pl-8 lg:pl-0">
                          —
                        </span>
                        <div
                          data-folder-actions
                          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:justify-end pl-8 lg:pl-0"
                        >
                          <Button
                            type="button"
                            size="lg"
                            draggable={false}
                            className="w-full gap-2 font-semibold shadow-sm sm:w-auto min-w-[11rem]"
                            disabled={zipping}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              void downloadZipForPrefix(f.path);
                            }}
                          >
                            {zipping ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                            Download
                          </Button>
                          <div className="flex flex-wrap gap-2 justify-stretch sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              draggable={false}
                              className="gap-1 flex-1 sm:flex-none"
                              disabled={shareBusy === `link-folder:${f.path}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void copyFolderLink(f.path);
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {shareBusy === `link-folder:${f.path}` ? "…" : "Copy link"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              draggable={false}
                              className="gap-1.5 flex-1 sm:flex-none text-destructive hover:text-destructive"
                              disabled={deletingFolderPath === f.path}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                void deleteFolderRecursive(f.path, f.name);
                              }}
                            >
                              {deletingFolderPath === f.path ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                    {files.map((f) => (
                      <li
                        key={f.key}
                        draggable
                        onDragStart={(e) => {
                          if ((e.target as HTMLElement).closest("a, button")) {
                            e.preventDefault();
                            return;
                          }
                          setDraggingFileKey(f.key);
                          e.dataTransfer.setData(FILE_DRAG_TYPE, f.key);
                          e.dataTransfer.setData("text/plain", f.key);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          setDraggingFileKey(null);
                          setMoveDragOverDest(null);
                        }}
                        className={cn(
                          "flex flex-col gap-3 px-4 py-4 hover:bg-muted/20 lg:grid lg:grid-cols-[minmax(0,1fr)_6rem_8.5rem_auto] lg:items-center lg:gap-2 lg:py-3",
                          (draggingFileKey === f.key || movingKey === f.key) && "opacity-50",
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0 lg:min-w-0 cursor-grab active:cursor-grabbing">
                          <GripVertical
                            className="h-4 w-4 shrink-0 text-muted-foreground/60 hidden sm:block"
                            aria-hidden
                          />
                          <File className="h-5 w-5 shrink-0 text-primary/90 pointer-events-none" />
                          <span
                            className="truncate font-medium pointer-events-none"
                            title={f.relativePath}
                          >
                            {f.displayName ?? f.relativePath.split("/").pop() ?? f.relativePath}
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground lg:whitespace-nowrap pl-8 lg:pl-0">
                          {formatBytes(f.size)}
                        </span>
                        <span className="text-sm text-muted-foreground lg:whitespace-nowrap pl-8 lg:pl-0">
                          {f.lastModified
                            ? new Date(f.lastModified).toLocaleString(undefined, {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:justify-end pl-8 lg:pl-0">
                          <Button
                            size="lg"
                            className="w-full gap-2 font-semibold shadow-sm sm:w-auto min-w-[11rem]"
                            asChild
                          >
                            <a href={downloadHref(f.key)} draggable={false}>
                              <Download className="h-5 w-5" />
                              Download
                            </a>
                          </Button>
                          <div className="flex flex-wrap gap-2 justify-stretch sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              draggable={false}
                              onClick={() => void copyFileLink(f.key)}
                              disabled={shareBusy === `link:${f.key}`}
                              className="gap-1 flex-1 sm:flex-none"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              {shareBusy === `link:${f.key}` ? "…" : "Copy link"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              draggable={false}
                              className="gap-1.5 flex-1 sm:flex-none text-destructive hover:text-destructive"
                              onClick={() => void deleteFile(f.key)}
                              disabled={deletingKey === f.key}
                            >
                              {deletingKey === f.key ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={newFolderOpen}
        onOpenChange={(open) => {
          setNewFolderOpen(open);
          if (!open) setNewFolderName("");
        }}
      >
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>
              Creates a folder in{" "}
              <span className="font-medium text-foreground">
                {folderPath.trim() ? folderPath : "Company files (root)"}
              </span>
              . You can open it and upload files inside.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-folder-name">Folder name</Label>
            <Input
              id="new-folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Contracts"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void createFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void createFolder()}
              disabled={creatingFolder || !newFolderName.trim()}
            >
              {creatingFolder ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                "Create folder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={uploadLinkOpen}
        onOpenChange={(open) => {
          setUploadLinkOpen(open);
          if (!open) {
            setUploadLinkLabel("");
            setUploadLinkExpiresInDays("30");
            setUploadLinkMaxUploads("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Public upload link</DialogTitle>
            <DialogDescription>
              Create a link for{" "}
              <span className="font-medium text-foreground">
                {folderPath.trim() ? folderPath : "Company files (root)"}
              </span>
              . Recipients can upload files without signing in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="upload-link-label">Label (optional)</Label>
              <Input
                id="upload-link-label"
                value={uploadLinkLabel}
                onChange={(e) => setUploadLinkLabel(e.target.value)}
                placeholder="e.g. Client deliverables"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-link-expiry">Expires after (days)</Label>
              <Input
                id="upload-link-expiry"
                value={uploadLinkExpiresInDays}
                onChange={(e) => setUploadLinkExpiresInDays(e.target.value)}
                placeholder="30 (leave blank or “never” for no expiry)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-link-max">Max uploads (optional)</Label>
              <Input
                id="upload-link-max"
                value={uploadLinkMaxUploads}
                onChange={(e) => setUploadLinkMaxUploads(e.target.value)}
                placeholder="Unlimited if blank"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUploadLinkOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void createUploadLink()} disabled={uploadLinkBusy}>
              {uploadLinkBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating…
                </>
              ) : (
                "Create & copy link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
