/**
 * Elssia Mail API env — master key never leaves the server.
 */

function read(name: string): string | undefined {
  const fromProcess =
    typeof process !== "undefined" ? process.env[name]?.trim() : undefined;
  if (fromProcess) return fromProcess;
  return undefined;
}

const DEFAULT_BASE = "https://mail.elsiaa.com/mail-api";

export function mailEnv() {
  return {
    apiKey: read("ELSSIA_MAIL_API_KEY"),
    apiBase: (read("ELSSIA_MAIL_API_BASE") ?? DEFAULT_BASE).replace(/\/$/, ""),
  };
}

export function mailMasterConfigured(): boolean {
  return Boolean(mailEnv().apiKey);
}

/** Domains allowed for From / mailbox addresses (matches upstream API). */
export const MAIL_ALLOWED_FROM_DOMAINS = ["elsiaa.com"] as const;

/** Bare email from `Name <email@domain>` or raw address. */
export function extractMailAddress(address: string): string {
  const trimmed = address.trim();
  const angle = /<([^>]+)>/.exec(trimmed);
  if (angle?.[1]) return angle[1].trim().toLowerCase();
  return trimmed.toLowerCase();
}

export function isAllowedMailFrom(address: string): boolean {
  const email = extractMailAddress(address);
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1);
  return (MAIL_ALLOWED_FROM_DOMAINS as readonly string[]).includes(domain);
}
