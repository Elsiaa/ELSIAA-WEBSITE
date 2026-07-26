import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { BillingSnapshot } from "../../lib/billing/data.server";
import { BillingPortal } from "../billing/BillingPortal";
import {
  createAuthDevice,
  createMessageThread,
  createSignatureRequest,
  createSupportTicket,
  deleteAuthDevice,
  listAuthorizations,
  listMessageThreads,
  listPortalCompanyUsers,
  listPortalFiles,
  listPortalMeetings,
  listProgramLogs,
  listSignatureRequests,
  listSupportMessages,
  listSupportTickets,
  listThreadMessages,
  registerPortalFile,
  requestPortalMeeting,
  sendSupportMessage,
  sendThreadMessage,
  setAuthDeviceStatus,
  setSignatureStatus,
  updatePortalMemberModules,
  updateProjectAccess,
  type AuthDevice,
  type AuthProject,
  type PortalCompanyUser,
  type PortalFile,
  type PortalMeeting,
  type PortalMessage,
  type PortalThread,
  type ProgramLog,
  type SignatureRequest,
  type SupportTicket,
} from "../../lib/portal/data.functions";
import { listPortalProjects } from "../../lib/portal/workspace.functions";
import { portalNavMeta } from "../../lib/portal/modules";
import type { PortalNavId, PortalProject, PortalWorkspace } from "../../lib/portal/types";
import { portalFonts } from "./tokens";

const { mono, sans } = portalFonts;

const inputClass =
  "w-full rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#1e6b3c]";
const btnPrimary =
  "rounded-lg bg-[#1e6b3c] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50";
const btnGhost =
  "rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 text-[12px] text-[#111] disabled:opacity-50";

