// Server-only: quote-request storage + the brief composer.
// Every public submission is validated, summarized into an executive brief,
// and stored in the site's database (table: quote_requests).
import { bindings } from "./bindings.server";

export type QuoteInput = {
  name: string;
  company: string;
  email: string;
  phone: string;
  projectTypes: string[]; // Design / Automation / Software / Consultation
  description: string;
  features: string;
  audience: string;
  budget: string;
  timeline: string;
  notes: string;
};

const MAX = 4000;
const clean = (v: unknown, max = MAX) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

export function parseQuoteInput(body: unknown): QuoteInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const types = Array.isArray(b.projectTypes)
    ? b.projectTypes.map((t) => clean(t, 40)).filter(Boolean).slice(0, 6)
    : [];
  const q: QuoteInput = {
    name: clean(b.name, 120),
    company: clean(b.company, 160),
    email: clean(b.email, 200),
    phone: clean(b.phone, 60),
    projectTypes: types,
    description: clean(b.description),
    features: clean(b.features),
    audience: clean(b.audience, 800),
    budget: clean(b.budget, 60),
    timeline: clean(b.timeline, 60),
    notes: clean(b.notes),
  };
  if (!q.name || !q.email || !q.description || q.projectTypes.length === 0)
    return null;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q.email)) return null;
  return q;
}

/* Compose the executive brief ELSIAA sees on the backend — a clean,
   readable summary distilled from the client's answers. */
export function composeBrief(q: QuoteInput): string {
  const who = q.company ? `${q.name} of ${q.company}` : q.name;
  const divisions = q.projectTypes.join(" + ");
  const sentences: string[] = [];
  sentences.push(
    `${who} is requesting a ${divisions} engagement.`,
  );
  const desc = q.description.replace(/\s+/g, " ").trim();
  sentences.push(`Project: ${desc}${desc.endsWith(".") ? "" : "."}`);
  if (q.features) {
    const feats = q.features.replace(/\s+/g, " ").trim();
    sentences.push(`Key needs: ${feats}${feats.endsWith(".") ? "" : "."}`);
  }
  if (q.audience) {
    const aud = q.audience.replace(/\s+/g, " ").trim();
    sentences.push(`Audience: ${aud}${aud.endsWith(".") ? "" : "."}`);
  }
  const logistics: string[] = [];
  if (q.budget) logistics.push(`budget ${q.budget}`);
  if (q.timeline) logistics.push(`timeline ${q.timeline}`);
  if (logistics.length) sentences.push(`Logistics: ${logistics.join(", ")}.`);
  if (q.notes) {
    const notes = q.notes.replace(/\s+/g, " ").trim();
    sentences.push(`Additional notes: ${notes}${notes.endsWith(".") ? "" : "."}`);
  }
  sentences.push(
    `Reach ${q.name.split(" ")[0]} at ${q.email}${q.phone ? ` or ${q.phone}` : ""}.`,
  );
  return sentences.join(" ");
}

export async function ensureTable() {
  const db = bindings().DB;
  if (!db) throw new Error("database not available");
  await db.exec(
    "CREATE TABLE IF NOT EXISTS quote_requests (id TEXT PRIMARY KEY, created_at TEXT NOT NULL, name TEXT NOT NULL, company TEXT, email TEXT NOT NULL, phone TEXT, project_types TEXT NOT NULL, description TEXT NOT NULL, features TEXT, audience TEXT, budget TEXT, timeline TEXT, notes TEXT, summary TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new')",
  );
  return db;
}

export async function storeQuote(q: QuoteInput) {
  const db = await ensureTable();
  const id = crypto.randomUUID();
  const summary = composeBrief(q);
  await db
    .prepare(
      "INSERT INTO quote_requests (id, created_at, name, company, email, phone, project_types, description, features, audience, budget, timeline, notes, summary) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
    )
    .bind(
      id,
      new Date().toISOString(),
      q.name,
      q.company,
      q.email,
      q.phone,
      q.projectTypes.join(", "),
      q.description,
      q.features,
      q.audience,
      q.budget,
      q.timeline,
      q.notes,
      summary,
    )
    .run();
  return { id, summary };
}

export function isAdmin(request: Request): boolean {
  const key = bindings().ADMIN_KEY;
  if (!key) return false;
  const given =
    request.headers.get("x-admin-key") ??
    new URL(request.url).searchParams.get("key") ??
    "";
  return given === key;
}

export async function listQuotes() {
  const db = await ensureTable();
  const { results } = await db
    .prepare("SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 200")
    .all();
  return results ?? [];
}

export async function setQuoteStatus(id: string, status: string) {
  if (!["new", "reviewed", "quoted", "won", "closed"].includes(status)) return;
  const db = await ensureTable();
  await db
    .prepare("UPDATE quote_requests SET status = ? WHERE id = ?")
    .bind(status, id.slice(0, 64))
    .run();
}
