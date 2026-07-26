import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  requireSuperAdmin,
  requireSuperAdminSupabase,
} from "../admin/session.server";
import {
  supabasePublishableConfigured,
  supabaseSecretConfigured,
} from "../portal/supabase";
import {
  MailApiError,
  createAccount,
  createCompanyFolder,
  createSharedFolder,
  deleteAccount,
  deleteCompanyFolder,
  deleteSharedFolder,
  listAccounts,
  listCompanyFolders,
  listSharedFolders,
  mailHealth,
  patchCompanyFolderMembers,
  patchFolderMembers,
  setAccountFolders,
  setAccountPassword,
  updateAccount,
} from "./client.server";
import { mailMasterConfigured } from "./env";
import {
  createMailApiKey,
  listMailApiKeys,
  revokeMailApiKey,
  updateMailApiKey,
} from "./keys.server";
import { listMailSendLog } from "./log.server";
import { mailDatabaseReady } from "./schema.server";
import { executeScopedOrAdminSend } from "./send.server";
import type { MailControlStatus } from "./types";

function wrapMailError(e: unknown): never {
  if (e instanceof MailApiError) {
    throw new Error(e.message);
  }
  throw e instanceof Error ? e : new Error(String(e));
}

const accountType = z.enum(["regular", "admin", "transparent"]);
const membersMode = z.enum(["replace", "add", "remove"]);

export const getMailControlStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<MailControlStatus> => {
    await requireSuperAdmin();
    const masterConfigured = mailMasterConfigured();
    const databaseReady =
      mailDatabaseReady() &&
      (supabasePublishableConfigured() || supabaseSecretConfigured());
    let healthOk: boolean | null = null;
    let healthDetail: string | null = null;
    if (masterConfigured) {
      const h = await mailHealth();
      healthOk = h.ok;
      healthDetail = h.detail;
    }
    return { masterConfigured, databaseReady, healthOk, healthDetail };
  },
);

export const mailListAccounts = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSuperAdmin();
    try {
      return await listAccounts();
    } catch (e) {
      wrapMailError(e);
    }
  },
);

export const mailCreateAccount = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().optional(),
      type: accountType.optional(),
      aliases: z.array(z.string()).optional(),
      shared_folders: z.array(z.string()).optional(),
      all_folders: z.boolean().optional(),
      invite_to: z.string().email().optional(),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await createAccount(data);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailUpdateAccount = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      description: z.string().optional(),
      emails: z.array(z.string()).optional(),
      type: accountType.optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { username, ...rest } = data;
    try {
      await updateAccount(username, rest);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailDeleteAccount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await deleteAccount(data.username);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailSetAccountPassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.union([
      z.object({
        username: z.string().min(1),
        password: z.string().min(8),
      }),
      z.object({
        username: z.string().min(1),
        generate: z.literal(true),
        notify_to: z.string().email().optional(),
      }),
    ]),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    const { username, ...rest } = data;
    try {
      await setAccountPassword(username, rest as never);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailSetAccountFolders = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().min(1),
      mode: membersMode,
      folders: z.array(z.string()),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await setAccountFolders(data.username, data.mode, data.folders);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailListSharedFolders = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        includeInbox: z.boolean().optional(),
        company: z.boolean().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      return await listSharedFolders(data ?? undefined);
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailCreateSharedFolder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      email: z.string().email(),
      aliases: z.array(z.string()).optional(),
      members: z.array(z.string()).optional(),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await createSharedFolder(data);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailDeleteSharedFolder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      force: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await deleteSharedFolder(data.name, data.force);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailPatchSharedFolderMembers = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      mode: membersMode,
      members: z.array(z.string().min(1)),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await patchFolderMembers(data.name, data.mode, data.members);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailListCompanyFolders = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSuperAdmin();
    try {
      return await listCompanyFolders();
    } catch (e) {
      wrapMailError(e);
    }
  },
);

export const mailCreateCompanyFolder = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      company_id: z.string().min(1),
      email: z.string().email(),
      members: z.array(z.string()).optional(),
      aliases: z.array(z.string()).optional(),
      description: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await createCompanyFolder(data);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailDeleteCompanyFolder = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await deleteCompanyFolder(data.name);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailPatchCompanyFolderMembers = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1),
      mode: membersMode,
      members: z.array(z.string().min(1)),
    }),
  )
  .handler(async ({ data }) => {
    await requireSuperAdmin();
    try {
      await patchCompanyFolderMembers(data.name, data.mode, data.members);
      return { ok: true as const };
    } catch (e) {
      wrapMailError(e);
    }
  });

export const mailAdminSend = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      From: z.string().email(),
      To: z.union([z.string().min(1), z.array(z.string().min(1))]),
      Cc: z.union([z.string(), z.array(z.string())]).optional(),
      Bcc: z.union([z.string(), z.array(z.string())]).optional(),
      Subject: z.string().min(1),
      HtmlBody: z.string().optional(),
      TextBody: z.string().optional(),
      ReplyTo: z.string().optional(),
      Tag: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const result = await executeScopedOrAdminSend({
      payload: data,
      source: "admin_ui",
      logClient: client,
    });
    if (!result.ok) throw new Error(result.error);
    return { ok: true as const };
  });

export const mailListApiKeys = createServerFn({ method: "GET" }).handler(
  async () => {
    const { client } = await requireSuperAdminSupabase();
    return listMailApiKeys(client);
  },
);

export const mailCreateApiKey = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(120),
      allowAnyFrom: z.boolean().optional(),
      allowedFrom: z.array(z.string()).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { session, client } = await requireSuperAdminSupabase();
    return createMailApiKey(client, {
      name: data.name,
      allowAnyFrom: data.allowAnyFrom,
      allowedFrom: data.allowedFrom,
      createdByEmail: session.email,
    });
  });

export const mailUpdateApiKey = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(120).optional(),
      allowAnyFrom: z.boolean().optional(),
      allowedFrom: z.array(z.string()).optional(),
      enabled: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const key = await updateMailApiKey(client, data);
    if (!key) throw new Error("API key not found");
    return key;
  });

export const mailRevokeApiKey = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    const ok = await revokeMailApiKey(client, data.id);
    if (!ok) throw new Error("API key not found or already revoked");
    return { ok: true as const };
  });

export const mailListSendLog = createServerFn({ method: "GET" })
  .inputValidator(
    z
      .object({
        limit: z.number().int().min(1).max(200).optional(),
        source: z.enum(["admin_ui", "scoped_api", "transactional"]).optional(),
        apiKeyId: z.string().uuid().optional(),
      })
      .optional(),
  )
  .handler(async ({ data }) => {
    const { client } = await requireSuperAdminSupabase();
    return listMailSendLog(client, data ?? undefined);
  });
