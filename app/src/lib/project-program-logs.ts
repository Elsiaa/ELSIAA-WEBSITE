/**
 * Program logs (ingest + admin list/delete).
 * ELSIAA schema: `message` + `metadata` (0004_portal_parity).
 * Admin UI types still use Poel names `summary` + `payload`.
 */
import { timingSafeEqual } from "crypto";
import { getServerSupabaseClient } from "@/lib/supabase";

export type ProgramLogRow = {
  id: string;
  project_id: string;
  created_at: string;
  level: string | null;
  summary: string | null;
  payload: Record<string, unknown>;
};

type DbLogRow = {
  id: string;
  project_id: string;
  created_at: string;
  level: string | null;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  summary?: string | null;
  payload?: Record<string, unknown> | null;
};

function mapDbRow(row: DbLogRow): ProgramLogRow {
  const payload =
    (row.payload && typeof row.payload === "object" ? row.payload : null) ??
    (row.metadata && typeof row.metadata === "object" ? row.metadata : null) ??
    {};
  const summary =
    (typeof row.summary === "string" ? row.summary : null) ??
    (typeof row.message === "string" ? row.message : null);
  return {
    id: row.id,
    project_id: row.project_id,
    created_at: row.created_at,
    level: row.level,
    summary,
    payload,
  };
}

function safeTokenEqual(expected: string, received: string): boolean {
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function getProgramLogIngestTokenForProject(
  projectId: string,
): Promise<string | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("program_log_ingest_token")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) return null;
  return (
    (data as { program_log_ingest_token: string | null }).program_log_ingest_token ??
    null
  );
}

export async function verifyProgramLogIngest(
  projectId: string,
  token: string,
): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const expected = await getProgramLogIngestTokenForProject(projectId);
  if (!expected) return false;
  return safeTokenEqual(expected, token);
}

function summarizePayload(payload: unknown): string | null {
  if (payload === null || payload === undefined) return null;
  if (typeof payload === "string") {
    const s = payload.trim();
    return s.length > 500 ? `${s.slice(0, 500)}…` : s;
  }
  if (typeof payload === "object" && !Array.isArray(payload) && payload !== null) {
    const o = payload as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) {
      const s = o.message.trim();
      return s.length > 500 ? `${s.slice(0, 500)}…` : s;
    }
  }
  try {
    const s = JSON.stringify(payload);
    return s.length > 500 ? `${s.slice(0, 500)}…` : s;
  } catch {
    return String(payload).slice(0, 500);
  }
}

function normalizeLevel(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const v = (body as Record<string, unknown>).level;
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, 32);
  return t || null;
}

export async function insertProjectProgramLog(
  projectId: string,
  body: unknown,
): Promise<{ id: string } | null> {
  const payload: Record<string, unknown> =
    body === null || body === undefined
      ? {}
      : typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : { value: body as unknown };

  const level = normalizeLevel(body);
  const message = summarizePayload(body) ?? "";

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_program_logs")
    .insert({
      project_id: projectId,
      level,
      message,
      metadata: payload,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("insertProjectProgramLog:", error);
    return null;
  }
  return { id: (data as { id: string }).id };
}

const MAX_PROGRAM_LOG_RANGE_DAYS = 90;
const DEFAULT_PROGRAM_LOG_RANGE_DAYS = 7;

function parseYmd(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return value;
}

function ymdToLocalStartIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}

function ymdToLocalEndInclusiveIso(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

function parseRpcProgramLogRows(data: unknown): ProgramLogRow[] | null {
  if (data == null) return null;
  if (Array.isArray(data)) return (data as DbLogRow[]).map(mapDbRow);
  if (typeof data === "string") {
    try {
      const parsed: unknown = JSON.parse(data);
      if (Array.isArray(parsed)) return (parsed as DbLogRow[]).map(mapDbRow);
    } catch {
      return null;
    }
  }
  return null;
}

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultProgramLogFromYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - DEFAULT_PROGRAM_LOG_RANGE_DAYS);
  return formatLocalYmd(d);
}

