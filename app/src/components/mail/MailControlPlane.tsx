import { useCallback, useEffect, useState } from "react";
import { adminFonts } from "../admin/tokens";
import {
  getMailControlStatus,
  mailAdminSend,
  mailCreateAccount,
  mailCreateApiKey,
  mailCreateCompanyFolder,
  mailCreateSharedFolder,
  mailDeleteAccount,
  mailDeleteCompanyFolder,
  mailDeleteSharedFolder,
  mailListAccounts,
  mailListApiKeys,
  mailListCompanyFolders,
  mailListSendLog,
  mailListSharedFolders,
  mailPatchCompanyFolderMembers,
  mailPatchSharedFolderMembers,
  mailRevokeApiKey,
} from "../../lib/mail/mail.functions";
import type {
  MailAccount,
  MailApiKeyRecord,
  MailControlStatus,
  MailFolder,
  MailSendLogRecord,
} from "../../lib/mail/types";

function splitList(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function accountLabel(a: MailAccount): string {
  return (
    a.email ||
    a.username ||
    a.name ||
    (Array.isArray(a.emails) ? a.emails[0] : undefined) ||
    "—"
  );
}

function folderLabel(f: MailFolder): string {
  return f.name || f.email || f.company_id || "—";
}

export function MailControlPlane() {
  const { mono, sans } = adminFonts;
  const [status, setStatus] = useState<MailControlStatus | null>(null);
  const [accounts, setAccounts] = useState<MailAccount[]>([]);
  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [companyFolders, setCompanyFolders] = useState<MailFolder[]>([]);
  const [keys, setKeys] = useState<MailApiKeyRecord[]>([]);
  const [logs, setLogs] = useState<MailSendLogRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);

  // Create forms
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newType, setNewType] = useState<"regular" | "admin" | "transparent">(
    "regular",
  );
  const [folderName, setFolderName] = useState("");
  const [folderEmail, setFolderEmail] = useState("");
  const [folderMembers, setFolderMembers] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyMembers, setCompanyMembers] = useState("");
  const [keyName, setKeyName] = useState("");
  const [keyAllowAny, setKeyAllowAny] = useState(false);
  const [keyAllowedFrom, setKeyAllowedFrom] = useState("");
  const [sendFrom, setSendFrom] = useState("noreply@elsiaa.com");
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [logSource, setLogSource] = useState<"" | "admin_ui" | "scoped_api" | "transactional">("");

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    const st = await getMailControlStatus();
    setStatus(st);
    if (!st.masterConfigured) {
      setAccounts([]);
      setFolders([]);
      setCompanyFolders([]);
      return;
    }
    const [a, f, c] = await Promise.all([
      mailListAccounts(),
      mailListSharedFolders({ data: {} }),
      mailListCompanyFolders(),
    ]);
    setAccounts(a);
    setFolders(f);
    setCompanyFolders(c);
    if (st.databaseReady) {
      const [k, l] = await Promise.all([
        mailListApiKeys(),
        mailListSendLog({
          data: logSource ? { source: logSource, limit: 50 } : { limit: 50 },
        }),
      ]);
      setKeys(k);
      setLogs(l);
    } else {
      setKeys([]);
      setLogs([]);
    }
  }, [logSource]);

  useEffect(() => {
    void run(refresh);
  }, [run, refresh]);

  const inputClass =
    "w-full rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#1e6b3c]";
  const btnPrimary =
    "rounded-lg bg-[#1e6b3c] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50";
  const btnGhost =
    "rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 text-[12px] text-[#111] disabled:opacity-50";
  const section =
    "rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6 space-y-4";

  return (
    <div className="space-y-5" style={sans}>
      <div className={section}>
        <p className="text-[13px] text-[#1e6b3c]" style={mono}>
          Mail
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
          Elssia Mail control plane
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#111111]/55">
          Manage Stalwart accounts and folders with the master key. Issue scoped
          send API keys so integrations only use From addresses you authorize.
        </p>

        {status && !status.masterConfigured && (
          <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            Set{" "}
            <code className="rounded bg-black/[0.05] px-1">ELSSIA_MAIL_API_KEY</code>{" "}
            (and optional{" "}
            <code className="rounded bg-black/[0.05] px-1">ELSSIA_MAIL_API_BASE</code>
            ) to connect the Mail API.
          </div>
        )}
        {status && status.masterConfigured && !status.databaseReady && (
          <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
            Mailboxes work with the master key. Configure Supabase (
            <code className="rounded bg-black/[0.05] px-1">SUPABASE_URL</code> +{" "}
            <code className="rounded bg-black/[0.05] px-1">SUPABASE_PUBLISHABLE_KEY</code>
            ) and run the RLS bootstrap SQL for scoped API keys and the send log.
          </div>
        )}
        {status && (
          <div className="flex flex-wrap gap-3 text-[12px]" style={mono}>
            <span className="rounded-full bg-black/[0.04] px-3 py-1">
              Master key: {status.masterConfigured ? "set" : "missing"}
            </span>
            <span className="rounded-full bg-black/[0.04] px-3 py-1">
              Health:{" "}
              {status.healthOk == null
                ? "—"
                : status.healthOk
                  ? "ok"
                  : `down (${status.healthDetail ?? ""})`}
            </span>
            <span className="rounded-full bg-black/[0.04] px-3 py-1">
              Supabase: {status.databaseReady ? "ready" : "not set"}
            </span>
            <button
              type="button"
              className={btnGhost}
              disabled={busy}
              onClick={() => void run(refresh)}
            >
              Refresh
            </button>
          </div>
        )}
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
            {notice}
          </p>
        )}
      </div>

      {/* Accounts */}
      <section className={section}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Accounts</h2>
          <span className="text-[12px] text-[#111]/45" style={mono}>
            {accounts.length}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="email@elsiaa.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="password (optional)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <select
            className={inputClass}
            value={newType}
            onChange={(e) =>
              setNewType(e.target.value as "regular" | "admin" | "transparent")
            }
          >
            <option value="regular">regular</option>
            <option value="admin">admin</option>
            <option value="transparent">transparent</option>
          </select>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || !newEmail || !status?.masterConfigured}
            onClick={() =>
              void run(async () => {
                await mailCreateAccount({
                  data: {
                    email: newEmail.trim(),
                    password: newPassword || undefined,
                    type: newType,
                  },
                });
                setNewEmail("");
                setNewPassword("");
                setNotice("Account created");
                await refresh();
              })
            }
          >
            Create account
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">Mailbox</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-[#111]/45">
                    No accounts loaded.
                  </td>
                </tr>
              ) : (
                accounts.map((a) => {
                  const id = accountLabel(a);
                  return (
                    <tr key={id} className="border-t border-black/[0.05]">
                      <td className="px-3 py-2 font-medium">{id}</td>
                      <td className="px-3 py-2 text-[#111]/55">{a.type ?? "—"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              if (!confirm(`Delete account ${id}?`)) return;
                              await mailDeleteAccount({ data: { username: id } });
                              setNotice(`Deleted ${id}`);
                              await refresh();
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Shared folders */}
      <section className={section}>
        <h2 className="text-lg font-semibold">Shared folders</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="name (e.g. support)"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="email"
            value={folderEmail}
            onChange={(e) => setFolderEmail(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="members (comma-separated)"
            value={folderMembers}
            onChange={(e) => setFolderMembers(e.target.value)}
          />
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || !folderName || !folderEmail || !status?.masterConfigured}
            onClick={() =>
              void run(async () => {
                await mailCreateSharedFolder({
                  data: {
                    name: folderName.trim(),
                    email: folderEmail.trim(),
                    members: splitList(folderMembers),
                  },
                });
                setFolderName("");
                setFolderEmail("");
                setFolderMembers("");
                setNotice("Shared folder created");
                await refresh();
              })
            }
          >
            Create folder
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-[#111]/45">
                    No shared folders.
                  </td>
                </tr>
              ) : (
                folders.map((f) => {
                  const name = folderLabel(f);
                  return (
                    <tr key={name} className="border-t border-black/[0.05]">
                      <td className="px-3 py-2 font-medium">{name}</td>
                      <td className="px-3 py-2 text-[#111]/55">{f.email ?? "—"}</td>
                      <td className="flex flex-wrap gap-1.5 px-3 py-2">
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              const members = prompt("Add members (comma-separated)");
                              if (!members) return;
                              await mailPatchSharedFolderMembers({
                                data: {
                                  name,
                                  mode: "add",
                                  members: splitList(members),
                                },
                              });
                              setNotice("Members updated");
                              await refresh();
                            })
                          }
                        >
                          Add members
                        </button>
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              if (!confirm(`Delete folder ${name}?`)) return;
                              await mailDeleteSharedFolder({ data: { name } });
                              setNotice(`Deleted ${name}`);
                              await refresh();
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Company folders */}
      <section className={section}>
        <h2 className="text-lg font-semibold">Company folders</h2>
        <p className="text-[13px] text-[#111]/50">
          Free-text <code className="rounded bg-black/[0.04] px-1">company_id</code>{" "}
          until companies DB exists (namespaced as <code className="rounded bg-black/[0.04] px-1">company-…</code>).
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={inputClass}
            placeholder="company_id"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="members"
            value={companyMembers}
            onChange={(e) => setCompanyMembers(e.target.value)}
          />
          <button
            type="button"
            className={btnPrimary}
            disabled={
              busy || !companyId || !companyEmail || !status?.masterConfigured
            }
            onClick={() =>
              void run(async () => {
                await mailCreateCompanyFolder({
                  data: {
                    company_id: companyId.trim(),
                    email: companyEmail.trim(),
                    members: splitList(companyMembers),
                  },
                });
                setCompanyId("");
                setCompanyEmail("");
                setCompanyMembers("");
                setNotice("Company folder created");
                await refresh();
              })
            }
          >
            Create company folder
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[480px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyFolders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-[#111]/45">
                    No company folders.
                  </td>
                </tr>
              ) : (
                companyFolders.map((f) => {
                  const name = folderLabel(f);
                  return (
                    <tr key={name} className="border-t border-black/[0.05]">
                      <td className="px-3 py-2 font-medium">{name}</td>
                      <td className="px-3 py-2 text-[#111]/55">{f.email ?? "—"}</td>
                      <td className="flex flex-wrap gap-1.5 px-3 py-2">
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              const members = prompt("Add members (comma-separated)");
                              if (!members) return;
                              await mailPatchCompanyFolderMembers({
                                data: {
                                  name,
                                  mode: "add",
                                  members: splitList(members),
                                },
                              });
                              setNotice("Members updated");
                              await refresh();
                            })
                          }
                        >
                          Add members
                        </button>
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              if (!confirm(`Delete ${name}?`)) return;
                              await mailDeleteCompanyFolder({ data: { name } });
                              setNotice(`Deleted ${name}`);
                              await refresh();
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* API keys */}
      <section className={section}>
        <h2 className="text-lg font-semibold">Scoped send API keys</h2>
        <p className="text-[13px] text-[#111]/50">
          Callers use{" "}
          <code className="rounded bg-black/[0.04] px-1">POST /api/mail/v1/send</code>{" "}
          with <code className="rounded bg-black/[0.04] px-1">Authorization: Bearer emk_…</code>.
          Restricted From by default — free-for-all only if you enable it (still @elsiaa.com).
        </p>
        {!status?.databaseReady ? (
          <p className="text-[13px] text-[#111]/45]">Requires Supabase (RLS bootstrap).</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input
                className={inputClass}
                placeholder="Key name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Allowed From (comma-separated)"
                value={keyAllowedFrom}
                onChange={(e) => setKeyAllowedFrom(e.target.value)}
                disabled={keyAllowAny}
              />
              <label className="flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={keyAllowAny}
                  onChange={(e) => setKeyAllowAny(e.target.checked)}
                />
                Free-for-all From
              </label>
              <button
                type="button"
                className={btnPrimary}
                disabled={busy || !keyName}
                onClick={() =>
                  void run(async () => {
                    const created = await mailCreateApiKey({
                      data: {
                        name: keyName.trim(),
                        allowAnyFrom: keyAllowAny,
                        allowedFrom: splitList(keyAllowedFrom),
                      },
                    });
                    setCreatedRawKey(created.rawKey);
                    setKeyName("");
                    setKeyAllowedFrom("");
                    setKeyAllowAny(false);
                    setNotice("API key created — copy it now; it won’t be shown again.");
                    await refresh();
                  })
                }
              >
                Create key
              </button>
            </div>
            {createdRawKey && (
              <div className="rounded-lg border border-[#1e6b3c]/30 bg-[#1e6b3c]/05 px-4 py-3">
                <p className="text-[12px] font-medium text-[#1e6b3c]">New key (copy once)</p>
                <code className="mt-1 block break-all text-[12px]" style={mono}>
                  {createdRawKey}
                </code>
                <button
                  type="button"
                  className={`${btnGhost} mt-2`}
                  onClick={() => {
                    void navigator.clipboard.writeText(createdRawKey);
                    setNotice("Copied to clipboard");
                  }}
                >
                  Copy
                </button>
              </div>
            )}
            <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
              <table className="w-full min-w-[560px] text-left text-[13px]">
                <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
                  <tr>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Prefix</th>
                    <th className="px-3 py-2 font-medium">From</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-[#111]/45">
                        No keys yet.
                      </td>
                    </tr>
                  ) : (
                    keys.map((k) => (
                      <tr key={k.id} className="border-t border-black/[0.05]">
                        <td className="px-3 py-2 font-medium">{k.name}</td>
                        <td className="px-3 py-2" style={mono}>
                          {k.keyPrefix}…
                        </td>
                        <td className="px-3 py-2 text-[#111]/55">
                          {k.allowAnyFrom
                            ? "any (@elsiaa.com)"
                            : k.allowedFrom.join(", ") || "—"}
                        </td>
                        <td className="px-3 py-2">
                          {k.revokedAt
                            ? "revoked"
                            : k.enabled
                              ? "active"
                              : "disabled"}
                        </td>
                        <td className="px-3 py-2">
                          {!k.revokedAt && (
                            <button
                              type="button"
                              className={btnGhost}
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  if (!confirm(`Revoke key ${k.name}?`)) return;
                                  await mailRevokeApiKey({ data: { id: k.id } });
                                  setNotice("Key revoked");
                                  await refresh();
                                })
                              }
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Send */}
      <section className={section}>
        <h2 className="text-lg font-semibold">Send</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={inputClass}
            placeholder="From"
            value={sendFrom}
            onChange={(e) => setSendFrom(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="To"
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
          />
          <input
            className={`${inputClass} sm:col-span-2`}
            placeholder="Subject"
            value={sendSubject}
            onChange={(e) => setSendSubject(e.target.value)}
          />
          <textarea
            className={`${inputClass} min-h-[100px] sm:col-span-2`}
            placeholder="Text body"
            value={sendBody}
            onChange={(e) => setSendBody(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={btnPrimary}
          disabled={
            busy ||
            !status?.masterConfigured ||
            !sendFrom ||
            !sendTo ||
            !sendSubject ||
            !sendBody
          }
          onClick={() =>
            void run(async () => {
              await mailAdminSend({
                data: {
                  From: sendFrom.trim(),
                  To: sendTo.trim(),
                  Subject: sendSubject.trim(),
                  TextBody: sendBody,
                },
              });
              setNotice("Message sent");
              setSendSubject("");
              setSendBody("");
              await refresh();
            })
          }
        >
          Send mail
        </button>
      </section>

      {/* Send log */}
      <section className={section}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Send log</h2>
          <select
            className={`${inputClass} w-auto`}
            value={logSource}
            onChange={(e) =>
              setLogSource(
                e.target.value as "" | "admin_ui" | "scoped_api" | "transactional",
              )
            }
            disabled={!status?.databaseReady}
          >
            <option value="">All sources</option>
            <option value="admin_ui">Admin UI</option>
            <option value="scoped_api">Scoped API</option>
            <option value="transactional">App transactional</option>
          </select>
        </div>
        {!status?.databaseReady ? (
          <p className="text-[13px] text-[#111]/45]">Requires Supabase (RLS bootstrap).</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
            <table className="w-full min-w-[640px] text-left text-[12px]">
              <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Subject</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-[#111]/45">
                      No sends recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((l) => (
                    <tr key={l.id} className="border-t border-black/[0.05]">
                      <td className="whitespace-nowrap px-3 py-2" style={mono}>
                        {new Date(l.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {l.source}
                        {l.apiKeyName ? ` (${l.apiKeyName})` : ""}
                      </td>
                      <td className="px-3 py-2">{l.fromAddr}</td>
                      <td className="max-w-[160px] truncate px-3 py-2">
                        {l.toAddrs.join(", ")}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2">
                        {l.subject}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            l.status === "sent"
                              ? "text-[#1e6b3c]"
                              : "text-red-700"
                          }
                        >
                          {l.status}
                        </span>
                        {l.error ? (
                          <span className="ml-1 text-[#111]/45" title={l.error}>
                            · {l.error.slice(0, 40)}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