function PanelChrome({
  id,
  children,
  action,
}: {
  id: PortalNavId;
  children: ReactNode;
  action?: ReactNode;
}) {
  const meta = portalNavMeta[id];
  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-[#1e6b3c]" style={mono}>
            {meta.label}
          </p>
          <h1
            className="mt-2 text-2xl font-semibold tracking-[-0.03em] md:text-3xl"
            style={sans}
          >
            {meta.blurb}
          </h1>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Err({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
      {message}
    </p>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed border-black/[0.1] bg-[#FBFBFA] px-4 py-8 text-center text-[14px] text-[#111]/45">
      {children}
    </p>
  );
}

export function PortalModuleView({
  active,
  workspace,
  billing,
}: {
  active: PortalNavId;
  workspace: PortalWorkspace | null;
  billing: BillingSnapshot;
}) {
  if (active === "billing") {
    return (
      <div
        className="-mx-4 rounded-2xl px-4 py-6 md:mx-0 md:px-6"
        style={{ background: "#f5f6f8" }}
      >
        <BillingPortal {...billing} />
      </div>
    );
  }
  if (active === "overview") return <OverviewPanel workspace={workspace} />;
  if (active === "projects") return <ProjectsPanel />;
  if (active === "files") return <FilesPanel />;
  if (active === "messages") return <MessagesPanel />;
  if (active === "meetings") return <MeetingsPanel />;
  if (active === "support") return <SupportPanel />;
  if (active === "authorizations") return <AuthorizationsPanel />;
  if (active === "logs") return <LogsPanel />;
  if (active === "signatures") return <SignaturesPanel />;
  if (active === "users") return <UsersPanel />;
  return null;
}

function OverviewPanel({ workspace }: { workspace: PortalWorkspace | null }) {
  return (
    <PanelChrome id="overview">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-black/[0.06] bg-[#FBFBFA] px-4 py-4">
          <p className="text-[12px] text-[#111]/45" style={mono}>
            Company
          </p>
          <p className="mt-1 text-[16px] font-semibold" style={sans}>
            {workspace?.company?.name ?? "Not assigned yet"}
          </p>
        </div>
        <div className="rounded-xl border border-black/[0.06] bg-[#FBFBFA] px-4 py-4">
          <p className="text-[12px] text-[#111]/45" style={mono}>
            Your role
          </p>
          <p className="mt-1 text-[16px] font-semibold capitalize" style={sans}>
            {workspace?.role ?? "—"}
          </p>
        </div>
      </div>
      <p className="mt-5 max-w-xl text-[14px] leading-relaxed text-[#111]/55" style={sans}>
        Projects, Authorizations, Files, Messages, Meetings, Billing, Support, Logs,
        and Signatures. What you see depends on your company role and module access.
      </p>
    </PanelChrome>
  );
}

function ProjectsPanel() {
  const [rows, setRows] = useState<PortalProject[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void listPortalProjects()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  return (
    <PanelChrome id="projects">
      <Err message={error} />
      {rows.length === 0 && !error ? (
        <Empty>No projects yet. Your ELSIAA admin will attach them to your company.</Empty>
      ) : (
        <ul className="space-y-2">
          {rows.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.06] px-4 py-3"
            >
              <div>
                <p className="text-[15px] font-semibold" style={sans}>
                  {p.title}
                </p>
                {p.description && (
                  <p className="mt-0.5 text-[13px] text-[#111]/50">{p.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] uppercase tracking-wide text-[#111]/55"
                  style={mono}
                >
                  {p.status ?? "active"}
                </span>
                {p.url ? (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className={btnGhost}
                  >
                    Open
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelChrome>
  );
}

function FilesPanel() {
  const [rows, setRows] = useState<PortalFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void listPortalFiles()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PanelChrome id="files">
      <Err message={error} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className={inputClass}
          placeholder="File name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Storage key / path"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !name.trim() || !key.trim()}
          onClick={() => {
            setBusy(true);
            setError(null);
            void registerPortalFile({
              data: { name: name.trim(), storageKey: key.trim() },
            })
              .then(() => {
                setName("");
                setKey("");
                refresh();
              })
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setBusy(false));
          }}
        >
          Register file
        </button>
      </div>
      {rows.length === 0 ? (
        <Empty>No files registered yet.</Empty>
      ) : (
        <ul className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
          {rows.map((f) => (
            <li key={f.id} className="flex justify-between gap-3 px-4 py-3 text-[13px]">
              <span className="font-medium">{f.name}</span>
              <span className="text-[#111]/45" style={mono}>
                {new Date(f.createdAt).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PanelChrome>
  );
}

function MessagesPanel() {
  return <ThreadInbox kind="messages" />;
}

function SupportPanel() {
  return <ThreadInbox kind="support" />;
}

function ThreadInbox({ kind }: { kind: "messages" | "support" }) {
  const [threads, setThreads] = useState<Array<PortalThread | SupportTicket>>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [title, setTitle] = useState("");
  const [first, setFirst] = useState("");
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refreshThreads = useCallback(() => {
    const loader =
      kind === "support" ? listSupportTickets() : listMessageThreads();
    void loader
      .then((rows) => setThreads(rows))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [kind]);

  const refreshMessages = useCallback(
    (threadId: string) => {
      const loader =
        kind === "support"
          ? listSupportMessages({ data: { threadId } })
          : listThreadMessages({ data: { threadId } });
      void loader
        .then(setMessages)
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    },
    [kind],
  );

  useEffect(() => {
    refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (activeId) refreshMessages(activeId);
  }, [activeId, refreshMessages]);

  return (
    <PanelChrome id={kind}>
      <Err message={error} />
      <div className="mb-4 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
        <input
          className={inputClass}
          placeholder={kind === "support" ? "Ticket subject" : "Thread title"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="First message"
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !title.trim() || !first.trim()}
          onClick={() => {
            setBusy(true);
            setError(null);
            const create =
              kind === "support"
                ? createSupportTicket({
                    data: { title: title.trim(), firstMessage: first.trim() },
                  })
                : createMessageThread({
                    data: { title: title.trim(), firstMessage: first.trim() },
                  });
            void create
              .then((res) => {
                setTitle("");
                setFirst("");
                setActiveId(res.id);
                refreshThreads();
              })
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setBusy(false));
          }}
        >
          {kind === "support" ? "Open ticket" : "New thread"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <ul className="max-h-[420px] space-y-1 overflow-y-auto rounded-xl border border-black/[0.06] p-2">
          {threads.length === 0 ? (
            <li className="px-2 py-6 text-center text-[12px] text-[#111]/40">
              None yet
            </li>
          ) : (
            threads.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[13px] ${
                    activeId === t.id
                      ? "bg-[#1e6b3c] text-white"
                      : "hover:bg-black/[0.03]"
                  }`}
                >
                  {t.title}
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex min-h-[280px] flex-col rounded-xl border border-black/[0.06]">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {!activeId ? (
              <Empty>Select a thread</Empty>
            ) : messages.length === 0 ? (
              <Empty>No messages</Empty>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] ${
                    m.role === "client"
                      ? "ml-auto bg-[#1e6b3c]/10"
                      : "bg-black/[0.04]"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-[#111]/40" style={mono}>
                    {m.role}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.content}</p>
                </div>
              ))
            )}
          </div>
          {activeId && (
            <div className="flex gap-2 border-t border-black/[0.06] p-3">
              <input
                className={inputClass}
                placeholder="Reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && reply.trim()) {
                    e.preventDefault();
                    (document.getElementById(`send-${kind}`) as HTMLButtonElement)?.click();
                  }
                }}
              />
              <button
                id={`send-${kind}`}
                type="button"
                className={btnPrimary}
                disabled={busy || !reply.trim()}
                onClick={() => {
                  setBusy(true);
                  const send =
                    kind === "support"
                      ? sendSupportMessage({
                          data: { threadId: activeId, content: reply.trim() },
                        })
                      : sendThreadMessage({
                          data: { threadId: activeId, content: reply.trim() },
                        });
                  void send
                    .then(() => {
                      setReply("");
                      refreshMessages(activeId);
                      refreshThreads();
                    })
                    .catch((e) =>
                      setError(e instanceof Error ? e.message : String(e)),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </PanelChrome>
  );
}

function MeetingsPanel() {
  const [rows, setRows] = useState<PortalMeeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void listPortalMeetings()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PanelChrome id="meetings">
      <Err message={error} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input
          className={inputClass}
          placeholder="Meeting title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className={inputClass}
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !title.trim() || !startsAt}
          onClick={() => {
            setBusy(true);
            void requestPortalMeeting({
              data: {
                title: title.trim(),
                startsAt: new Date(startsAt).toISOString(),
              },
            })
              .then(() => {
                setTitle("");
                setStartsAt("");
                refresh();
              })
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setBusy(false));
          }}
        >
          Request
        </button>
      </div>
      {rows.length === 0 ? (
        <Empty>No meetings scheduled.</Empty>
      ) : (
        <ul className="space-y-2">
          {rows.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-4 py-3"
            >
              <div>
                <p className="font-semibold">{m.title}</p>
                <p className="text-[12px] text-[#111]/45" style={mono}>
                  {new Date(m.startsAt).toLocaleString()} · {m.status}
                </p>
              </div>
              {m.joinUrl ? (
                <a href={m.joinUrl} className={btnGhost} target="_blank" rel="noreferrer">
                  Join
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PanelChrome>
  );
}

function AuthorizationsPanel() {
  const [projects, setProjects] = useState<AuthProject[]>([]);
  const [devices, setDevices] = useState<AuthDevice[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void listAuthorizations()
      .then((res) => {
        setProjects(res.projects);
        setDevices(res.devices);
        if (!selected && res.projects[0]) setSelected(res.projects[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [selected]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const projectDevices = devices.filter((d) => d.projectId === selected);
  const project = projects.find((p) => p.id === selected);

  return (
    <PanelChrome id="authorizations">
      <Err message={error} />
      <p className="mb-4 text-[13px] text-[#111]/50" style={sans}>
        Per-project device limits, access override, and
        registered devices.
      </p>
      {projects.length === 0 ? (
        <Empty>No projects to authorize yet.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <ul className="space-y-1 rounded-xl border border-black/[0.06] p-2">
            {projects.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-[13px] ${
                    selected === p.id
                      ? "bg-[#1e6b3c] text-white"
                      : "hover:bg-black/[0.03]"
                  }`}
                >
                  <span className="font-medium">{p.title}</span>
                  <span
                    className={`mt-0.5 block text-[11px] ${
                      selected === p.id ? "text-white/70" : "text-[#111]/40"
                    }`}
                  >
                    {p.deviceCount}
                    {p.deviceLimit != null ? ` / ${p.deviceLimit}` : ""} devices
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="space-y-4">
            {project && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-black/[0.06] p-4">
                <label className="text-[12px] text-[#111]/50">
                  Device limit
                  <input
                    className={`${inputClass} mt-1 w-28`}
                    type="number"
                    min={0}
                    defaultValue={project.deviceLimit ?? ""}
                    key={`lim-${project.id}-${project.deviceLimit}`}
                    onBlur={(e) => {
                      const v = e.target.value === "" ? null : Number(e.target.value);
                      setBusy(true);
                      void updateProjectAccess({
                        data: { projectId: project.id, deviceLimit: v },
                      })
                        .then(refresh)
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : String(err)),
                        )
                        .finally(() => setBusy(false));
                    }}
                  />
                </label>
                <label className="text-[12px] text-[#111]/50">
                  Access override
                  <select
                    className={`${inputClass} mt-1`}
                    value={project.accessOverride ?? ""}
                    onChange={(e) => {
                      const v = e.target.value as "" | "allowed" | "blocked";
                      setBusy(true);
                      void updateProjectAccess({
                        data: {
                          projectId: project.id,
                          accessOverride: v === "" ? null : v,
                        },
                      })
                        .then(refresh)
                        .catch((err) =>
                          setError(err instanceof Error ? err.message : String(err)),
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    <option value="">Default</option>
                    <option value="allowed">Allowed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="New device name"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
              <button
                type="button"
                className={btnPrimary}
                disabled={busy || !selected || !deviceName.trim()}
                onClick={() => {
                  if (!selected) return;
                  setBusy(true);
                  void createAuthDevice({
                    data: { projectId: selected, name: deviceName.trim() },
                  })
                    .then(() => {
                      setDeviceName("");
                      refresh();
                    })
                    .catch((e) =>
                      setError(e instanceof Error ? e.message : String(e)),
                    )
                    .finally(() => setBusy(false));
                }}
              >
                Add device
              </button>
            </div>
            {projectDevices.length === 0 ? (
              <Empty>No devices on this project.</Empty>
            ) : (
              <ul className="divide-y divide-black/[0.05] rounded-xl border border-black/[0.06]">
                {projectDevices.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[13px]"
                  >
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-[11px] text-[#111]/40" style={mono}>
                        {d.deviceId.slice(0, 12)}… · {d.status}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(["active", "paused"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          className={btnGhost}
                          disabled={busy || d.status === st}
                          onClick={() => {
                            setBusy(true);
                            void setAuthDeviceStatus({
                              data: { deviceId: d.id, status: st },
                            })
                              .then(refresh)
                              .catch((e) =>
                                setError(
                                  e instanceof Error ? e.message : String(e),
                                ),
                              )
                              .finally(() => setBusy(false));
                          }}
                        >
                          {st}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() => {
                          if (!confirm("Remove device?")) return;
                          setBusy(true);
                          void deleteAuthDevice({ data: { deviceId: d.id } })
                            .then(refresh)
                            .catch((e) =>
                              setError(e instanceof Error ? e.message : String(e)),
                            )
                            .finally(() => setBusy(false));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </PanelChrome>
  );
}

function LogsPanel() {
  const [rows, setRows] = useState<ProgramLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void listProgramLogs()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  return (
    <PanelChrome id="logs">
      <Err message={error} />
      {rows.length === 0 && !error ? (
        <Empty>No program logs yet.</Empty>
      ) : (
        <ul className="max-h-[480px] space-y-1 overflow-y-auto font-mono text-[12px]">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-black/[0.05] px-3 py-2"
            >
              <span className="text-[#1e6b3c]">{r.level}</span>{" "}
              <span className="text-[#111]/40">
                {new Date(r.createdAt).toLocaleString()}
              </span>
              <div className="mt-0.5 whitespace-pre-wrap text-[#111]/80">{r.message}</div>
            </li>
          ))}
        </ul>
      )}
    </PanelChrome>
  );
}

function SignaturesPanel() {
  const [rows, setRows] = useState<SignatureRequest[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void listSignatureRequests()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <PanelChrome id="signatures">
      <Err message={error} />
      <div className="mb-4 flex gap-2">
        <input
          className={inputClass}
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !title.trim()}
          onClick={() => {
            setBusy(true);
            void createSignatureRequest({ data: { title: title.trim() } })
              .then(() => {
                setTitle("");
                refresh();
              })
              .catch((e) => setError(e instanceof Error ? e.message : String(e)))
              .finally(() => setBusy(false));
          }}
        >
          Create request
        </button>
      </div>
      {rows.length === 0 ? (
        <Empty>No signature requests yet.</Empty>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] px-4 py-3"
            >
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-[12px] text-[#111]/45" style={mono}>
                  {r.status} · token {r.publicToken.slice(0, 8)}…
                </p>
              </div>
              <div className="flex gap-1">
                {r.status === "draft" && (
                  <button
                    type="button"
                    className={btnGhost}
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void setSignatureStatus({
                        data: { requestId: r.id, status: "sent" },
                      })
                        .then(refresh)
                        .catch((e) =>
                          setError(e instanceof Error ? e.message : String(e)),
                        )
                        .finally(() => setBusy(false));
                    }}
                  >
                    Mark sent
                  </button>
                )}
                <a
                  className={btnGhost}
                  href={`/sign/${r.publicToken}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Sign link
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PanelChrome>
  );
}

function UsersPanel() {
  const [rows, setRows] = useState<PortalCompanyUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => {
    void listPortalCompanyUsers()
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const flags: Array<{
    key: keyof PortalCompanyUser["modules"];
    label: string;
    field:
      | "authorizationsAllowed"
      | "programLogsAllowed"
      | "filesAllowed"
      | "supportAllowed"
      | "allProjectsAccess";
  }> = [
    { key: "authorizationsAllowed", label: "Authz", field: "authorizationsAllowed" },
    { key: "filesAllowed", label: "Files", field: "filesAllowed" },
    { key: "supportAllowed", label: "Support", field: "supportAllowed" },
    { key: "programLogsAllowed", label: "Logs", field: "programLogsAllowed" },
    { key: "allProjectsAccess", label: "All projects", field: "allProjectsAccess" },
  ];

  return (
    <PanelChrome id="users">
      <Err message={error} />
      <p className="mb-4 text-[13px] text-[#111]/50">
        Control what each person on your company can see.
      </p>
      {rows.length === 0 ? (
        <Empty>No company users.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-black/[0.06]">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                {flags.map((f) => (
                  <th key={f.key} className="px-2 py-2">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.userId} className="border-t border-black/[0.05]">
                  <td className="px-3 py-2">
                    <div className="font-medium">{u.displayName || "—"}</div>
                    <div className="text-[12px] text-[#111]/45">{u.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className={inputClass}
                      value={u.role}
                      disabled={busy}
                      onChange={(e) => {
                        setBusy(true);
                        void updatePortalMemberModules({
                          data: {
                            userId: u.userId,
                            role: e.target.value as "owner" | "admin" | "member",
                          },
                        })
                          .then(refresh)
                          .catch((err) =>
                            setError(
                              err instanceof Error ? err.message : String(err),
                            ),
                          )
                          .finally(() => setBusy(false));
                      }}
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                      <option value="owner">owner</option>
                    </select>
                  </td>
                  {flags.map((f) => (
                    <td key={f.key} className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={u.modules[f.key]}
                        disabled={busy}
                        onChange={(e) => {
                          setBusy(true);
                          void updatePortalMemberModules({
                            data: {
                              userId: u.userId,
                              [f.field]: e.target.checked,
                            },
                          })
                            .then(refresh)
                            .catch((err) =>
                              setError(
                                err instanceof Error ? err.message : String(err),
                              ),
                            )
                            .finally(() => setBusy(false));
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelChrome>
  );
}
