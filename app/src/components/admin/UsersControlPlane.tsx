import { useCallback, useEffect, useState } from "react";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  listCompaniesForUserForm,
  resetAdminUserPassword,
  setAdminUserActive,
  type AdminPortalUser,
} from "../../lib/admin/users.functions";
import { adminFonts } from "./tokens";

export function UsersControlPlane() {
  const { mono, sans } = adminFonts;
  const [users, setUsers] = useState<AdminPortalUser[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [companyRole, setCompanyRole] = useState<"owner" | "admin" | "member">(
    "member",
  );
  const [flags, setFlags] = useState({
    authorizationsAllowed: false,
    programLogsAllowed: false,
    filesAllowed: false,
    supportAllowed: false,
    allProjectsAccess: false,
  });

  useEffect(() => {
    if (companyRole === "owner" || companyRole === "admin") {
      setFlags({
        authorizationsAllowed: true,
        programLogsAllowed: true,
        filesAllowed: true,
        supportAllowed: true,
        allProjectsAccess: true,
      });
    }
  }, [companyRole]);

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
    const [u, c] = await Promise.all([
      listAdminUsers(),
      listCompaniesForUserForm(),
    ]);
    setUsers(u);
    setCompanies(c);
  }, []);

  useEffect(() => {
    void run(refresh);
  }, [run, refresh]);

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
          Users
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">Portal users</h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#111111]/55">
          Add people to the portal and optionally attach them to a company so they
          can sign in.
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
        {tempPassword && (
          <div className="rounded-lg border border-[#1e6b3c]/30 bg-[#1e6b3c]/05 px-4 py-3">
            <p className="text-[12px] font-medium text-[#1e6b3c]">
              Temporary password (copy once)
            </p>
            <code className="mt-1 block break-all text-[13px]" style={mono}>
              {tempPassword}
            </code>
            <button
              type="button"
              className={`${btnGhost} mt-2`}
              onClick={() => {
                void navigator.clipboard.writeText(tempPassword);
                setNotice("Password copied");
              }}
            >
              Copy
            </button>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={inputClass}
            placeholder="email@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="password (optional — auto if blank)"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <select
            className={inputClass}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">No company yet</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={inputClass}
            value={companyRole}
            onChange={(e) =>
              setCompanyRole(e.target.value as "owner" | "admin" | "member")
            }
            disabled={!companyId}
          >
            <option value="member">member</option>
            <option value="admin">admin</option>
            <option value="owner">owner</option>
          </select>
        </div>
        {companyId && (
          <div className="flex flex-wrap gap-4 text-[13px]">
            {(
              [
                ["authorizationsAllowed", "Authorizations"],
                ["filesAllowed", "Files"],
                ["supportAllowed", "Support"],
                ["programLogsAllowed", "Logs"],
                ["allProjectsAccess", "All projects"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) =>
                    setFlags((f) => ({ ...f, [key]: e.target.checked }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        )}
        <button
          type="button"
          className={btnPrimary}
          disabled={busy || !email.trim()}
          onClick={() =>
            void run(async () => {
              const created = await createAdminUser({
                data: {
                  email: email.trim(),
                  password: password.trim() || undefined,
                  firstName: firstName.trim() || undefined,
                  lastName: lastName.trim() || undefined,
                  companyId: companyId || undefined,
                  companyRole: companyId ? companyRole : undefined,
                  ...(companyId ? flags : {}),
                },
              });
              setEmail("");
              setPassword("");
              setFirstName("");
              setLastName("");
              setTempPassword(created.temporaryPassword);
              setNotice(
                created.passwordGenerated
                  ? "User created — copy the temporary password below."
                  : "User created.",
              );
              await refresh();
            })
          }
        >
          Create user
        </button>

        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">User</th>
                <th className="px-3 py-2 font-medium">Companies</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-4 text-[#111]/45">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-black/[0.05]">
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {u.displayName ||
                          [u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          "—"}
                      </div>
                      <div className="text-[12px] text-[#111]/45">{u.email ?? u.id}</div>
                    </td>
                    <td className="px-3 py-2 text-[#111]/55">
                      {u.companies.length
                        ? u.companies.map((c) => `${c.name} (${c.role})`).join(", ")
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      {u.isActive ? "active" : "disabled"}
                    </td>
                    <td className="flex flex-wrap gap-1.5 px-3 py-2">
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await setAdminUserActive({
                              data: { userId: u.id, isActive: !u.isActive },
                            });
                            setNotice(u.isActive ? "User disabled" : "User enabled");
                            await refresh();
                          })
                        }
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            const res = await resetAdminUserPassword({
                              data: { userId: u.id },
                            });
                            setTempPassword(res.temporaryPassword);
                            setNotice("Password reset — copy the temporary password.");
                          })
                        }
                      >
                        Reset password
                      </button>
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            if (!confirm(`Delete ${u.email ?? u.id}?`)) return;
                            await deleteAdminUser({ data: { userId: u.id } });
                            setNotice("User deleted");
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
    </div>
  );
}
