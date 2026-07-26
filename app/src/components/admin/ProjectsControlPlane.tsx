import { useCallback, useEffect, useState } from "react";
import { listAdminCompanies } from "../../lib/admin/companies.functions";
import {
  createAdminProject,
  deleteAdminProject,
  listAdminProjects,
  updateAdminProject,
  type AdminProject,
} from "../../lib/admin/projects.functions";
import { adminFonts } from "./tokens";

export function ProjectsControlPlane() {
  const { mono, sans } = adminFonts;
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

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
    const [p, c] = await Promise.all([
      listAdminProjects(),
      listAdminCompanies(),
    ]);
    setProjects(p);
    setCompanies(c.map((x) => ({ id: x.id, name: x.name })));
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
          Projects
        </p>
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Company projects
        </h1>
        <p className="max-w-2xl text-[14px] leading-relaxed text-[#111111]/55">
          Create projects for a company. Portal users see them under Projects;
          Authorizations control device limits and access.
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

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className={inputClass}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            placeholder="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="URL (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            type="button"
            className={btnPrimary}
            disabled={busy || !companyId || !title.trim()}
            onClick={() =>
              void run(async () => {
                await createAdminProject({
                  data: {
                    companyId,
                    title: title.trim(),
                    url: url.trim() || undefined,
                  },
                });
                setTitle("");
                setUrl("");
                setNotice("Project created");
                await refresh();
              })
            }
          >
            Create project
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-black/[0.06]">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-black/[0.02] text-[11px] uppercase tracking-wide text-[#111]/45">
              <tr>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Company</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Access</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-[#111]/45">
                    No projects yet.
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-t border-black/[0.05]">
                    <td className="px-3 py-2">
                      <div className="font-medium">{p.title}</div>
                      {p.url ? (
                        <a
                          href={p.url}
                          className="text-[12px] text-[#1e6b3c]"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {p.url}
                        </a>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-[#111]/55">
                      {p.companyName ?? p.companyId.slice(0, 8)}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={inputClass}
                        value={p.status}
                        disabled={busy}
                        onChange={(e) =>
                          void run(async () => {
                            await updateAdminProject({
                              data: {
                                id: p.id,
                                status: e.target.value as "active" | "archived",
                              },
                            });
                            await refresh();
                          })
                        }
                      >
                        <option value="active">active</option>
                        <option value="archived">archived</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className={inputClass}
                        value={p.accessOverride ?? ""}
                        disabled={busy}
                        onChange={(e) =>
                          void run(async () => {
                            const v = e.target.value as "" | "allowed" | "blocked";
                            await updateAdminProject({
                              data: {
                                id: p.id,
                                accessOverride: v === "" ? null : v,
                              },
                            });
                            await refresh();
                          })
                        }
                      >
                        <option value="">default</option>
                        <option value="allowed">allowed</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className={btnGhost}
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            if (!confirm(`Delete ${p.title}?`)) return;
                            await deleteAdminProject({ data: { id: p.id } });
                            setNotice("Project deleted");
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
