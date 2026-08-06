/** Upstream Elssia Mail API shapes (subset used by the control plane). */

export type MailAccountType = "regular" | "admin" | "transparent";

export type MailAccount = {
  username?: string;
  email?: string;
  name?: string;
  description?: string;
  type?: string;
  emails?: string[];
  aliases?: string[];
  shared_folders?: string[];
};

export type CreateMailAccountInput = {
  email: string;
  password?: string;
  type?: MailAccountType;
  aliases?: string[];
  shared_folders?: string[];
  all_folders?: boolean;
  invite_to?: string;
  description?: string;
};

export type UpdateMailAccountInput = {
  description?: string;
  emails?: string[];
  type?: MailAccountType;
};

export type SetPasswordInput = { password: string } | { generate: true; notify_to?: string };

export type FolderMembersMode = "replace" | "add" | "remove";

export type MailFolder = {
  name?: string;
  email?: string;
  aliases?: string[];
  members?: string[];
  description?: string;
  company_id?: string;
};

export type CreateSharedFolderInput = {
  name: string;
  email: string;
  aliases?: string[];
  members?: string[];
  description?: string;
};

export type CreateCompanyFolderInput = {
  company_id: string;
  email: string;
  members?: string[];
  aliases?: string[];
  description?: string;
};

export type MailAttachment = {
  Name: string;
  Content: string;
  ContentType: string;
};

export type MailSendPayload = {
  From: string;
  To: string | string[];
  Cc?: string | string[];
  Bcc?: string | string[];
  Subject: string;
  HtmlBody?: string;
  TextBody?: string;
  ReplyTo?: string;
  Tag?: string;
  Metadata?: Record<string, string>;
  Headers?: Record<string, string>;
  Attachments?: MailAttachment[];
  TrackOpens?: boolean;
  TrackLinks?: boolean | string;
  MessageStream?: string;
};

export type MailSendBatchPayload = {
  messages: MailSendPayload[];
};

export type MailSendSource = "admin_ui" | "scoped_api" | "transactional";
export type MailSendStatus = "sent" | "failed";

export type MailApiKeyRecord = {
  id: string;
  name: string;
  keyPrefix: string;
  allowAnyFrom: boolean;
  allowedFrom: string[];
  enabled: boolean;
  createdAt: string;
  createdByEmail: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

export type MailSendLogRecord = {
  id: string;
  createdAt: string;
  source: MailSendSource;
  apiKeyId: string | null;
  apiKeyName: string | null;
  fromAddr: string;
  toAddrs: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  status: MailSendStatus;
  providerResponse: string | null;
  error: string | null;
};

export type MailControlStatus = {
  masterConfigured: boolean;
  databaseReady: boolean;
  healthOk: boolean | null;
  healthDetail: string | null;
};

/** JSON-safe opaque result for mutations proxied from the Mail API. */
export type MailApiJson =
  string | number | boolean | null | MailApiJson[] | { [key: string]: MailApiJson };
