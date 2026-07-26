"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  Download,
  Filter,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/components/ui/utils";
import { CircularTaskTimer } from "@/components/time-tracking/circular-task-timer";

type TaskStatus = "todo" | "in_progress" | "review" | "done";

type ClientRow = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
};

type TaskRow = {
  id: string;
  clientId: string;
  title: string;
  status: TaskStatus;
  billable: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type EntryRow = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Review",
  done: "Done",
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function secondsSinceStart(startedAtIso: string, nowMs: number): number {
  const start = new Date(startedAtIso).getTime();
  return Math.max(0, Math.floor((nowMs - start) / 1000));
}

/** Running segment length counted toward "today" (local midnight → now). */
function secondsRunningContributionToday(startedAtIso: string, nowMs: number): number {
  const start = new Date(startedAtIso).getTime();
  const d = new Date(nowMs);
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const from = Math.max(start, startOfDay);
  return Math.max(0, Math.floor((nowMs - from) / 1000));
}

function taskCumulativeSeconds(
  taskId: string,
  closedByTask: Record<string, number>,
  openEntry: EntryRow | undefined,
  nowMs: number
): number {
  const closed = closedByTask[taskId] ?? 0;
  if (!openEntry || openEntry.taskId !== taskId) return closed;
  return closed + secondsSinceStart(openEntry.startedAt, nowMs);
}

type ClosedSegmentRow = {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  createdAt: string;
  taskTitle: string;
  clientName: string;
  billable: boolean;
};

type ReportSortKey =
  | "time_desc"
  | "time_asc"
  | "duration_desc"
  | "duration_asc"
  | "client_asc"
  | "task_asc";

function segmentDurationSec(row: ClosedSegmentRow): number {
  const start = new Date(row.startedAt).getTime();
  const end = row.endedAt ? new Date(row.endedAt).getTime() : start;
  return Math.max(0, Math.floor((end - start) / 1000));
}

function sortReportRowsForDay(rows: ClosedSegmentRow[], key: ReportSortKey): ClosedSegmentRow[] {
  const copy = [...rows];
  const t = (r: ClosedSegmentRow) => new Date(r.startedAt).getTime();
  switch (key) {
    case "time_desc":
      copy.sort((a, b) => t(b) - t(a));
      break;
    case "time_asc":
      copy.sort((a, b) => t(a) - t(b));
      break;
    case "duration_desc":
      copy.sort((a, b) => segmentDurationSec(b) - segmentDurationSec(a));
      break;
    case "duration_asc":
      copy.sort((a, b) => segmentDurationSec(a) - segmentDurationSec(b));
      break;
    case "client_asc":
      copy.sort(
        (a, b) =>
          a.clientName.localeCompare(b.clientName, undefined, { sensitivity: "base" }) || t(b) - t(a),
      );
      break;
    case "task_asc":
      copy.sort(
        (a, b) =>
          a.taskTitle.localeCompare(b.taskTitle, undefined, { sensitivity: "base" }) || t(b) - t(a),
      );
      break;
    default:
      copy.sort((a, b) => t(b) - t(a));
  }
  return copy;
}

function groupReportRowsByLocalDay(rows: ClosedSegmentRow[]): { dayKey: string; dayLabel: string; rows: ClosedSegmentRow[] }[] {
  const map = new Map<string, ClosedSegmentRow[]>();
  for (const r of rows) {
    const d = new Date(r.startedAt);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const list = map.get(dayKey) ?? [];
    list.push(r);
    map.set(dayKey, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dayKey, dayRows]) => {
      const [y, m, d] = dayKey.split("-").map(Number);
      const dt = new Date(y, m - 1, d);
      const dayLabel = dt.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return { dayKey, dayLabel, rows: dayRows };
    });
}

