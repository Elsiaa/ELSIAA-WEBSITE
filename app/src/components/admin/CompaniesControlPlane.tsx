import { useCallback, useEffect, useState } from "react";
import {
  addCompanyMemberByEmail,
  createAdminCompany,
  deleteAdminCompany,
  listAdminCompanies,
  listCompanyMembers,
  removeCompanyMember,
  updateCompanyMemberAccess,
  type AdminCompany,
  type AdminCompanyMember,
} from "../../lib/admin/companies.functions";
import { adminFonts } from "./tokens";

const MODULE_FLAGS: Array<{
  key: keyof Pick<
    AdminCompanyMember,
    | "authorizationsAllowed"
    | "programLogsAllowed"
    | "filesAllowed"
    | "supportAllowed"
    | "allProjectsAccess"
  >;
  label: string;
}> = [
  { key: "authorizationsAllowed", label: "Authz" },
  { key: "filesAllowed", label: "Files" },
  { key: "supportAllowed", label: "Support" },
  { key: "programLogsAllowed", label: "Logs" },
  { key: "allProjectsAccess", label: "All proj" },
];

export function CompaniesControlPlane() {
  const { mono, sans } = adminFonts;
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<AdminCompanyMember[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"owner" | "admin" | "member">(
    "member",
  );

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
    const rows = await listAdminCompanies();
    setCompanies(rows);
  }, []);

  const refreshMembers = useCallback(async (companyId: string) => {
    const rows = await listCompanyMembers({ data: { companyId } });
    setMembers(rows);
  }, []);

  useEffect(() => {
    void run(refresh);
  }, [run, refresh]);

  useEffect(() => {
    if (!selectedId) {
      setMembers([]);
      return;
    }
    void run(async () => {
      await refreshMembers(selectedId);
    });
  }, [selectedId, run, refreshMembers]);

  const inputClass =
    "w-full rounded-lg border border-black/[0.1] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#1e6b3c]";
  const btnPrimary =
    "rounded-lg bg-[#1e6b3c] px-3 py-2 text-[13px] font-medium text-white disabled:opacity-50";
  const btnGhost =
    "rounded-lg border border-black/[0.1] bg-white px-2.5 py-1.5 text-[12px] text-[#111] disabled:opacity-50";

  return (
    <div className="space-y-5" style={sans}>
      <section className="space-y-4 rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
        <p className="text-[13px] text-[#1e6b3c]" style={mono}>
          Companies
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Tenants</h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#111111]/55">
          Create companies, attach members, and set module access (Authorizations,
          Files, Support, Logs, All projects).
        </p>

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

        <div className="grid gap-2 sm:grid-cols-3">
          <input
            className={inputClass}
            placeholder="Company name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="slug (optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || !name.trim()}
            onClick={() =>
              void run(async () => {
                await createAdminCompany({
                  data: {
                    name: name.trim(),
                    slug: slug.trim() || undefined,
                  },
                });
                setName("");
                setSlug("");
                setNotice("Company created");
                await refresh();
              })
            }
          >
            Create company
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[520px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Members</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-[#111]/45">
                    No companies yet.
                  </td>
                </tr>
              ) : (
                companies.map((c) => (
                  <tr key={c.id} className="border-t border-black/[0.05]">
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-[12px] text-[#111]/45">{c.slug}</div>
                    </td>
                    <td className="px-3 py-2">{c.memberCount}</td>
                    <td className="flex flex-wrap gap-1.5 px-3 py-2">
                      <button
                        type="button"
                        className={btnGhost}
                        onClick={() => setSelectedId(c.id)}
                      >
                        Members
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            if (!confirm(`Delete ${c.name}?`)) return;
                            await deleteAdminCompany({ data: { id: c.id } });
                            if (selectedId === c.id) setSelectedId(null);
                            setNotice("Company deleted");
                            await refresh();
                          })
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedId && (
        <section className="space-y-4 rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Members —{" "}
              {companies.find((c) => c.id === selectedId)?.name ?? selectedId}
            </h2>
            <button type="button" className={btnGhost} onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className={inputClass}
              placeholder="user@email.com"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
            />
            <select
              className={inputClass}
              value={memberRole}
              onChange={(e) =>
                setMemberRole(e.target.value as "owner" | "admin" | "member")
              }
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
              <option value="owner">owner</option>
            </select>
            <button
              type="button"
              className={btnPrimary}
              disabled={busy || !memberEmail.trim()}
              onClick={() =>
                void run(async () => {
                  await addCompanyMemberByEmail({
                    data: {
                      companyId: selectedId,
                      email: memberEmail.trim(),
                      role: memberRole,
                    },
                  });
                  setMemberEmail("");
                  setNotice("Member added");
                  await refreshMembers(selectedId);
                  await refresh();
                })
              }
            >
              Add member
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
                <tr>
                  <th className="px-3 py-2 font-medium">User</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  {MODULE_FLAGS.map((f) => (
                    <th key={f.key} className="px-2 py-2 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-4 text-[#111]/45">
                      No members. Add a user that already exists in Supabase Auth.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.userId} className="border-t border-black/[0.05]">
                      <td className="px-3 py-2">
                        <div className="font-medium">{m.displayName ?? "—"}</div>
                        <div className="text-[12px] text-[#111]/45">
                          {m.email ?? m.userId}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          className={inputClass}
                          value={m.role}
                          disabled={busy}
                          onChange={(e) =>
                            void run(async () => {
                              await updateCompanyMemberAccess({
                                data: {
                                  companyId: selectedId,
                                  userId: m.userId,
                                  role: e.target.value as
                                    | "owner"
                                    | "admin"
                                    | "member",
                                },
                              });
                              await refreshMembers(selectedId);
                            })
                          }
                        >
                          <option value="member">member</option>
                          <option value="admin">admin</option>
                          <option value="owner">owner</option>
                        </select>
                      </td>
                      {MODULE_FLAGS.map((f) => (
                        <td key={f.key} className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={m[f.key]}
                            disabled={busy}
                            onChange={(e) =>
                              void run(async () => {
                                await updateCompanyMemberAccess({
                                  data: {
                                    companyId: selectedId,
                                    userId: m.userId,
                                    [f.key]: e.target.checked,
                                  },
                                });
                                await refreshMembers(selectedId);
                              })
                            }
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          className={btnGhost}
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await removeCompanyMember({
                                data: {
                                  companyId: selectedId,
                                  userId: m.userId,
                                },
                              });
                              setNotice("Member removed");
                              await refreshMembers(selectedId);
                              await refresh();
                            })
                          }
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
