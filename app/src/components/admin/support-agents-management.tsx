"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, Save, UserX } from "lucide-react";
import type { Company } from "@/types/company";
import type { SupportAgentCompanyGrantRow } from "@/lib/support-agent-grants";

type AgentListEntry = {
  user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    status: string;
    company_id: string | null;
  };
  grants: SupportAgentCompanyGrantRow[];
};

type CompanyGrantDraft = Record<
  string,
  {
    support: boolean;
    authorizations: boolean;
    programLogs: boolean;
    files: boolean;
  }
>;

function emptyDraft(companies: Company[]): CompanyGrantDraft {
  const d: CompanyGrantDraft = {};
  for (const c of companies) {
    d[c.id] = { support: false, authorizations: false, programLogs: false, files: false };
  }
  return d;
}

function draftFromGrants(grants: SupportAgentCompanyGrantRow[], companies: Company[]): CompanyGrantDraft {
  const d = emptyDraft(companies);
  for (const g of grants) {
    if (!d[g.company_id]) {
      d[g.company_id] = { support: false, authorizations: false, programLogs: false, files: false };
    }
    d[g.company_id].support = g.support_allowed;
    d[g.company_id].authorizations = g.authorizations_allowed;
    d[g.company_id].programLogs = Boolean(g.program_logs_allowed);
    d[g.company_id].files = Boolean(g.files_allowed);
  }
  return d;
}

interface Props {
  companies: Company[];
  onDataChange: () => void;
}

