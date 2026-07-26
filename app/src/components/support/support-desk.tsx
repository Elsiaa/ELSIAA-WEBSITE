"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MessageCircle,
  Paperclip,
  File as FileIcon,
  Download,
  Send,
  X,
  Plus,
  Users,
  Ticket,
  Mic,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { getClientSupabaseClient } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { ChatAttachment, ChatMessage } from "@/lib/chat";
import {
  getSupportMessagesClient,
  supportRowToMessage,
  type SupportMessageRow,
} from "@/lib/support-client";
import type { Company, User } from "@/types/company";
import { pdfIframeSrcForEmbed } from "@/lib/attachment-preview";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SupportThread = {
  id: string;
  company_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type SupportDeskProps = {
  mode: "admin" | "portal";
  isSuperAdmin: boolean;
  /** When true, behave like super admin for company selection and thread listing (support agents with multiple companies). */
  supportAgentMode?: boolean;
  companies: Company[];
  allUsers: User[];
  fixedCompanyId: string | null;
  appUserId?: string | null;
  portalIsCompanyAdmin?: boolean;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function isImageMime(mime: string) {
  return mime.startsWith("image/");
}

function isPdfMime(mime: string, filename: string) {
  const m = (mime || "").toLowerCase();
  if (m === "application/pdf" || m.includes("pdf")) return true;
  return filename.toLowerCase().endsWith(".pdf");
}

function formatTicketDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Shown name for the message author (legacy rows stored "Vercatryx" for super-admins). */
function supportSenderLabel(msg: ChatMessage, mine: boolean) {
  if (mine) return "You";
  const n = (msg.userName || "").trim();
  if (n === "Vercatryx") return "Admin";
  return n || "User";
}

type OpenPreviewInput = { url: string; filename: string; mimeType: string };

type StagedAttachment = {
  clientId: string;
  file: File;
  previewUrl: string;
  /** null before / after upload; 0–100 while uploading to the server */
  uploadProgress: number | null;
};

function newStagedAttachmentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function uploadSupportFileWithProgress(
  threadId: string,
  messageId: string,
  file: File,
  onProgress: (pct: number) => void
): Promise<ChatAttachment> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/support/threads/${threadId}/upload`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((100 * ev.loaded) / ev.total)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(xhr.response as ChatAttachment);
      } else {
        const errBody = xhr.response as { error?: string } | null;
        reject(new Error(typeof errBody?.error === "string" ? errBody.error : "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("messageId", messageId);
    xhr.send(fd);
  });
}

/** Compact strip above the reply box — preview + optional upload progress */
function PendingAttachmentStrip({
  items,
  onRemove,
  onOpenPreview,
  uploadLocked,
}: {
  items: StagedAttachment[];
  onRemove: (clientId: string) => void;
  onOpenPreview: (doc: OpenPreviewInput) => void;
  uploadLocked: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mb-2 rounded-lg border border-black/[0.08]/70 bg-black/[0.04]/30 px-2 py-2">
      <p className="mb-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-[#111]/55">
        Attached
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {items.map((item) => {
          const { file, previewUrl, clientId, uploadProgress } = item;
          const isImg = file.type.startsWith("image/");
          const isPdf = isPdfMime(file.type, file.name);
          const showBar = uploadProgress !== null;
          return (
            <div
              key={clientId}
              className="relative w-[76px] shrink-0"
              title={`${file.name} · ${formatFileSize(file.size)}`}
            >
              <div className="relative overflow-hidden rounded-md border border-black/[0.08] bg-[#F5F5F3]">
                {isImg ? (
                  <button
                    type="button"
                    disabled={uploadLocked}
                    onClick={() =>
                      onOpenPreview({
                        url: previewUrl,
                        filename: file.name,
                        mimeType: file.type,
                      })
                    }
                    className="block w-full disabled:pointer-events-none disabled:opacity-60"
                  >
                    <img src={previewUrl} alt="" className="h-14 w-full object-cover" />
                  </button>
                ) : isPdf ? (
                  <button
                    type="button"
                    disabled={uploadLocked}
                    onClick={() =>
                      onOpenPreview({
                        url: previewUrl,
                        filename: file.name,
                        mimeType: file.type || "application/pdf",
                      })
                    }
                    className="flex h-14 w-full flex-col items-center justify-center text-[10px] font-semibold leading-tight text-[#111]/55 disabled:pointer-events-none disabled:opacity-60"
                  >
                    PDF
                  </button>
                ) : (
                  <div className="flex h-14 w-full flex-col items-center justify-center px-1">
                    <FileIcon className="h-6 w-6 shrink-0 text-[#111]/55" />
                  </div>
                )}
                {showBar && (
                  <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/20">
                    <div
                      className="h-full bg-[#1e6b3c] transition-[width] duration-150 ease-out"
                      style={{ width: `${uploadProgress ?? 0}%` }}
                    />
                  </div>
                )}
              </div>
              <p className="mt-1 line-clamp-1 text-center text-[10px] leading-tight text-[#111]/55">
                {file.name}
              </p>
              <button
                type="button"
                disabled={uploadLocked}
                onClick={() => onRemove(clientId)}
                className="absolute -right-1 -top-1 rounded-full border border-black/[0.08] bg-[#F5F5F3] p-0.5 shadow hover:bg-[#1e6b3c]/10 hover:text-[#1e6b3c] disabled:pointer-events-none disabled:opacity-40"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MessageAttachments({
  attachments,
  onOpenPreview,
}: {
  attachments: ChatAttachment[];
  onOpenPreview: (doc: OpenPreviewInput) => void;
}) {
  const images = attachments.filter((a) => a.type === "image" || isImageMime(a.mimeType));
  const pdfs = attachments.filter(
    (a) =>
      !(a.type === "image" || isImageMime(a.mimeType)) &&
      a.type !== "voice" &&
      isPdfMime(a.mimeType || "", a.filename)
  );
  const others = attachments.filter((a) => {
    if (a.type === "image" || isImageMime(a.mimeType)) return false;
    if (a.type === "voice") return true;
    if (isPdfMime(a.mimeType || "", a.filename)) return false;
    return true;
  });

  return (
    <div className="mt-4 space-y-4">
      {images.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#111]/55">Images</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {images.map((att, idx) => (
              <button
                key={`img-${idx}`}
                type="button"
                onClick={() =>
                  onOpenPreview({
                    url: att.url,
                    filename: att.filename,
                    mimeType: att.mimeType || "image/*",
                  })
                }
                className="group block overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.04]/40 text-left shadow-sm transition hover:border-[#1e6b3c]/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40"
              >
                <img
                  src={att.url}
                  alt={att.filename}
                  className="max-h-[min(48vh,400px)] w-full object-contain bg-black/[0.04]/60"
                />
                <div className="flex items-center justify-between gap-2 border-t border-black/[0.08]/60 bg-white/80 px-3 py-2 text-xs">
                  <span className="truncate font-medium">{att.filename}</span>
                  <span className="shrink-0 text-[#111]/55">{formatFileSize(att.size)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {pdfs.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#111]/55">Documents</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pdfs.map((att, idx) => (
              <button
                key={`pdf-${idx}`}
                type="button"
                onClick={() =>
                  onOpenPreview({
                    url: att.url,
                    filename: att.filename,
                    mimeType: att.mimeType || "application/pdf",
                  })
                }
                className="overflow-hidden rounded-xl border border-black/[0.08] bg-black/[0.04]/25 text-left shadow-sm transition hover:border-[#1e6b3c]/40 hover:bg-black/[0.04]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40"
              >
                <div className="relative h-52 w-full overflow-hidden bg-black/[0.04]/50">
                  <iframe
                    title={att.filename}
                    src={pdfIframeSrcForEmbed(att.url)}
                    className="pointer-events-none h-[720px] w-full origin-top scale-[0.28] border-0 sm:scale-[0.32]"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-black/[0.08]/60 bg-white/80 px-3 py-2 text-xs">
                  <span className="truncate font-medium">{att.filename}</span>
                  <span className="shrink-0 text-[#111]/55">{formatFileSize(att.size)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {others.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#111]/55">Files</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((att, idx) =>
              att.type === "voice" ? (
                <div
                  key={`vo-${idx}`}
                  className="flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-black/[0.04]/30 p-4 sm:flex-row sm:items-center"
                >
                  <div className="flex items-center gap-2 text-[#111]/55">
                    <Mic className="h-8 w-8 shrink-0" />
                    <span className="text-sm font-medium">Voice</span>
                  </div>
                  <audio controls className="w-full max-w-md" preload="metadata">
                    <source src={att.url} type={att.mimeType || "audio/webm"} />
                  </audio>
                </div>
              ) : (
                <div
                  key={`f-${idx}`}
                  className="flex min-h-[120px] flex-col gap-3 rounded-xl border border-black/[0.08] bg-black/[0.04]/25 p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-black/[0.06]">
                      <FileIcon className="h-7 w-7 text-[#111]/55" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium break-words">{att.filename}</p>
                      <p className="mt-1 text-xs text-[#111]/55">{formatFileSize(att.size)}</p>
                    </div>
                  </div>
                  <div className="flex w-full flex-wrap gap-2 border-t border-black/[0.08]/60 pt-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPreview({
                          url: att.url,
                          filename: att.filename,
                          mimeType: att.mimeType || "application/octet-stream",
                        })
                      }
                      className="rounded-md border border-black/[0.08] bg-[#F5F5F3] px-2.5 py-1.5 text-xs font-medium hover:bg-black/[0.06]"
                    >
                      Preview
                    </button>
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 rounded-md bg-[#1e6b3c]/10 px-2.5 py-1.5 text-xs font-medium text-[#1e6b3c] hover:bg-[#1e6b3c]/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportDesk({
  mode,
  isSuperAdmin,
  supportAgentMode = false,
  companies,
  allUsers,
  fixedCompanyId,
  appUserId = null,
  portalIsCompanyAdmin = false,
}: SupportDeskProps) {
  const multiCompanySupport = isSuperAdmin || supportAgentMode;
  const canManageSubjects = mode === "admin" || (mode === "portal" && portalIsCompanyAdmin);

  const { data: session } = useSession();
  const sessionAuthUserId = session?.user?.id ?? "";
  const sessionName = session?.user?.name || session?.user?.email || "You";

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    fixedCompanyId || (companies[0]?.id ?? "")
  );

  useEffect(() => {
    if (fixedCompanyId) setSelectedCompanyId(fixedCompanyId);
  }, [fixedCompanyId]);

  const effectiveCompanyId = multiCompanySupport ? selectedCompanyId : fixedCompanyId || "";

  const companyUsers = allUsers.filter((u) => u.company_id === effectiveCompanyId);

  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newParticipantIds, setNewParticipantIds] = useState<Set<string>>(() => new Set());
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<OpenPreviewInput | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageDraftRef = useRef<HTMLTextAreaElement>(null);

  const adjustDraftHeight = useCallback(() => {
    const el = messageDraftRef.current;
    if (!el) return;
    el.style.height = "0px";
    const minPx = 76;
    const maxPx = Math.max(minPx, Math.round(window.innerHeight * 0.36));
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minPx), maxPx)}px`;
  }, []);

  useEffect(() => {
    setStagedAttachments((prev) => {
      for (const s of prev) URL.revokeObjectURL(s.previewUrl);
      return [];
    });
    const el = messageDraftRef.current;
    if (el) el.value = "";
    const id = requestAnimationFrame(() => adjustDraftHeight());
    return () => cancelAnimationFrame(id);
  }, [activeThreadId, adjustDraftHeight]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadThreads = useCallback(async () => {
    if (!effectiveCompanyId && multiCompanySupport) return;
    if (!effectiveCompanyId && !multiCompanySupport) return;

    setLoadingThreads(true);
    try {
      const q = multiCompanySupport ? `?companyId=${encodeURIComponent(effectiveCompanyId)}` : "";
      const res = await fetch(`/api/support/threads${q}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load threads");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (e) {
      console.error(e);
      toast.error("Could not load tickets");
    } finally {
      setLoadingThreads(false);
    }
  }, [effectiveCompanyId, multiCompanySupport]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  const loadParticipants = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/support/threads/${threadId}/participants`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      setParticipantIds(new Set(data.userIds || []));
    } catch {
      setParticipantIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const supabase = getClientSupabaseClient();
    let channel: RealtimeChannel | null = null;
    let pollFallback: ReturnType<typeof setInterval> | null = null;

    const setup = async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const initial = await getSupportMessagesClient(supabase, activeThreadId);
        setMessages(initial);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 200);
        if (canManageSubjects) {
          void loadParticipants(activeThreadId);
        }

        channel = supabase
          .channel(`support:${activeThreadId}`, {
            config: { broadcast: { self: false } },
          })
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "support_messages",
              filter: `thread_id=eq.${activeThreadId}`,
            },
            async (payload) => {
              if (payload.eventType === "INSERT") {
                const newMessage = supportRowToMessage(payload.new as SupportMessageRow);
                setMessages((prev) => {
                  const isDuplicate = prev.some(
                    (msg) =>
                      msg.id === newMessage.id ||
                      (msg.userId === newMessage.userId &&
                        msg.message === newMessage.message &&
                        Math.abs(msg.timestamp - newMessage.timestamp) < 1000)
                  );
                  if (isDuplicate) return prev;
                  return [...prev, newMessage].sort((a, b) => a.timestamp - b.timestamp);
                });
                setTimeout(scrollToBottom, 100);
              } else if (payload.eventType === "UPDATE") {
                const updated = supportRowToMessage(payload.new as SupportMessageRow);
                setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
              } else if (payload.eventType === "DELETE") {
                const deletedId = (payload.old as { id?: string }).id;
                if (deletedId) setMessages((prev) => prev.filter((m) => m.id !== deletedId));
              }
            }
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED" && pollFallback) {
              clearInterval(pollFallback);
              pollFallback = null;
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              if (!pollFallback) {
                pollFallback = setInterval(async () => {
                  try {
                    const msgs = await getSupportMessagesClient(supabase, activeThreadId);
                    setMessages(msgs);
                  } catch {
                    /* ignore */
                  }
                }, 5000);
              }
            }
          });
      } catch (e) {
        console.error(e);
        setLoadingMessages(false);
        pollFallback = setInterval(async () => {
          try {
            const msgs = await getSupportMessagesClient(supabase, activeThreadId);
            setMessages(msgs);
          } catch {
            /* ignore */
          }
        }, 5000);
      }
    };

    void setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (pollFallback) clearInterval(pollFallback);
    };
  }, [activeThreadId, canManageSubjects, loadParticipants]);

  useEffect(() => {
    const ch = getClientSupabaseClient();
    let c: RealtimeChannel | null = null;
    if (!effectiveCompanyId || !multiCompanySupport) return undefined;

    c = ch
      .channel(`support-threads:${effectiveCompanyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
          filter: `company_id=eq.${effectiveCompanyId}`,
        },
        () => {
          void loadThreads();
        }
      )
      .subscribe();

    return () => {
      if (c) ch.removeChannel(c);
    };
  }, [effectiveCompanyId, multiCompanySupport, loadThreads]);

  useEffect(() => {
    if (!effectiveCompanyId || multiCompanySupport) return undefined;
    const ch = getClientSupabaseClient();
    const c = ch
      .channel(`support-threads-company:${effectiveCompanyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_threads",
          filter: `company_id=eq.${effectiveCompanyId}`,
        },
        () => void loadThreads()
      )
      .subscribe();
    return () => {
      ch.removeChannel(c);
    };
  }, [effectiveCompanyId, multiCompanySupport, loadThreads]);

  useEffect(() => {
    if (!appUserId) return undefined;
    const ch = getClientSupabaseClient();
    const c = ch
      .channel(`support-my-participants:${appUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_thread_participants",
          filter: `user_id=eq.${appUserId}`,
        },
        () => void loadThreads()
      )
      .subscribe();
    return () => {
      ch.removeChannel(c);
    };
  }, [appUserId, loadThreads]);

  const openNewSubject = () => {
    setShowNewForm(true);
    setNewTitle("");
    setNewParticipantIds(new Set(companyUsers.map((u) => u.id)));
  };

  const createThread = async () => {
    if (!newTitle.trim() || !effectiveCompanyId) return;
    setCreatingThread(true);
    try {
      const res = await fetch("/api/support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          companyId: multiCompanySupport ? effectiveCompanyId : undefined,
          participantUserIds: [...newParticipantIds],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create");
      }
      const data = await res.json();
      setShowNewForm(false);
      setThreads((prev) => [data.thread, ...prev]);
      setActiveThreadId(data.thread.id);
      toast.success("Ticket created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setCreatingThread(false);
    }
  };

  const saveParticipants = async () => {
    if (!activeThreadId) return;
    try {
      const res = await fetch(`/api/support/threads/${activeThreadId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...participantIds] }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Participants updated");
    } catch {
      toast.error("Could not update participants");
    }
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeThreadId || !sessionAuthUserId) return;
    const text = messageDraftRef.current?.value ?? "";
    if (!text.trim() && stagedAttachments.length === 0) return;

    setUploadingFiles(true);
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const attachments: ChatAttachment[] = [];
      for (const item of stagedAttachments) {
        setStagedAttachments((prev) =>
          prev.map((s) => (s.clientId === item.clientId ? { ...s, uploadProgress: 0 } : s))
        );
        const att = await uploadSupportFileWithProgress(
          activeThreadId,
          messageId,
          item.file,
          (pct) => {
            setStagedAttachments((prev) =>
              prev.map((s) => (s.clientId === item.clientId ? { ...s, uploadProgress: pct } : s))
            );
          }
        );
        attachments.push(att);
      }
      const res = await fetch(`/api/support/threads/${activeThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text || "",
          userName: sessionName,
          attachments: attachments.length ? attachments : undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Send failed");
      }
      const sent = (await res.json()) as ChatMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent].sort((a, b) => a.timestamp - b.timestamp);
      });
      if (messageDraftRef.current) messageDraftRef.current.value = "";
      setStagedAttachments((prev) => {
        for (const s of prev) URL.revokeObjectURL(s.previewUrl);
        return [];
      });
      requestAnimationFrame(() => adjustDraftHeight());
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setStagedAttachments((prev) =>
        prev.map((s) => ({ ...s, uploadProgress: null }))
      );
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setUploadingFiles(false);
    }
  };

  const deleteOwnMessage = async (messageId: string) => {
    if (!activeThreadId || deletingMessageId) return;
    setDeletingMessageId(messageId);
    try {
      const res = await fetch(
        `/api/support/threads/${encodeURIComponent(activeThreadId)}/messages/${encodeURIComponent(messageId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Delete failed");
      }
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete message");
    } finally {
      setDeletingMessageId(null);
    }
  };

  const toggleParticipant = (userId: string, forNew: boolean) => {
    if (forNew) {
      setNewParticipantIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    } else {
      setParticipantIds((prev) => {
        const next = new Set(prev);
        if (next.has(userId)) next.delete(userId);
        else next.add(userId);
        return next;
      });
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const ticketIndex = activeThreadId ? threads.findIndex((t) => t.id === activeThreadId) : -1;

  return (
    <>
    <div className="flex min-h-[min(88vh,920px)] max-h-[min(92vh,960px)] rounded-xl border border-black/[0.08]/70 bg-white/70 shadow-sm overflow-hidden">
      {/* Ticket list */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-black/[0.08]/70 bg-[#F5F5F3]/80">
        <div className="shrink-0 space-y-2 border-b border-black/[0.08]/70 p-2.5">
          {multiCompanySupport && companies.length > 0 && (
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-[#111]/55">Company</label>
              <select
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F3] px-2 py-1.5 text-sm"
                value={selectedCompanyId}
                onChange={(e) => {
                  setSelectedCompanyId(e.target.value);
                  setActiveThreadId(null);
                }}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#111]/55">
            <Ticket className="h-3 w-3" />
            Tickets
          </div>
          {canManageSubjects && (
            <button
              type="button"
              onClick={openNewSubject}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#1e6b3c] py-2 text-sm font-medium text-white hover:bg-[#2e9e58]"
            >
              <Plus className="h-4 w-4" />
              New ticket
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {loadingThreads ? (
            <p className="p-2 text-sm text-[#111]/55">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="p-2 text-sm text-[#111]/55">No tickets yet.</p>
          ) : (
            threads.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveThreadId(t.id)}
                className={`w-full rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
                  activeThreadId === t.id
                    ? "border-[#1e6b3c]/60 bg-[#1e6b3c] text-white shadow-sm"
                    : "border-transparent bg-transparent hover:bg-black/[0.06]/70"
                }`}
              >
                <span className="line-clamp-2 font-medium">{t.title}</span>
                <span
                  className={`mt-0.5 block text-[11px] ${activeThreadId === t.id ? "text-white/80" : "text-[#111]/55"}`}
                >
                  #{threads.length - i} · {formatTicketDate(t.updated_at)}
                </span>
              </button>
            ))
          )}
        </div>
        {activeThreadId && canManageSubjects && (
          <div className="shrink-0 border-t border-black/[0.08]/70 bg-black/[0.04]/15 p-2.5">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#111]/55">
              <Users className="h-3 w-3" />
              Participants
            </p>
            <div className="max-h-36 overflow-y-auto rounded-md border border-black/[0.08]/60 bg-[#F5F5F3]/60 p-1.5">
              <div className="flex flex-col gap-0.5">
                {companyUsers.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-1 text-xs hover:bg-black/[0.05]"
                  >
                    <input
                      type="checkbox"
                      checked={participantIds.has(u.id)}
                      onChange={() => toggleParticipant(u.id, false)}
                      className="shrink-0"
                    />
                    <span className="min-w-0 truncate">
                      {[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void saveParticipants()}
              className="mt-1.5 w-full rounded-md bg-black/[0.06] py-1.5 text-[11px] font-medium hover:bg-black/[0.06]"
            >
              Save participants
            </button>
          </div>
        )}
      </aside>

      {/* Ticket workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {showNewForm && canManageSubjects && (
          <div className="shrink-0 space-y-3 border-b border-black/[0.08]/70 bg-black/[0.04]/25 p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <MessageCircle className="h-4 w-4" />
              New ticket
            </h3>
            <input
              className="w-full rounded-lg border border-black/[0.08] bg-[#F5F5F3] px-3 py-2.5 text-sm"
              placeholder="Ticket subject"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div>
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-[#111]/55">
                <Users className="h-3 w-3" />
                Participants
              </p>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-black/[0.08]/70 p-2">
                {companyUsers.map((u) => (
                  <label key={u.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={newParticipantIds.has(u.id)}
                      onChange={() => toggleParticipant(u.id, true)}
                    />
                    <span className="truncate">{[u.first_name, u.last_name].filter(Boolean).join(" ") || u.email}</span>
                  </label>
                ))}
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <button type="button" className="underline" onClick={() => setNewParticipantIds(new Set(companyUsers.map((u) => u.id)))}>
                  Select all
                </button>
                <button type="button" className="underline" onClick={() => setNewParticipantIds(new Set())}>
                  Clear
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={creatingThread || !newTitle.trim()}
                onClick={() => void createThread()}
                className="rounded-lg bg-[#1e6b3c] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingThread ? "Creating…" : "Create ticket"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="rounded-lg border border-black/[0.08] px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!activeThreadId && !showNewForm && (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-[#111]/55">
            Select a ticket or create a new one.
          </div>
        )}

        {activeThreadId && (
          <>
            {/* Ticket header — single compact row */}
            <header className="shrink-0 border-b border-black/[0.08]/70 bg-black/[0.04]/15 px-3 py-2 sm:px-4">
              <div className="flex min-w-0 items-baseline gap-2 sm:gap-3">
                <h2 className="min-w-0 flex-1 truncate text-base font-semibold leading-tight sm:text-[17px]">
                  {activeThread?.title}
                </h2>
                <p className="shrink-0 whitespace-nowrap text-[11px] text-[#111]/55 tabular-nums sm:text-xs">
                  #{ticketIndex >= 0 ? threads.length - ticketIndex : "—"} ·{" "}
                  {activeThread ? formatTicketDate(activeThread.updated_at) : ""}
                </p>
              </div>
            </header>

            {/* Conversation — ticket-style entries */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-black/[0.04]/10 px-3 py-3 sm:px-5 sm:py-4">
              {loadingMessages ? (
                <p className="text-sm text-[#111]/55">Loading conversation…</p>
              ) : (
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                  {messages.map((msg) => {
                    const mine = msg.userId === sessionAuthUserId;
                    return (
                      <article
                        key={msg.id}
                        className={`w-[calc(100%-1.75rem)] max-w-[min(100%,40rem)] rounded-xl border shadow-sm sm:w-[calc(100%-2.75rem)] ${
                          mine
                            ? "self-end border-[#1e6b3c]/40 bg-[#1e6b3c]/10"
                            : "self-start border-black/[0.08] bg-black/[0.04]"
                        }`}
                      >
                        <div
                          className={`flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 sm:px-5 ${
                            mine
                              ? "border-[#1e6b3c]/25 bg-[#1e6b3c]/15"
                              : "border-black/[0.08]/80 bg-black/[0.06]"
                          }`}
                        >
                          <span className="font-semibold">{supportSenderLabel(msg, mine)}</span>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <time className="text-xs text-[#111]/55">
                              {new Date(msg.timestamp).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </time>
                            {mine && (
                              <button
                                type="button"
                                aria-label="Delete message"
                                disabled={deletingMessageId === msg.id}
                                onClick={() => void deleteOwnMessage(msg.id)}
                                className="rounded-md p-1 text-[#111]/55 transition hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                              >
                                {deletingMessageId === msg.id ? (
                                  <span
                                    className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                                    aria-hidden
                                  />
                                ) : (
                                  <Trash2 className="h-4 w-4" aria-hidden />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="px-4 py-4 sm:px-5 sm:py-5">
                          {msg.message?.trim() ? (
                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-[#111] sm:text-base sm:leading-relaxed">
                              {msg.message}
                            </p>
                          ) : msg.attachments && msg.attachments.length > 0 ? null : (
                            <p className="text-sm italic text-[#111]/55">(No message text)</p>
                          )}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <MessageAttachments
                              attachments={msg.attachments}
                              onOpenPreview={setPreviewDoc}
                            />
                          )}
                        </div>
                      </article>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Reply composer — long-form + big pending files */}
            <form
              onSubmit={(e) => void handleSend(e)}
              className="shrink-0 border-t border-black/[0.08]/70 bg-white px-3 py-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] sm:px-5"
            >
              <div className="mx-auto max-w-4xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="flex shrink-0">
                    <label
                      className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-black/[0.08] bg-[#F5F5F3] hover:bg-black/[0.06]"
                      title="Attach files"
                    >
                      <input
                        type="file"
                        multiple
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        onChange={(e) => {
                          const list = e.target.files;
                          if (list?.length) {
                            const picked = Array.from(list);
                            setStagedAttachments((prev) => {
                              const next = [...prev];
                              for (const file of picked) {
                                next.push({
                                  clientId: newStagedAttachmentId(),
                                  file,
                                  previewUrl: URL.createObjectURL(file),
                                  uploadProgress: null,
                                });
                              }
                              return next;
                            });
                          }
                          e.target.value = "";
                        }}
                      />
                      <span className="pointer-events-none flex items-center justify-center" aria-hidden>
                        <Paperclip className="h-5 w-5" />
                      </span>
                      <span className="sr-only">Attach files</span>
                    </label>
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <PendingAttachmentStrip
                      items={stagedAttachments}
                      uploadLocked={uploadingFiles}
                      onRemove={(clientId) => {
                        setStagedAttachments((prev) => {
                          const next: StagedAttachment[] = [];
                          for (const s of prev) {
                            if (s.clientId === clientId) URL.revokeObjectURL(s.previewUrl);
                            else next.push(s);
                          }
                          return next;
                        });
                      }}
                      onOpenPreview={setPreviewDoc}
                    />
                    <label htmlFor="support-reply-draft" className="sr-only">
                      Your reply
                    </label>
                    <textarea
                      id="support-reply-draft"
                      ref={messageDraftRef}
                      name="message"
                      rows={3}
                      className="max-h-[36vh] min-h-[4.75rem] w-full resize-none overflow-y-auto rounded-lg border border-black/[0.08] bg-[#F5F5F3] px-4 py-2.5 text-[15px] leading-relaxed text-[#111] placeholder:text-[#111]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e6b3c]/40 sm:text-base"
                      placeholder="Shift+Enter to send · Enter for a new line"
                      autoComplete="off"
                      onInput={adjustDraftHeight}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" || !e.shiftKey || e.nativeEvent.isComposing) return;
                        e.preventDefault();
                        const form = e.currentTarget.form;
                        if (form && !uploadingFiles) form.requestSubmit();
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={uploadingFiles}
                    className="flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-[#1e6b3c] px-4 font-medium text-white hover:bg-[#2e9e58] disabled:opacity-50 sm:self-start"
                  >
                    {uploadingFiles ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span className="text-sm">Send</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>

    <Dialog
      open={Boolean(previewDoc)}
      onOpenChange={(open) => {
        if (!open) setPreviewDoc(null);
      }}
    >
      <DialogContent className="flex max-h-[min(92vh,900px)] w-[min(96vw,960px)] max-w-[min(96vw,960px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,960px)]">
        {previewDoc ? (
          <>
            <DialogHeader className="shrink-0 space-y-0 border-b border-black/[0.08]/60 px-5 pb-3 pt-5 pr-14">
              <DialogTitle className="line-clamp-2 text-left text-base">{previewDoc.filename}</DialogTitle>
              <DialogDescription className="sr-only">
                Attachment preview. Use Open in new tab for the full file in your browser.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-auto bg-black/[0.04]/20 p-4">
              {isImageMime(previewDoc.mimeType) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.filename}
                  className="mx-auto max-h-[min(78vh,800px)] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              ) : isPdfMime(previewDoc.mimeType, previewDoc.filename) ? (
                <iframe
                  title={previewDoc.filename}
                  src={pdfIframeSrcForEmbed(previewDoc.url)}
                  className="h-[min(76vh,760px)] w-full rounded-lg border border-black/[0.08] bg-[#F5F5F3]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
                  <FileIcon className="h-16 w-16 text-[#111]/55" />
                  <p className="max-w-md text-sm text-[#111]/55">
                    There is no built-in preview for this file type. Use Open in new tab to view or download it.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="shrink-0 border-t border-black/[0.08]/60 px-5 py-3 sm:justify-end">
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-[#1e6b3c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e9e58]"
              >
                <ExternalLink className="h-4 w-4" />
                Open in new tab
              </a>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
    </>
  );
}