function defaultProgramLogToYmd(): string {
  return formatLocalYmd(new Date());
}

export function resolveProgramLogDateRange(opts: {
  fromYmd?: string;
  toYmd?: string;
}): { fromYmd: string; toYmd: string; fromIso: string; toInclusiveIso: string } {
  let fromYmd = parseYmd(opts.fromYmd) ?? defaultProgramLogFromYmd();
  let toYmd = parseYmd(opts.toYmd) ?? defaultProgramLogToYmd();

  if (fromYmd > toYmd) {
    [fromYmd, toYmd] = [toYmd, fromYmd];
  }

  const fromMs = Date.parse(ymdToLocalStartIso(fromYmd));
  const toMs = Date.parse(ymdToLocalEndInclusiveIso(toYmd));
  const maxSpanMs = MAX_PROGRAM_LOG_RANGE_DAYS * 24 * 60 * 60 * 1000;
  if (toMs - fromMs > maxSpanMs) {
    const cappedFrom = new Date(toMs - maxSpanMs);
    fromYmd = `${cappedFrom.getFullYear()}-${String(cappedFrom.getMonth() + 1).padStart(2, "0")}-${String(cappedFrom.getDate()).padStart(2, "0")}`;
  }

  return {
    fromYmd,
    toYmd,
    fromIso: ymdToLocalStartIso(fromYmd),
    toInclusiveIso: ymdToLocalEndInclusiveIso(toYmd),
  };
}

export async function listProjectProgramLogs(
  projectId: string,
  opts: { limit?: number; fromYmd?: string; toYmd?: string } = {},
): Promise<ProgramLogRow[]> {
  const limit = Math.min(Math.max(opts.limit ?? 200, 1), 500);
  const { fromIso, toInclusiveIso } = resolveProgramLogDateRange({
    fromYmd: opts.fromYmd,
    toYmd: opts.toYmd,
  });

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase.rpc("list_project_program_logs", {
    p_project_id: projectId,
    p_from: fromIso,
    p_to: toInclusiveIso,
    p_limit: limit,
  });

  if (!error) {
    const rpcRows = parseRpcProgramLogRows(data);
    if (rpcRows !== null) return rpcRows;
    if (data != null) {
      console.warn("[program-logs] RPC returned unexpected shape, using direct query");
    }
  } else {
    console.warn("[program-logs] RPC unavailable, using direct query:", error.message);
  }

  // Prefer ELSIAA columns; fall back if a Poel-shaped DB is present.
  let rows: DbLogRow[] | null = null;
  let queryError: { message: string } | null = null;

  {
    const primary = await supabase
      .from("project_program_logs")
      .select("id, project_id, created_at, level, message, metadata")
      .eq("project_id", projectId)
      .gte("created_at", fromIso)
      .lte("created_at", toInclusiveIso)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!primary.error && primary.data) {
      rows = primary.data as DbLogRow[];
    } else {
      if (primary.error) {
        console.warn(
          "[program-logs] message/metadata select failed, trying summary/payload:",
          primary.error.message,
        );
      }
      const fallback = await supabase
        .from("project_program_logs")
        .select("id, project_id, created_at, level, summary, payload")
        .eq("project_id", projectId)
        .gte("created_at", fromIso)
        .lte("created_at", toInclusiveIso)
        .order("created_at", { ascending: false })
        .limit(limit);
      rows = (fallback.data as DbLogRow[] | null) ?? null;
      queryError = fallback.error;
    }
  }

  if (queryError || !rows) {
    if (queryError) console.error("listProjectProgramLogs:", queryError);
    throw new Error(
      queryError?.message ||
        "Failed to list program logs (check project_program_logs columns)",
    );
  }
  return rows.map(mapDbRow);
}

export async function deleteProjectProgramLog(
  projectId: string,
  logId: string,
): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from("project_program_logs")
    .delete()
    .eq("id", logId)
    .eq("project_id", projectId)
    .select("id");

  if (error) {
    console.error("deleteProjectProgramLog:", error);
    return false;
  }
  return Array.isArray(data) && data.length > 0;
}