const REPORT_FILTER_SELECT_CLASS = cn(
  "flex h-9 min-w-0 flex-1 rounded-md border border-black/[0.08] bg-input px-3 py-1 text-sm text-[#111] shadow-sm outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "disabled:pointer-events-none disabled:opacity-50",
);
function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function TimeTrackingClient({
  userLabel,
  userEmail,
}: {
  userLabel: string;
  userEmail?: string;
}) {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [runningEntries, setRunningEntries] = useState<EntryRow[]>([]);
  const [todaySeconds, setTodaySeconds] = useState(0);
  const [taskClosedSeconds, setTaskClosedSeconds] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const [newClientName, setNewClientName] = useState("");
  const [newTaskByClient, setNewTaskByClient] = useState<Record<string, string>>({});

  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [reportFrom, setReportFrom] = useState(() => {
    const s = startOfWeek(new Date());
    return s.toISOString().slice(0, 10);
  });
  const [reportTo, setReportTo] = useState(() => {
    const e = endOfWeek(new Date());
    return e.toISOString().slice(0, 10);
  });
  const [reportRows, setReportRows] = useState<ClosedSegmentRow[]>([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportFilterClientId, setReportFilterClientId] = useState("");
  const [reportFilterTaskId, setReportFilterTaskId] = useState("");
  const [reportFilterBillable, setReportFilterBillable] = useState<"all" | "yes" | "no">("all");
  const [reportSearchQuery, setReportSearchQuery] = useState("");
  const [reportSortKey, setReportSortKey] = useState<ReportSortKey>("time_desc");

  const [manualOpen, setManualOpen] = useState(false);
  const [manualTaskId, setManualTaskId] = useState<string | null>(null);
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");
  const [manualNote, setManualNote] = useState("");

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/time-tracking/overview", { cache: "no-store" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to load");
    }
    const data = (await res.json()) as {
      clients: ClientRow[];
      tasks: TaskRow[];
      runningEntries: EntryRow[];
      todaySeconds: number;
      taskClosedSeconds: Record<string, number>;
    };
    setClients(data.clients);
    setTasks(data.tasks);
    setRunningEntries(data.runningEntries ?? []);
    setTodaySeconds(data.todaySeconds);
    setTaskClosedSeconds(data.taskClosedSeconds ?? {});
  }, []);

  const syncRunning = useCallback(async () => {
    const res = await fetch("/api/time-tracking/running-sync", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as {
      runningEntries: EntryRow[];
      todaySeconds: number;
      taskClosedSeconds: Record<string, number>;
    };
    setRunningEntries(data.runningEntries ?? []);
    setTodaySeconds(data.todaySeconds);
    setTaskClosedSeconds(data.taskClosedSeconds ?? {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await loadOverview();
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          toast.error(e instanceof Error ? e.message : "Could not load time tracking");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadOverview]);

  useEffect(() => {
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void syncRunning();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [syncRunning]);

  const displayTodayTotal = useMemo(() => {
    const nowMs = Date.now();
    const runningToday = runningEntries.reduce(
      (acc, e) => acc + secondsRunningContributionToday(e.startedAt, nowMs),
      0
    );
    return todaySeconds + runningToday;
  }, [todaySeconds, runningEntries, tick]);

  const filteredReportRows = useMemo(() => {
    let out = reportRows;
    if (reportFilterClientId) {
      const taskIds = new Set(
        tasks.filter((t) => t.clientId === reportFilterClientId).map((t) => t.id),
      );
      out = out.filter((r) => taskIds.has(r.taskId));
    }
    if (reportFilterTaskId) out = out.filter((r) => r.taskId === reportFilterTaskId);
    if (reportFilterBillable === "yes") out = out.filter((r) => r.billable);
    if (reportFilterBillable === "no") out = out.filter((r) => !r.billable);
    const q = reportSearchQuery.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const note = (r.note ?? "").toLowerCase();
        return (
          r.clientName.toLowerCase().includes(q) ||
          r.taskTitle.toLowerCase().includes(q) ||
          note.includes(q)
        );
      });
    }
    return out;
  }, [
    reportRows,
    reportFilterClientId,
    reportFilterTaskId,
    reportFilterBillable,
    reportSearchQuery,
    tasks,
  ]);

  const reportRowsByDay = useMemo(() => {
    const grouped = groupReportRowsByLocalDay(filteredReportRows);
    return grouped.map(({ dayKey, dayLabel, rows }) => ({
      dayKey,
      dayLabel,
      rows: sortReportRowsForDay(rows, reportSortKey),
    }));
  }, [filteredReportRows, reportSortKey]);

  const filteredRunningEntries = useMemo(() => {
    let list = runningEntries;
    if (reportFilterClientId) {
      const taskIds = new Set(
        tasks.filter((t) => t.clientId === reportFilterClientId).map((t) => t.id),
      );
      list = list.filter((e) => taskIds.has(e.taskId));
    }
    if (reportFilterTaskId) list = list.filter((e) => e.taskId === reportFilterTaskId);
    if (reportFilterBillable !== "all") {
      list = list.filter((e) => {
        const task = tasks.find((t) => t.id === e.taskId);
        if (!task) return false;
        return reportFilterBillable === "yes" ? task.billable : !task.billable;
      });
    }
    const q = reportSearchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const task = tasks.find((t) => t.id === e.taskId);
        const client = clients.find((c) => c.id === task?.clientId);
        const cn = (client?.name ?? "").toLowerCase();
        const tn = (task?.title ?? "").toLowerCase();
        const note = (e.note ?? "").toLowerCase();
        return cn.includes(q) || tn.includes(q) || note.includes(q);
      });
    }
    return list;
  }, [
    runningEntries,
    reportFilterClientId,
    reportFilterTaskId,
    reportFilterBillable,
    reportSearchQuery,
    tasks,
    clients,
  ]);

  const reportFiltersActive =
    Boolean(reportFilterClientId) ||
    Boolean(reportFilterTaskId) ||
    reportFilterBillable !== "all" ||
    Boolean(reportSearchQuery.trim());

  const tasksForReportFilter = useMemo(() => {
    const base = reportFilterClientId
      ? tasks.filter((t) => t.clientId === reportFilterClientId)
      : tasks;
    return [...base].sort((a, b) => {
      const ca = clients.find((c) => c.id === a.clientId)?.name ?? "";
      const cb = clients.find((c) => c.id === b.clientId)?.name ?? "";
      const ccmp = ca.localeCompare(cb, undefined, { sensitivity: "base" });
      if (ccmp !== 0) return ccmp;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }, [tasks, clients, reportFilterClientId]);

  const sortedClientsForReport = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [clients],
  );

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== "done"),
    [tasks]
  );
  const doneTasks = useMemo(() => tasks.filter((t) => t.status === "done"), [tasks]);

  async function handleInstallClick() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    const name = newClientName.trim();
    if (!name) return;
    const res = await fetch("/api/time-tracking/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast.error("Could not add client");
      return;
    }
    setNewClientName("");
    await loadOverview();
    toast.success("Client added");
  }

  async function addTask(clientId: string) {
    const title = (newTaskByClient[clientId] ?? "").trim();
    if (!title) return;
    const res = await fetch("/api/time-tracking/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, title }),
    });
    if (!res.ok) {
      toast.error("Could not add task");
      return;
    }
    setNewTaskByClient((prev) => ({ ...prev, [clientId]: "" }));
    await loadOverview();
    toast.success("Task added");
  }

  async function updateTaskStatus(taskId: string, status: TaskStatus) {
    const res = await fetch(`/api/time-tracking/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error("Could not update status");
      return;
    }
    await loadOverview();
  }

  async function updateTaskBillable(taskId: string, billable: boolean) {
    const res = await fetch(`/api/time-tracking/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billable }),
    });
    if (!res.ok) {
      toast.error("Could not update billable flag");
      return;
    }
    await loadOverview();
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm("Delete this task and its time entries?")) return;
    const res = await fetch(`/api/time-tracking/tasks/${taskId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete task");
      return;
    }
    await loadOverview();
    toast.success("Task deleted");
  }

  async function deleteClient(clientId: string) {
    if (!window.confirm("Delete this client and all tasks and entries?")) return;
    const res = await fetch(`/api/time-tracking/clients/${clientId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete client");
      return;
    }
    await loadOverview();
    toast.success("Client deleted");
  }

  async function startTimer(taskId: string) {
    const res = await fetch("/api/time-tracking/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", taskId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error || "Could not start timer");
      return;
    }
    const data = (await res.json()) as { entry: EntryRow };
    setRunningEntries((prev) => {
      const withoutSameTask = prev.filter((e) => e.taskId !== data.entry.taskId);
      return [...withoutSameTask, { ...data.entry, endedAt: null }];
    });
  }

  async function stopTimer(entryId: string) {
    const res = await fetch("/api/time-tracking/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stop", entryId }),
    });
    if (!res.ok) {
      if (res.status === 404) void syncRunning();
      toast.error("Could not stop timer");
      return;
    }
    const data = (await res.json()) as {
      entry: EntryRow;
      todaySeconds: number;
      taskClosedSeconds: Record<string, number>;
    };
    setRunningEntries((prev) => prev.filter((e) => e.id !== data.entry.id));
    setTodaySeconds(data.todaySeconds);
    setTaskClosedSeconds(data.taskClosedSeconds);
  }

  const loadReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const from = new Date(reportFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(reportTo);
      to.setHours(23, 59, 59, 999);
      const res = await fetch(
        `/api/time-tracking/report?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("Report failed");
      const data = (await res.json()) as { entries: ClosedSegmentRow[] };
      setReportRows(data.entries);
    } catch {
      toast.error("Could not load report");
    } finally {
      setReportLoading(false);
    }
  }, [reportFrom, reportTo]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  function openManual(taskId: string) {
    setManualTaskId(taskId);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setManualStart(local);
    setManualEnd(local);
    setManualNote("");
    setManualOpen(true);
  }

  async function submitManual() {
    if (!manualTaskId || !manualStart || !manualEnd) return;
    const res = await fetch("/api/time-tracking/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: manualTaskId,
        startedAt: new Date(manualStart).toISOString(),
        endedAt: new Date(manualEnd).toISOString(),
        note: manualNote.trim() || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error || "Could not add time");
      return;
    }
    setManualOpen(false);
    const data = (await res.json()) as { taskClosedSeconds?: Record<string, number> };
    if (data.taskClosedSeconds) setTaskClosedSeconds(data.taskClosedSeconds);
    await loadOverview();
    await loadReport();
    toast.success("Time entry added");
  }

  async function deleteReportEntry(entryId: string) {
    if (!window.confirm("Delete this completed time segment? This cannot be undone.")) return;
    const res = await fetch(`/api/time-tracking/entries/${entryId}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error((err as { error?: string }).error || "Could not delete entry");
      return;
    }
    const data = (await res.json()) as {
      taskClosedSeconds?: Record<string, number>;
      todaySeconds?: number;
    };
    if (data.taskClosedSeconds) setTaskClosedSeconds(data.taskClosedSeconds);
    if (typeof data.todaySeconds === "number") setTodaySeconds(data.todaySeconds);
    await loadReport();
    toast.success("Segment deleted");
  }

  const exportHref = useMemo(() => {
    const from = new Date(reportFrom);
    from.setHours(0, 0, 0, 0);
    const to = new Date(reportTo);
    to.setHours(23, 59, 59, 999);
    const q = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    return `/api/time-tracking/export?${q.toString()}`;
  }, [reportFrom, reportTo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F3] text-[#111] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#111]/55">
          <Timer className="w-6 h-6 animate-pulse" />
          Loading time tracking…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3] text-[#111]">
      <header className="border-b border-black/[0.08] bg-white/70 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link href="/portal" aria-label="Back to portal">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight truncate">Time tracking</h1>
              <p className="text-sm text-[#111]/55 truncate">
                {userLabel}
                {userEmail ? ` · ${userEmail}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-sm shadow-sm">
              <span className="text-[#111]/55">Today </span>
              <span className="font-mono font-medium tabular-nums text-[#111]">
                {formatDuration(displayTodayTotal)}
              </span>
            </div>
            {installPrompt && (
              <Button variant="default" onClick={() => void handleInstallClick()}>
                Install app
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Tabs defaultValue="active" className="gap-4">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6 mt-4">
            <form onSubmit={addClient} className="flex flex-col sm:flex-row gap-2 sm:items-end">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="new-client" className="text-sm font-medium">
                  New client
                </label>
                <Input
                  id="new-client"
                  placeholder="e.g. Acme Corp"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <Button type="submit" className="shrink-0">
                <Plus className="w-4 h-4" />
                Add client
              </Button>
            </form>

            {clients.length === 0 ? (
              <p className="text-[#111]/55 text-center py-12 border border-dashed border-black/[0.08] rounded-xl">
                Add a client to start tracking time. Each client can have multiple tasks with play / pause.
              </p>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => {
                  const cTasks = activeTasks.filter((t) => t.clientId === client.id);
                  return (
                    <Collapsible key={client.id} defaultOpen className="rounded-xl border border-black/[0.08] bg-white shadow-sm">
                      <div
                        className="flex items-center gap-2 px-4 py-3 border-b border-black/[0.08]/60"
                        style={{ borderLeftWidth: 4, borderLeftColor: client.color, borderLeftStyle: "solid" }}
                      >
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex-1 text-left font-semibold text-lg hover:opacity-90"
                          >
                            {client.name}
                            <span className="text-[#111]/55 font-normal text-sm ml-2">
                              ({cTasks.length} active task{cTasks.length === 1 ? "" : "s"})
                            </span>
                          </button>
                        </CollapsibleTrigger>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void deleteClient(client.id)}
                          aria-label={`Delete client ${client.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CollapsibleContent>
                        <div className="p-4 space-y-3">
                          {cTasks.map((task) => {
                            const entry = runningEntries.find((e) => e.taskId === task.id);
                            const isRunning = Boolean(entry);
                            const nowMs = Date.now();
                            const cumulative = taskCumulativeSeconds(
                              task.id,
                              taskClosedSeconds,
                              entry,
                              nowMs
                            );
                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  "flex flex-col gap-3 rounded-lg border border-black/[0.08] bg-white p-3 sm:flex-row sm:items-center",
                                  isRunning && "ring-2 ring-primary/30 shadow-sm"
                                )}
                              >
                                <div className="flex-1 min-w-0 space-y-2">
                                  <p className="font-medium truncate">{task.title}</p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <select
                                      className="rounded-md border border-black/[0.08] bg-input px-2 py-1.5 text-sm"
                                      value={task.status}
                                      onChange={(e) =>
                                        void updateTaskStatus(task.id, e.target.value as TaskStatus)
                                      }
                                    >
                                      {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
                                        <option key={s} value={s}>
                                          {STATUS_LABEL[s]}
                                        </option>
                                      ))}
                                    </select>
                                    <label className="flex items-center gap-2 text-sm text-[#111]/55">
                                      <Switch
                                        checked={task.billable}
                                        onCheckedChange={(v) => void updateTaskBillable(task.id, v)}
                                      />
                                      Billable
                                    </label>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openManual(task.id)}
                                  >
                                    <Clock className="w-4 h-4" />
                                    Manual
                                  </Button>
                                  <CircularTaskTimer
                                    size="md"
                                    totalSeconds={cumulative}
                                    running={isRunning}
                                    onPause={() => entry && void stopTimer(entry.id)}
                                    onPlay={() => void startTimer(task.id)}
                                    disabled={task.status === "done"}
                                    aria-label={
                                      isRunning
                                        ? `Pause ${task.title} at ${formatDuration(cumulative)}`
                                        : `Start ${task.title}`
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => void deleteTask(task.id)}
                                    aria-label="Delete task"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          <div className="flex gap-2 pt-1">
                            <Input
                              placeholder="New task…"
                              value={newTaskByClient[client.id] ?? ""}
                              onChange={(e) =>
                                setNewTaskByClient((prev) => ({ ...prev, [client.id]: e.target.value }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void addTask(client.id);
                                }
                              }}
                            />
                            <Button type="button" variant="secondary" onClick={() => void addTask(client.id)}>
                              <Plus className="w-4 h-4" />
                              Task
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="done" className="mt-4 space-y-3">
            {doneTasks.length === 0 ? (
              <p className="text-[#111]/55 text-center py-12 border border-dashed border-black/[0.08] rounded-xl">
                Completed tasks are hidden from the active dashboard. Mark a task &quot;Done&quot; to move it here.
              </p>
            ) : (
              doneTasks.map((task) => {
                const client = clients.find((c) => c.id === task.clientId);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-black/[0.08] bg-white/30 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-[#111]/55">{client?.name ?? "Client"}</p>
                      <p className="text-xs font-mono text-[#111]/55 mt-1 tabular-nums">
                        Logged: {formatDuration(taskClosedSeconds[task.id] ?? 0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void updateTaskStatus(task.id, "todo")}
                      >
                        Reopen
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => void deleteTask(task.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="space-y-1">
                <label className="text-sm font-medium">From</label>
                <Input type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">To</label>
                <Input type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
              </div>
              <Button variant="secondary" onClick={() => void loadReport()} disabled={reportLoading}>
                <CalendarRange className="w-4 h-4" />
                {reportLoading ? "Loading…" : "Refresh"}
              </Button>
              <Button variant="outline" asChild>
                <a href={exportHref}>
                  <Download className="w-4 h-4" />
                  CSV
                </a>
              </Button>
            </div>

            <div className="rounded-xl border border-black/[0.08] bg-white/50 px-4 py-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[#111]">
                  <Filter className="w-4 h-4 text-[#111]/55 shrink-0" aria-hidden />
                  <span>Filter & sort</span>
                  <span className="text-xs font-normal text-[#111]/55 hidden sm:inline">
                    Applies to completed segments and the in-progress table.
                  </span>
                </div>
                {reportFiltersActive && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[#111]/55 shrink-0"
                    onClick={() => {
                      setReportFilterClientId("");
                      setReportFilterTaskId("");
                      setReportFilterBillable("all");
                      setReportSearchQuery("");
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1 min-w-0">
                  <label htmlFor="report-filter-client" className="text-xs font-medium text-[#111]/55">
                    Client
                  </label>
                  <select
                    id="report-filter-client"
                    className={REPORT_FILTER_SELECT_CLASS}
                    value={reportFilterClientId}
                    onChange={(e) => {
                      setReportFilterClientId(e.target.value);
                      setReportFilterTaskId("");
                    }}
                  >
                    <option value="">All clients</option>
                    {sortedClientsForReport.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 min-w-0">
                  <label htmlFor="report-filter-task" className="text-xs font-medium text-[#111]/55">
                    Task / project
                  </label>
                  <select
                    id="report-filter-task"
                    className={REPORT_FILTER_SELECT_CLASS}
                    value={reportFilterTaskId}
                    onChange={(e) => setReportFilterTaskId(e.target.value)}
                  >
                    <option value="">All tasks</option>
                    {tasksForReportFilter.map((t) => (
                      <option key={t.id} value={t.id}>
                        {!reportFilterClientId
                          ? `${clients.find((c) => c.id === t.clientId)?.name ?? "Client"} — ${t.title}`
                          : t.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 min-w-0">
                  <label htmlFor="report-filter-billable" className="text-xs font-medium text-[#111]/55">
                    Billable
                  </label>
                  <select
                    id="report-filter-billable"
                    className={REPORT_FILTER_SELECT_CLASS}
                    value={reportFilterBillable}
                    onChange={(e) => setReportFilterBillable(e.target.value as "all" | "yes" | "no")}
                  >
                    <option value="all">All</option>
                    <option value="yes">Billable only</option>
                    <option value="no">Non-billable only</option>
                  </select>
                </div>
                <div className="space-y-1 min-w-0">
                  <label htmlFor="report-sort" className="text-xs font-medium text-[#111]/55">
                    Sort within each day
                  </label>
                  <select
                    id="report-sort"
                    className={REPORT_FILTER_SELECT_CLASS}
                    value={reportSortKey}
                    onChange={(e) => setReportSortKey(e.target.value as ReportSortKey)}
                  >
                    <option value="time_desc">Start time · newest first</option>
                    <option value="time_asc">Start time · oldest first</option>
                    <option value="duration_desc">Duration · longest first</option>
                    <option value="duration_asc">Duration · shortest first</option>
                    <option value="client_asc">Client name (A–Z)</option>
                    <option value="task_asc">Task name (A–Z)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="report-search" className="text-xs font-medium text-[#111]/55">
                  Search
                </label>
                <Input
                  id="report-search"
                  placeholder="Client, task, or note…"
                  value={reportSearchQuery}
                  onChange={(e) => setReportSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {runningEntries.length > 0 && (
              <section className="rounded-xl border-2 border-primary/35 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-black/[0.08] bg-black/[0.06]/30 px-4 py-3">
                  <h2 className="text-base font-semibold text-[#111]">In progress</h2>
                  <p className="text-xs text-[#111]/55 mt-1">
                    Timers still running. They stay here until you pause; completed segments appear in the day sections
                    below.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/[0.06]/40 text-left text-[#111]/55">
                      <tr>
                        <th className="p-3 font-medium">Client</th>
                        <th className="p-3 font-medium">Task</th>
                        <th className="p-3 font-medium">Started</th>
                        <th className="p-3 font-medium">This session</th>
                        <th className="p-3 font-medium w-[5.5rem]">Timer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRunningEntries.length === 0 && reportFiltersActive ? (
                        <tr className="border-t border-black/[0.08]/60 bg-white">
                          <td colSpan={5} className="p-4 text-center text-sm text-[#111]/55">
                            No in-progress timers match your filters ({runningEntries.length} running).
                          </td>
                        </tr>
                      ) : (
                        filteredRunningEntries.map((entry) => {
                          const task = tasks.find((t) => t.id === entry.taskId);
                          const client = clients.find((c) => c.id === task?.clientId);
                          const nowMs = Date.now();
                          const sessionSec = secondsSinceStart(entry.startedAt, nowMs);
                          const cumulative = taskCumulativeSeconds(
                            entry.taskId,
                            taskClosedSeconds,
                            entry,
                            nowMs
                          );
                          return (
                            <tr key={entry.id} className="border-t border-black/[0.08]/60 bg-white">
                              <td className="p-3 align-middle">{client?.name ?? "—"}</td>
                              <td className="p-3 align-middle font-medium">{task?.title ?? "—"}</td>
                              <td className="p-3 align-middle font-mono text-xs whitespace-nowrap">
                                {new Date(entry.startedAt).toLocaleString()}
                              </td>
                              <td className="p-3 align-middle font-mono tabular-nums text-[#111]/55">
                                {formatDuration(sessionSec)}
                              </td>
                              <td className="p-3 align-middle">
                                <CircularTaskTimer
                                  size="sm"
                                  totalSeconds={cumulative}
                                  running
                                  onPause={() => void stopTimer(entry.id)}
                                  onPlay={() => void startTimer(entry.taskId)}
                                  aria-label={`Pause ${task?.title ?? "task"}`}
                                />
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {reportRowsByDay.length === 0 ? (
              <p className="text-[#111]/55 text-center py-10 border border-dashed border-black/[0.08] rounded-xl text-sm">
                {reportRows.length === 0
                  ? runningEntries.length > 0
                    ? "No completed segments in this date range — see In progress above for active timers."
                    : "No completed segments in this date range. Start a timer or add a manual entry."
                  : "No completed segments match your filters. Clear filters or widen the date range."}
              </p>
            ) : (
              reportRowsByDay.map(({ dayKey, dayLabel, rows }) => {
                const dayTotal = rows.reduce((acc, row) => acc + segmentDurationSec(row), 0);
                return (
                  <section key={dayKey} className="rounded-xl border border-black/[0.08] bg-white shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.08] bg-black/[0.06]/40 px-4 py-3">
                      <h2 className="text-base font-semibold text-[#111]">{dayLabel}</h2>
                      <span className="text-sm text-[#111]/55">
                        Day total:{" "}
                        <span className="font-mono font-medium tabular-nums text-[#111]">
                          {formatDuration(dayTotal)}
                        </span>
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white text-left text-[#111]/55">
                          <tr>
                            <th className="p-3 font-medium">Start</th>
                            <th className="p-3 font-medium">End</th>
                            <th className="p-3 font-medium">Duration</th>
                            <th className="p-3 font-medium">Client</th>
                            <th className="p-3 font-medium">Task</th>
                            <th className="p-3 font-medium">Billable</th>
                            <th className="p-3 font-medium">Note</th>
                            <th className="p-3 w-12 text-right font-medium">
                              <span className="sr-only">Delete</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => {
                            const sec = segmentDurationSec(row);
                            return (
                              <tr key={row.id} className="border-t border-black/[0.08]/60">
                                <td className="p-3 font-mono text-xs whitespace-nowrap">
                                  {new Date(row.startedAt).toLocaleTimeString(undefined, {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="p-3 font-mono text-xs whitespace-nowrap">
                                  {row.endedAt
                                    ? new Date(row.endedAt).toLocaleTimeString(undefined, {
                                        hour: "numeric",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </td>
                                <td className="p-3 font-mono tabular-nums text-[#111]">{formatDuration(sec)}</td>
                                <td className="p-3">{row.clientName}</td>
                                <td className="p-3">{row.taskTitle}</td>
                                <td className="p-3">{row.billable ? "Yes" : "No"}</td>
                                <td className="p-3 text-[#111]/55 max-w-[200px] truncate" title={row.note ?? ""}>
                                  {row.note || "—"}
                                </td>
                                <td className="p-2 text-right align-middle">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-[#111]/55 hover:text-destructive"
                                    onClick={() => void deleteReportEntry(row.id)}
                                    aria-label="Delete this time segment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })
            )}

            {reportRows.length > 0 && (
              <div className="text-sm text-[#111]/55 space-y-1">
                {filteredReportRows.length > 0 ? (
                  <p>
                    {reportFiltersActive ? "Filtered completed total" : "Completed in range"}:{" "}
                    <strong className="text-[#111] font-mono tabular-nums">
                      {formatDuration(
                        filteredReportRows.reduce((acc, row) => acc + segmentDurationSec(row), 0),
                      )}
                    </strong>
                  </p>
                ) : reportFiltersActive ? (
                  <p>No completed time matches the filters above.</p>
                ) : null}
                {reportFiltersActive && (
                  <p className="text-xs">
                    Full range total (ignoring filters):{" "}
                    <span className="font-mono tabular-nums text-[#111]">
                      {formatDuration(reportRows.reduce((acc, row) => acc + segmentDurationSec(row), 0))}
                    </span>
                    {" · "}
                    CSV export still includes every completed segment in the date range, not only what you see here.
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual time entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Start</label>
              <Input
                type="datetime-local"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">End</label>
              <Input type="datetime-local" value={manualEnd} onChange={(e) => setManualEnd(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optional)</label>
              <Input value={manualNote} onChange={(e) => setManualNote(e.target.value)} placeholder="What did you do?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void submitManual()}>Save entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
