import { getServerSupabaseClient } from '@/lib/supabase';

export type TimeTrackingTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface TimeTrackingClient {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
}

export interface TimeTrackingTask {
  id: string;
  clientId: string;
  title: string;
  status: TimeTrackingTaskStatus;
  billable: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeTrackingEntry {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt: string | null;
  note: string | null;
  createdAt: string;
}

function mapClient(row: {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}): TimeTrackingClient {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapTask(row: {
  id: string;
  client_id: string;
  title: string;
  status: TimeTrackingTaskStatus;
  billable: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}): TimeTrackingTask {
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    status: row.status,
    billable: row.billable,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEntry(row: {
  id: string;
  task_id: string;
  started_at: string;
  ended_at: string | null;
  note: string | null;
  created_at: string;
}): TimeTrackingEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function listClientsForUser(authUserId: string): Promise<TimeTrackingClient[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('time_tracking_clients')
    .select('id, name, color, sort_order, created_at')
    .eq('auth_user_id', authUserId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapClient);
}

export async function createClient(
  authUserId: string,
  input: { name: string; color?: string }
): Promise<TimeTrackingClient> {
  const supabase = getServerSupabaseClient();
  const { count } = await supabase
    .from('time_tracking_clients')
    .select('*', { count: 'exact', head: true })
    .eq('auth_user_id', authUserId);

  const sortOrder = count ?? 0;
  const { data, error } = await supabase
    .from('time_tracking_clients')
    .insert({
      auth_user_id: authUserId,
      name: input.name.trim(),
      color: input.color?.trim() || '#6366f1',
      sort_order: sortOrder,
    })
    .select('id, name, color, sort_order, created_at')
    .single();

  if (error) throw error;
  return mapClient(data);
}

export async function updateClient(
  authUserId: string,
  clientId: string,
  patch: { name?: string; color?: string; sortOrder?: number }
): Promise<void> {
  const supabase = getServerSupabaseClient();
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name.trim();
  if (patch.color !== undefined) row.color = patch.color.trim();
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;

  if (Object.keys(row).length === 0) return;

  const { error } = await supabase
    .from('time_tracking_clients')
    .update(row)
    .eq('id', clientId)
    .eq('auth_user_id', authUserId);

  if (error) throw error;
}

export async function deleteClient(authUserId: string, clientId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('time_tracking_clients')
    .delete()
    .eq('id', clientId)
    .eq('auth_user_id', authUserId);

  if (error) throw error;
}

export async function listTasksForUser(authUserId: string): Promise<TimeTrackingTask[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('time_tracking_tasks')
    .select('id, client_id, title, status, billable, notes, created_at, updated_at')
    .eq('auth_user_id', authUserId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function createTask(
  authUserId: string,
  input: { clientId: string; title: string; status?: TimeTrackingTaskStatus; billable?: boolean; notes?: string | null }
): Promise<TimeTrackingTask> {
  const supabase = getServerSupabaseClient();
  const { data: client, error: clientErr } = await supabase
    .from('time_tracking_clients')
    .select('id')
    .eq('id', input.clientId)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (clientErr) throw clientErr;
  if (!client) throw new Error('Client not found');

  const { data, error } = await supabase
    .from('time_tracking_tasks')
    .insert({
      client_id: input.clientId,
      auth_user_id: authUserId,
      title: input.title.trim(),
      status: input.status ?? 'todo',
      billable: input.billable ?? true,
      notes: input.notes?.trim() || null,
    })
    .select('id, client_id, title, status, billable, notes, created_at, updated_at')
    .single();

  if (error) throw error;
  return mapTask(data);
}

export async function updateTask(
  authUserId: string,
  taskId: string,
  patch: Partial<{
    title: string;
    status: TimeTrackingTaskStatus;
    billable: boolean;
    notes: string | null;
    clientId: string;
  }>
): Promise<void> {
  const supabase = getServerSupabaseClient();
  if (patch.clientId) {
    const { data: client, error: clientErr } = await supabase
      .from('time_tracking_clients')
      .select('id')
      .eq('id', patch.clientId)
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (clientErr) throw clientErr;
    if (!client) throw new Error('Client not found');
  }

  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title.trim();
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.billable !== undefined) row.billable = patch.billable;
  if (patch.notes !== undefined) row.notes = patch.notes?.trim() || null;
  if (patch.clientId !== undefined) row.client_id = patch.clientId;

  if (Object.keys(row).length === 0) return;

  if (patch.status === 'done') {
    await stopOpenEntriesForTask(authUserId, taskId, new Date());
  }

  const { error } = await supabase
    .from('time_tracking_tasks')
    .update(row)
    .eq('id', taskId)
    .eq('auth_user_id', authUserId);

  if (error) throw error;
}

export async function deleteTask(authUserId: string, taskId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase.from('time_tracking_tasks').delete().eq('id', taskId).eq('auth_user_id', authUserId);

  if (error) throw error;
}

/** All open (running) time entries for this user — multiple tasks may run at once. */
export async function getRunningEntries(authUserId: string): Promise<TimeTrackingEntry[]> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .select('id, task_id, started_at, ended_at, note, created_at')
    .eq('auth_user_id', authUserId)
    .is('ended_at', null)
    .order('started_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

async function stopOpenEntriesForTask(authUserId: string, taskId: string, endAt: Date): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('time_tracking_entries')
    .update({ ended_at: endAt.toISOString() })
    .eq('auth_user_id', authUserId)
    .eq('task_id', taskId)
    .is('ended_at', null);

  if (error) throw error;
}

export async function startTimer(authUserId: string, taskId: string): Promise<TimeTrackingEntry> {
  const supabase = getServerSupabaseClient();
  const { data: task, error: taskErr } = await supabase
    .from('time_tracking_tasks')
    .select('id, status')
    .eq('id', taskId)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (taskErr) throw taskErr;
  if (!task) throw new Error('Task not found');
  if (task.status === 'done') throw new Error('Cannot start timer on a completed task');

  const now = new Date();
  await stopOpenEntriesForTask(authUserId, taskId, now);

  const { data, error } = await supabase
    .from('time_tracking_entries')
    .insert({
      task_id: taskId,
      auth_user_id: authUserId,
      started_at: now.toISOString(),
      ended_at: null,
    })
    .select('id, task_id, started_at, ended_at, note, created_at')
    .single();

  if (error) throw error;
  return mapEntry(data);
}

export async function stopTimerByEntryId(
  authUserId: string,
  entryId: string
): Promise<{
  entry: TimeTrackingEntry;
  todaySeconds: number;
  taskClosedSeconds: Record<string, number>;
} | null> {
  const supabase = getServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .update({ ended_at: now })
    .eq('id', entryId)
    .eq('auth_user_id', authUserId)
    .is('ended_at', null)
    .select('id, task_id, started_at, ended_at, note, created_at')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const entry = mapEntry(data);
  const [todaySeconds, taskClosedSeconds] = await Promise.all([
    sumSecondsToday(authUserId),
    getClosedSecondsPerTask(authUserId),
  ]);
  return { entry, todaySeconds, taskClosedSeconds };
}

export async function addManualEntry(
  authUserId: string,
  input: { taskId: string; startedAt: string; endedAt: string; note?: string | null }
): Promise<TimeTrackingEntry> {
  const supabase = getServerSupabaseClient();
  const { data: task, error: taskErr } = await supabase
    .from('time_tracking_tasks')
    .select('id')
    .eq('id', input.taskId)
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (taskErr) throw taskErr;
  if (!task) throw new Error('Task not found');

  const start = new Date(input.startedAt);
  const end = new Date(input.endedAt);
  if (!(end.getTime() > start.getTime())) throw new Error('End time must be after start time');

  const { data, error } = await supabase
    .from('time_tracking_entries')
    .insert({
      task_id: input.taskId,
      auth_user_id: authUserId,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      note: input.note?.trim() || null,
    })
    .select('id, task_id, started_at, ended_at, note, created_at')
    .single();

  if (error) throw error;
  return mapEntry(data);
}

/** Deletes a completed segment only (`ended_at` set). Running entries are not deleted here. */
export async function deleteClosedEntryById(authUserId: string, entryId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .delete()
    .eq('id', entryId)
    .eq('auth_user_id', authUserId)
    .not('ended_at', 'is', null)
    .select('id')
    .maybeSingle();

  if (error) throw error;
  return data != null;
}

export async function listEntriesInRange(
  authUserId: string,
  fromIso: string,
  toIso: string
): Promise<(TimeTrackingEntry & { taskTitle: string; clientName: string; billable: boolean })[]> {
  const supabase = getServerSupabaseClient();
  const { data: entries, error } = await supabase
    .from('time_tracking_entries')
    .select('id, task_id, started_at, ended_at, note, created_at')
    .eq('auth_user_id', authUserId)
    .not('ended_at', 'is', null)
    .gte('started_at', fromIso)
    .lte('started_at', toIso)
    .order('started_at', { ascending: false });

  if (error) throw error;
  if (!entries?.length) return [];

  const taskIds = [...new Set(entries.map((e) => e.task_id))];
  const { data: tasks, error: taskErr } = await supabase
    .from('time_tracking_tasks')
    .select('id, title, billable, client_id')
    .in('id', taskIds)
    .eq('auth_user_id', authUserId);

  if (taskErr) throw taskErr;

  const clientIds = [...new Set((tasks ?? []).map((t) => t.client_id))];
  const { data: clients, error: clientErr } = await supabase
    .from('time_tracking_clients')
    .select('id, name')
    .in('id', clientIds)
    .eq('auth_user_id', authUserId);

  if (clientErr) throw clientErr;

  const taskMap = new Map((tasks ?? []).map((t) => [t.id, t]));
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));

  return entries.map((row) => {
    const t = taskMap.get(row.task_id);
    const clientName = t ? clientMap.get(t.client_id) ?? '—' : '—';
    return {
      ...mapEntry(row),
      taskTitle: t?.title ?? '—',
      clientName,
      billable: t?.billable ?? true,
    };
  });
}

export function secondsForEntry(entry: TimeTrackingEntry, nowMs: number): number {
  const start = new Date(entry.startedAt).getTime();
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : nowMs;
  return Math.max(0, Math.floor((end - start) / 1000));
}

/** Total seconds from completed segments, aggregated per task (all time). */
export async function getClosedSecondsPerTask(authUserId: string): Promise<Record<string, number>> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('time_tracking_entries')
    .select('task_id, started_at, ended_at')
    .eq('auth_user_id', authUserId)
    .not('ended_at', 'is', null);

  if (error) throw error;
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const a = new Date(row.started_at).getTime();
    const b = new Date(row.ended_at as string).getTime();
    const sec = Math.max(0, Math.floor((b - a) / 1000));
    const tid = row.task_id as string;
    out[tid] = (out[tid] ?? 0) + sec;
  }
  return out;
}

export async function sumSecondsToday(authUserId: string): Promise<number> {
  const supabase = getServerSupabaseClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const fromIso = startOfDay.toISOString();

  const { data, error } = await supabase
    .from('time_tracking_entries')
    .select('id, started_at, ended_at')
    .eq('auth_user_id', authUserId)
    .gte('started_at', fromIso)
    .not('ended_at', 'is', null);

  if (error) throw error;

  let total = 0;
  for (const row of data ?? []) {
    const started = new Date(row.started_at).getTime();
    const ended = row.ended_at ? new Date(row.ended_at).getTime() : started;
    total += Math.max(0, Math.floor((ended - started) / 1000));
  }

  return total;
}