export default function SupportAgentsManagement({ companies, onDataChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentListEntry[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, CompanyGrantDraft>>({});

  const [newEmail, setNewEmail] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newDraft, setNewDraft] = useState<CompanyGrantDraft>(() => emptyDraft(companies));
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/support-agents", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const list = (data.agents || []) as AgentListEntry[];
      setAgents(list);
      const next: Record<string, CompanyGrantDraft> = {};
      for (const a of list) {
        next[a.user.id] = draftFromGrants(a.grants, companies);
      }
      setDrafts(next);
    } catch {
      toast.error("Could not load support agents");
    } finally {
      setLoading(false);
    }
  }, [companies]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNewDraft((prev) => {
      const base = emptyDraft(companies);
      for (const id of Object.keys(base)) {
        base[id] = prev[id] ?? base[id];
      }
      return base;
    });
  }, [companies]);

  const toggleDraft = (
    userId: string,
    companyId: string,
    key: "support" | "authorizations" | "programLogs" | "files"
  ) => {
    setDrafts((prev) => {
      const row = { ...(prev[userId] || emptyDraft(companies)) };
      const cell = { ...row[companyId], [key]: !row[companyId]?.[key] };
      row[companyId] = cell;
      return { ...prev, [userId]: row };
    });
  };

  const toggleNewDraft = (
    companyId: string,
    key: "support" | "authorizations" | "programLogs" | "files"
  ) => {
    setNewDraft((prev) => ({
      ...prev,
      [companyId]: { ...prev[companyId], [key]: !prev[companyId]?.[key] },
    }));
  };

  const grantsPayloadFromDraft = (draft: CompanyGrantDraft) =>
    Object.entries(draft)
      .filter(([, v]) => v.support || v.authorizations || v.programLogs || v.files)
      .map(([company_id, v]) => ({
        company_id,
        support_allowed: v.support,
        authorizations_allowed: v.authorizations,
        program_logs_allowed: v.programLogs,
        files_allowed: v.files,
      }));

  const saveAgent = async (userId: string) => {
    const draft = drafts[userId];
    if (!draft) return;
    const grants = grantsPayloadFromDraft(draft);
    if (grants.length === 0) {
      toast.error(
        "Select at least one access type (support, authorizations, program logs, or files) for one company"
      );
      return;
    }
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/support-agents/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grants }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      toast.success("Access updated");
      await load();
      onDataChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const demoteAgent = async (userId: string) => {
    if (!confirm("Remove support agent access for this user? They will keep their login but lose platform access.")) {
      return;
    }
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/support-agents/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ demote: true }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed");
      }
      toast.success("Support agent access removed");
      await load();
      onDataChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSavingId(null);
    }
  };

  const createAgent = async () => {
    const email = newEmail.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    const grants = grantsPayloadFromDraft(newDraft);
    if (grants.length === 0) {
      toast.error(
        "Grant access to at least one company (support, authorizations, program logs, and/or files)"
      );
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/support-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          first_name: newFirst.trim() || undefined,
          last_name: newLast.trim() || undefined,
          grants,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Create failed");
      }
      const data = await res.json();
      toast.success(
        data.invitationSent ? "Support agent created and invitation sent" : "Support agent created"
      );
      setNewEmail("");
      setNewFirst("");
      setNewLast("");
      setNewDraft(emptyDraft(companies));
      await load();
      onDataChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[#111]/55 py-12">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading support agents…
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-semibold">Support agents</h2>
        <p className="text-sm text-[#111]/55 mt-1 max-w-3xl">
          Support agents sign in like other users but only see the admin areas you allow—support tickets,
          authorizations, program logs, and/or company files—limited to the companies you select below.
        </p>
      </div>

      <div className="rounded-xl border border-black/[0.08]/70 bg-white/70 p-6 space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-[#1e6b3c]" />
          Invite a support agent
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-[#111]/55">Email</label>
            <input
              className="mt-1 w-full rounded-md border border-black/[0.08] bg-[#F5F5F3] px-3 py-2 text-sm"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="agent@example.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#111]/55">First name</label>
            <input
              className="mt-1 w-full rounded-md border border-black/[0.08] bg-[#F5F5F3] px-3 py-2 text-sm"
              value={newFirst}
              onChange={(e) => setNewFirst(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[#111]/55">Last name</label>
            <input
              className="mt-1 w-full rounded-md border border-black/[0.08] bg-[#F5F5F3] px-3 py-2 text-sm"
              value={newLast}
              onChange={(e) => setNewLast(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/[0.08]/60 text-left text-[#111]/55">
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 px-2 font-medium">Support</th>
                <th className="py-2 px-2 font-medium">Authorizations</th>
                <th className="py-2 px-2 font-medium">Program logs</th>
                <th className="py-2 px-2 font-medium">Files</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-black/[0.08]/40">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={newDraft[c.id]?.support ?? false}
                      onChange={() => toggleNewDraft(c.id, "support")}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={newDraft[c.id]?.authorizations ?? false}
                      onChange={() => toggleNewDraft(c.id, "authorizations")}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={newDraft[c.id]?.programLogs ?? false}
                      onChange={() => toggleNewDraft(c.id, "programLogs")}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="checkbox"
                      checked={newDraft[c.id]?.files ?? false}
                      onChange={() => toggleNewDraft(c.id, "files")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          disabled={creating}
          onClick={() => void createAgent()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1e6b3c] px-4 py-2 text-sm font-medium text-white hover:bg-[#2e9e58] disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Create &amp; invite
        </button>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-medium">Existing agents</h3>
        {agents.length === 0 ? (
          <p className="text-sm text-[#111]/55">No support agents yet.</p>
        ) : (
          <div className="space-y-8">
            {agents.map((a) => (
              <div key={a.user.id} className="rounded-xl border border-black/[0.08]/70 p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium">{a.user.email}</div>
                    <div className="text-xs text-[#111]/55">
                      {[a.user.first_name, a.user.last_name].filter(Boolean).join(" ") || "—"} · {a.user.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingId === a.user.id}
                      onClick={() => void saveAgent(a.user.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-black/[0.08] px-3 py-1.5 text-xs hover:bg-black/[0.04] disabled:opacity-50"
                    >
                      {savingId === a.user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      Save changes
                    </button>
                    <button
                      type="button"
                      disabled={savingId === a.user.id}
                      onClick={() => void demoteAgent(a.user.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Remove access
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-black/[0.08]/60 text-left text-[#111]/55">
                        <th className="py-2 pr-4 font-medium">Company</th>
                        <th className="py-2 px-2 font-medium">Support</th>
                        <th className="py-2 px-2 font-medium">Authorizations</th>
                        <th className="py-2 px-2 font-medium">Program logs</th>
                        <th className="py-2 px-2 font-medium">Files</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companies.map((c) => (
                        <tr key={c.id} className="border-b border-black/[0.08]/40">
                          <td className="py-2 pr-4">{c.name}</td>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={drafts[a.user.id]?.[c.id]?.support ?? false}
                              onChange={() => toggleDraft(a.user.id, c.id, "support")}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={drafts[a.user.id]?.[c.id]?.authorizations ?? false}
                              onChange={() => toggleDraft(a.user.id, c.id, "authorizations")}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={drafts[a.user.id]?.[c.id]?.programLogs ?? false}
                              onChange={() => toggleDraft(a.user.id, c.id, "programLogs")}
                            />
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="checkbox"
                              checked={drafts[a.user.id]?.[c.id]?.files ?? false}
                              onChange={() => toggleDraft(a.user.id, c.id, "files")}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
