'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollText, Copy, Loader2, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Company } from '@/types/company';

type Project = {
  id: string;
  companyId: string;
  title: string;
  company?: Company;
};

export type ProgramLogEntry = {
  id: string;
  created_at: string;
  level: string | null;
  summary: string | null;
  payload: Record<string, unknown>;
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultLogDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { from: formatLocalYmd(from), to: formatLocalYmd(to) };
}

function logMatchesQuery(log: ProgramLogEntry, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [
    log.level ?? '',
    log.summary ?? '',
    formatWhen(log.created_at),
    log.created_at,
    (() => {
      try {
        return JSON.stringify(log.payload).toLowerCase();
      } catch {
        return '';
      }
    })(),
  ]
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

interface ProjectProgramLogsProps {
  projects: Project[];
  companies: Company[];
  isSuperAdmin: boolean;
}

export default function ProjectProgramLogs({ projects, companies, isSuperAdmin }: ProjectProgramLogsProps) {
  const companiesWithProjects = useMemo(() => {
    const ids = new Set(projects.map((p) => p.companyId));
    return companies
      .filter((c) => ids.has(c.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [companies, projects]);

  const [companyId, setCompanyId] = useState<string>(() => companiesWithProjects[0]?.id ?? '');
  const [projectId, setProjectId] = useState<string>(() => {
    const co = companiesWithProjects[0]?.id;
    if (!co) return '';
    return projects.find((p) => p.companyId === co)?.id ?? '';
  });

  const projectsInCompany = useMemo(
    () => projects.filter((p) => p.companyId === companyId),
    [projects, companyId]
  );
  const [logs, setLogs] = useState<ProgramLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingestUrl, setIngestUrl] = useState<string | null>(null);
  const [ingestLoading, setIngestLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(() => defaultLogDateRange().from);
  const [dateTo, setDateTo] = useState(() => defaultLogDateRange().to);
  const [appliedRange, setAppliedRange] = useState<{ from: string; to: string } | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const resetLogResults = useCallback(() => {
    setHasLoaded(false);
    setLogs([]);
    setAppliedRange(null);
    setExpandedId(null);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => logMatchesQuery(log, search));
  }, [logs, search]);

  useEffect(() => {
    if (companiesWithProjects.length === 0) return;
    if (!companiesWithProjects.some((c) => c.id === companyId)) {
      const nextCo = companiesWithProjects[0].id;
      setCompanyId(nextCo);
      const firstP = projects.find((p) => p.companyId === nextCo);
      setProjectId(firstP?.id ?? '');
      return;
    }
    const inCo = projects.filter((p) => p.companyId === companyId);
    if (inCo.length === 0) {
      setProjectId('');
      return;
    }
    if (!projectId || !inCo.some((p) => p.id === projectId)) {
      setProjectId(inCo[0].id);
    }
  }, [companiesWithProjects, companyId, projectId, projects]);

  const loadLogs = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateFrom,
        to: dateTo,
        limit: '200',
      });
      const res = await fetch(`/api/projects/${projectId}/program-logs?${params}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load logs');
      }
      setLogs(Array.isArray(data.logs) ? data.logs : []);
      if (data.range?.from && data.range?.to) {
        setAppliedRange({ from: data.range.from, to: data.range.to });
      } else {
        setAppliedRange({ from: dateFrom, to: dateTo });
      }
      setHasLoaded(true);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Failed to load logs');
      setLogs([]);
      setAppliedRange(null);
      setHasLoaded(false);
    } finally {
      setLoading(false);
    }
  }, [projectId, dateFrom, dateTo]);

  const loadIngestUrl = useCallback(async () => {
    if (!isSuperAdmin || !projectId) {
      setIngestUrl(null);
      return;
    }
    setIngestLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/program-log-ingest-url`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Could not load ingest URL');
      }
      setIngestUrl(typeof data.ingestUrl === 'string' ? data.ingestUrl : null);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Could not load ingest URL');
      setIngestUrl(null);
    } finally {
      setIngestLoading(false);
    }
  }, [isSuperAdmin, projectId]);

  useEffect(() => {
    void loadIngestUrl();
  }, [loadIngestUrl]);

  const copyIngestUrl = async () => {
    if (!ingestUrl) return;
    try {
      await navigator.clipboard.writeText(ingestUrl);
      toast.success('Ingest URL copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
        No projects available. Create a project first to collect program logs.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ScrollText className="w-7 h-7 shrink-0" />
          Program logs
        </h2>
        {isSuperAdmin ? (
          <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
            Logs sent by your integrations and scripts. Use the ingest URL below to connect a program.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-4 flex-wrap">
        <div className="space-y-2 flex-1 min-w-[12rem] max-w-md">
          <label className="text-sm font-medium">Company</label>
          <Select
            value={companyId || undefined}
            onValueChange={(id) => {
              setCompanyId(id);
              const first = projects.find((p) => p.companyId === id);
              setProjectId(first?.id ?? '');
              setSearch('');
              resetLogResults();
            }}
            disabled={companiesWithProjects.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select company" />
            </SelectTrigger>
            <SelectContent>
              {companiesWithProjects.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex-1 min-w-[12rem] max-w-md">
          <label className="text-sm font-medium">Project</label>
          <Select
            value={projectId || undefined}
            onValueChange={(v) => {
              setProjectId(v);
              setSearch('');
              resetLogResults();
            }}
            disabled={projectsInCompany.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projectsInCompany.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-muted/10 px-4 py-3">
        <span className="text-sm font-medium shrink-0">Date range</span>
        <div className="flex items-center gap-2">
          <label htmlFor="program-logs-from" className="text-sm text-muted-foreground shrink-0">
            From
          </label>
          <Input
            id="program-logs-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              resetLogResults();
            }}
            className="w-[10.5rem]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="program-logs-to" className="text-sm text-muted-foreground shrink-0">
            To
          </label>
          <Input
            id="program-logs-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              resetLogResults();
            }}
            className="w-[10.5rem]"
          />
        </div>
        <Button
          type="button"
          variant="default"
          onClick={() => void loadLogs()}
          disabled={loading || !projectId}
          className="shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span className="ml-2">{hasLoaded ? 'Refresh' : 'Load logs'}</span>
        </Button>
      </div>

      {appliedRange ? (
        <p className="text-xs text-muted-foreground">
          Showing logs from {appliedRange.from} through {appliedRange.to} (up to 200 entries).
        </p>
      ) : null}

      {isSuperAdmin && (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
          <div className="text-sm font-medium">Ingest URL (super admin)</div>
          <p className="text-xs text-muted-foreground">
            Each project has a unique URL. Programs call it with POST; no session cookie is required.
            Treat it like a secret webhook.
          </p>
          <p className="text-xs text-muted-foreground">
            In the JSON body, set <code className="rounded bg-background px-1 py-0.5">level</code> to a short string
            (for example <code className="rounded bg-background px-1 py-0.5">info</code>,{' '}
            <code className="rounded bg-background px-1 py-0.5">warn</code>, or{' '}
            <code className="rounded bg-background px-1 py-0.5">error</code>) for the badge, and{' '}
            <code className="rounded bg-background px-1 py-0.5">message</code> for the preview line. Anything else is
            stored as payload.
          </p>
          {ingestLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading URL…
            </div>
          ) : ingestUrl ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <code className="text-xs break-all flex-1 bg-background border border-border rounded px-2 py-2">
                {ingestUrl}
              </code>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyIngestUrl()}>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Could not resolve ingest URL.</p>
          )}
        </div>
      )}

      <div className="space-y-2 max-w-xl">
        <label htmlFor="program-logs-search" className="text-sm font-medium">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="program-logs-search"
            type="search"
            placeholder="Search by message, level, time, or payload…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            disabled={!hasLoaded || (logs.length === 0 && !loading)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !hasLoaded ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Select company, project, and date range, then click Load logs.
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No logs for this project in the selected date range.
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No logs match your search.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {filteredLogs.map((log) => (
              <li key={log.id} className="p-3 sm:p-4 hover:bg-muted/30 transition-colors">
                <div className="flex gap-3 items-start">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left space-y-1"
                    onClick={() => setExpandedId((id) => (id === log.id ? null : log.id))}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatWhen(log.created_at)}
                      </span>
                      {log.level ? (
                        <span className="text-xs font-medium uppercase tracking-wide text-flame">
                          {log.level}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-sm font-mono break-words">
                      {log.summary || <span className="text-muted-foreground italic">(no summary)</span>}
                    </div>
                  </button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    title="Delete log"
                    disabled={deletingId === log.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      void (async () => {
                        if (!projectId) return;
                        if (!confirm('Delete this log entry?')) return;
                        setDeletingId(log.id);
                        try {
                          const res = await fetch(`/api/projects/${projectId}/program-logs/${log.id}`, {
                            method: 'DELETE',
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            throw new Error(data.error || 'Delete failed');
                          }
                          setLogs((prev) => prev.filter((l) => l.id !== log.id));
                          setExpandedId((id) => (id === log.id ? null : id));
                          toast.success('Log deleted');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Delete failed');
                        } finally {
                          setDeletingId(null);
                        }
                      })();
                    }}
                  >
                    {deletingId === log.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {expandedId === log.id && (
                  <pre className="mt-3 text-xs bg-background/80 border border-border/50 rounded p-3 overflow-x-auto max-h-64 overflow-y-auto">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
