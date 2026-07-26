/**
 * Server-only proxy to the Elssia Mail API (master key).
 */
import { mailEnv, mailMasterConfigured } from "./env";
import type {
  CreateCompanyFolderInput,
  CreateMailAccountInput,
  CreateSharedFolderInput,
  FolderMembersMode,
  MailAccount,
  MailApiJson,
  MailFolder,
  MailSendBatchPayload,
  MailSendPayload,
  SetPasswordInput,
  UpdateMailAccountInput,
} from "./types";

export class MailApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "MailApiError";
    this.status = status;
    this.body = body;
  }
}

function asJson(body: unknown): MailApiJson {
  return JSON.parse(JSON.stringify(body ?? null)) as MailApiJson;
}

function asStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map(String);
}

function normalizeAccount(raw: Record<string, unknown>): MailAccount {
  return {
    username: typeof raw.username === "string" ? raw.username : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    name: typeof raw.name === "string" ? raw.name : undefined,
    description: typeof raw.description === "string" ? raw.description : undefined,
    type: typeof raw.type === "string" ? raw.type : undefined,
    emails: asStringArray(raw.emails),
    aliases: asStringArray(raw.aliases),
    shared_folders: asStringArray(raw.shared_folders),
  };
}

function normalizeFolder(raw: Record<string, unknown>): MailFolder {
  return {
    name: typeof raw.name === "string" ? raw.name : undefined,
    email: typeof raw.email === "string" ? raw.email : undefined,
    aliases: asStringArray(raw.aliases),
    members: asStringArray(raw.members),
    description: typeof raw.description === "string" ? raw.description : undefined,
    company_id: typeof raw.company_id === "string" ? raw.company_id : undefined,
  };
}

function requireMasterKey(): { apiKey: string; apiBase: string } {
  const { apiKey, apiBase } = mailEnv();
  if (!apiKey) {
    throw new MailApiError("ELSSIA_MAIL_API_KEY is not configured", 503, null);
  }
  return { apiKey, apiBase };
}

async function mailFetch(
  path: string,
  init?: RequestInit & { query?: Record<string, string | boolean | undefined> },
): Promise<unknown> {
  const { apiKey, apiBase } = requireMasterKey();
  const url = new URL(
    path.startsWith("http") ? path : `${apiBase}${path.startsWith("/") ? path : `/${path}`}`,
  );
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const { query: _q, ...rest } = init ?? {};
  const res = await fetch(url.toString(), {
    ...rest,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(rest.body ? { "Content-Type": "application/json" } : {}),
      ...(rest.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }
  if (!res.ok) {
    const msg =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof (body as { error: unknown }).error === "string"
        ? (body as { error: string }).error
        : typeof body === "string"
          ? body.slice(0, 200)
          : `Mail API ${res.status}`;
    throw new MailApiError(msg, res.status, body);
  }
  return body;
}

export async function mailHealth(): Promise<{ ok: boolean; detail: string }> {
  if (!mailMasterConfigured()) {
    return { ok: false, detail: "ELSSIA_MAIL_API_KEY not set" };
  }
  const { apiBase } = mailEnv();
  try {
    const res = await fetch(`${apiBase}/health`, {
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    return {
      ok: res.ok,
      detail: text.slice(0, 200) || (res.ok ? "ok" : `HTTP ${res.status}`),
    };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : "health check failed",
    };
  }
}

export async function listAccounts(): Promise<MailAccount[]> {
  const data = await mailFetch("/v1/accounts");
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { accounts?: unknown }).accounts)
      ? (data as { accounts: unknown[] }).accounts
      : [];
  return list
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map(normalizeAccount);
}

export async function getAccount(username: string): Promise<MailAccount> {
  const data = await mailFetch(`/v1/accounts/${encodeURIComponent(username)}`);
  return normalizeAccount(
    data && typeof data === "object" ? (data as Record<string, unknown>) : {},
  );
}

export async function createAccount(
  input: CreateMailAccountInput,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch("/v1/accounts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function updateAccount(
  username: string,
  input: UpdateMailAccountInput,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/accounts/${encodeURIComponent(username)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteAccount(username: string): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/accounts/${encodeURIComponent(username)}`, {
      method: "DELETE",
    }),
  );
}

export async function setAccountPassword(
  username: string,
  input: SetPasswordInput,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/accounts/${encodeURIComponent(username)}/password`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function setAccountFolders(
  username: string,
  mode: FolderMembersMode,
  folders: string[],
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/accounts/${encodeURIComponent(username)}/folders`, {
      method: "PUT",
      body: JSON.stringify({ mode, folders }),
    }),
  );
}

export async function listSharedFolders(opts?: {
  includeInbox?: boolean;
  company?: boolean;
}): Promise<MailFolder[]> {
  const data = await mailFetch("/v1/folders", {
    query: {
      include_inbox: opts?.includeInbox,
      company: opts?.company,
    },
  });
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { folders?: unknown }).folders)
      ? (data as { folders: unknown[] }).folders
      : [];
  return list
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map(normalizeFolder);
}

export async function createSharedFolder(
  input: CreateSharedFolderInput,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch("/v1/folders", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteSharedFolder(
  name: string,
  force?: boolean,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/folders/${encodeURIComponent(name)}`, {
      method: "DELETE",
      query: { force: force ? true : undefined },
    }),
  );
}

export async function patchFolderMembers(
  name: string,
  mode: FolderMembersMode,
  members: string[],
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/folders/${encodeURIComponent(name)}/members`, {
      method: "PATCH",
      body: JSON.stringify({ mode, members }),
    }),
  );
}

export async function listCompanyFolders(): Promise<MailFolder[]> {
  const data = await mailFetch("/v1/company-folders");
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { folders?: unknown }).folders)
      ? (data as { folders: unknown[] }).folders
      : [];
  return list
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map(normalizeFolder);
}

export async function createCompanyFolder(
  input: CreateCompanyFolderInput,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch("/v1/company-folders", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteCompanyFolder(name: string): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/company-folders/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }),
  );
}

export async function patchCompanyFolderMembers(
  name: string,
  mode: FolderMembersMode,
  members: string[],
): Promise<MailApiJson> {
  return asJson(
    await mailFetch(`/v1/company-folders/${encodeURIComponent(name)}/members`, {
      method: "PATCH",
      body: JSON.stringify({ mode, members }),
    }),
  );
}

export async function sendMail(payload: MailSendPayload): Promise<MailApiJson> {
  return asJson(
    await mailFetch("/v1/send", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function sendMailBatch(
  payload: MailSendBatchPayload,
): Promise<MailApiJson> {
  return asJson(
    await mailFetch("/v1/send/batch", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function summarizeProviderResponse(body: unknown): string {
  if (body == null) return "";
  if (typeof body === "string") return body.slice(0, 500);
  try {
    return JSON.stringify(body).slice(0, 500);
  } catch {
    return String(body).slice(0, 500);
  }
}
