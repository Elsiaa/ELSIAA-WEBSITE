import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALG = "aes-256-gcm";
const KDF_SALT = "company-file-share-v1";

export type CompanyFolderSharePayload = {
  v: 1;
  kind: "folder";
  companyId: string;
  prefix: string;
};

function getSecret(): string {
  return process.env.COMPANY_FILES_SHARE_TOKEN_SECRET?.trim() ?? "";
}

function deriveKey(secret: string): Buffer {
  return scryptSync(secret, KDF_SALT, 32);
}

export function isCompanyFileShareTokenConfigured(): boolean {
  return getSecret().length >= 16;
}

/** Returns null if COMPANY_FILES_SHARE_TOKEN_SECRET is missing or too short. */
export function sealCompanyFolderSharePayload(payload: CompanyFolderSharePayload): string | null {
  const secret = getSecret();
  if (secret.length < 16) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALG, deriveKey(secret), iv);
  const plaintext = JSON.stringify(payload);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openCompanyFolderShareToken(token: string): CompanyFolderSharePayload | null {
  const secret = getSecret();
  if (secret.length < 16) return null;
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 12 + 16 + 1) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = createDecipheriv(ALG, deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
    const o = JSON.parse(plain) as {
      v?: number;
      kind?: string;
      companyId?: string;
      prefix?: string;
    };
    if (o?.v !== 1 || o.kind !== "folder" || !o.companyId || typeof o.prefix !== "string") {
      return null;
    }
    return { v: 1, kind: "folder", companyId: o.companyId, prefix: o.prefix };
  } catch {
    return null;
  }
}
