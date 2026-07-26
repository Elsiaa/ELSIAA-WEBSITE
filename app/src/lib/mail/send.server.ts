/**
 * Shared send path used by admin serverFns and scoped public API.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  MailApiError,
  sendMail,
  sendMailBatch,
  summarizeProviderResponse,
} from "./client.server";
import { isAllowedMailFrom, mailMasterConfigured } from "./env";
import { assertFromAllowedForKey } from "./keys.server";
import { insertMailSendLog } from "./log.server";
import type {
  MailApiJson,
  MailApiKeyRecord,
  MailSendPayload,
  MailSendSource,
} from "./types";

export function normalizeRecipients(
  v: string | string[] | undefined,
): string | string[] | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) return v;
  if (v.includes(",")) {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return v.trim();
}

export async function executeScopedOrAdminSend(opts: {
  payload: MailSendPayload;
  source: MailSendSource;
  apiKey?: Pick<MailApiKeyRecord, "id" | "allowAnyFrom" | "allowedFrom"> | null;
  logClient?: SupabaseClient | null;
}): Promise<
  { ok: true; result: MailApiJson } | { ok: false; status: number; error: string }
> {
  if (!mailMasterConfigured()) {
    return { ok: false, status: 503, error: "ELSSIA_MAIL_API_KEY is not configured" };
  }

  const from = opts.payload.From?.trim() ?? "";
  if (!from) {
    return { ok: false, status: 400, error: "From is required" };
  }
  if (!isAllowedMailFrom(from)) {
    return {
      ok: false,
      status: 403,
      error: "From must be @elsiaa.com",
    };
  }
  if (opts.apiKey) {
    const deny = assertFromAllowedForKey(opts.apiKey, from);
    if (deny) return { ok: false, status: 403, error: deny };
  }

  const payload: MailSendPayload = {
    ...opts.payload,
    From: from,
    To: normalizeRecipients(opts.payload.To) as string | string[],
    Cc: normalizeRecipients(opts.payload.Cc),
    Bcc: normalizeRecipients(opts.payload.Bcc),
  };

  try {
    const result = await sendMail(payload);
    await insertMailSendLog(
      {
        source: opts.source,
        apiKeyId: opts.apiKey?.id ?? null,
        from,
        to: payload.To,
        cc: payload.Cc,
        bcc: payload.Bcc,
        subject: payload.Subject ?? "",
        status: "sent",
        providerResponse: summarizeProviderResponse(result),
      },
      opts.logClient,
    );
    return { ok: true, result };
  } catch (e) {
    const status = e instanceof MailApiError ? e.status : 502;
    const error = e instanceof Error ? e.message : "Send failed";
    await insertMailSendLog(
      {
        source: opts.source,
        apiKeyId: opts.apiKey?.id ?? null,
        from,
        to: payload.To,
        cc: payload.Cc,
        bcc: payload.Bcc,
        subject: payload.Subject ?? "",
        status: "failed",
        error,
        providerResponse:
          e instanceof MailApiError ? summarizeProviderResponse(e.body) : null,
      },
      opts.logClient,
    );
    return { ok: false, status, error };
  }
}

export async function executeScopedOrAdminBatch(opts: {
  messages: MailSendPayload[];
  source: MailSendSource;
  apiKey?: Pick<MailApiKeyRecord, "id" | "allowAnyFrom" | "allowedFrom"> | null;
  logClient?: SupabaseClient | null;
}): Promise<
  { ok: true; result: MailApiJson } | { ok: false; status: number; error: string }
> {
  if (!mailMasterConfigured()) {
    return { ok: false, status: 503, error: "ELSSIA_MAIL_API_KEY is not configured" };
  }
  if (!opts.messages.length) {
    return { ok: false, status: 400, error: "messages required" };
  }
  if (opts.messages.length > 50) {
    return { ok: false, status: 400, error: "max 50 messages per batch" };
  }

  const normalized: MailSendPayload[] = [];
  for (const msg of opts.messages) {
    const from = msg.From?.trim() ?? "";
    if (!from) return { ok: false, status: 400, error: "From is required on each message" };
    if (!isAllowedMailFrom(from)) {
      return {
        ok: false,
        status: 403,
        error: `From must be @elsiaa.com (got ${from})`,
      };
    }
    if (opts.apiKey) {
      const deny = assertFromAllowedForKey(opts.apiKey, from);
      if (deny) return { ok: false, status: 403, error: deny };
    }
    normalized.push({
      ...msg,
      From: from,
      To: normalizeRecipients(msg.To) as string | string[],
      Cc: normalizeRecipients(msg.Cc),
      Bcc: normalizeRecipients(msg.Bcc),
    });
  }

  try {
    const result = await sendMailBatch({ messages: normalized });
    for (const msg of normalized) {
      await insertMailSendLog(
        {
          source: opts.source,
          apiKeyId: opts.apiKey?.id ?? null,
          from: msg.From,
          to: msg.To,
          cc: msg.Cc,
          bcc: msg.Bcc,
          subject: msg.Subject ?? "",
          status: "sent",
          providerResponse: summarizeProviderResponse(result),
        },
        opts.logClient,
      );
    }
    return { ok: true, result };
  } catch (e) {
    const status = e instanceof MailApiError ? e.status : 502;
    const error = e instanceof Error ? e.message : "Batch send failed";
    for (const msg of normalized) {
      await insertMailSendLog(
        {
          source: opts.source,
          apiKeyId: opts.apiKey?.id ?? null,
          from: msg.From,
          to: msg.To,
          cc: msg.Cc,
          bcc: msg.Bcc,
          subject: msg.Subject ?? "",
          status: "failed",
          error,
        },
        opts.logClient,
      );
    }
    return { ok: false, status, error };
  }
}
