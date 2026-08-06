/**
 * Branding for ELSIAA on operational surfaces (emails, PDFs, app chrome).
 * This product is ELSIAA-only — never inherit Poel (or other) brand names.
 */

import fs from "fs";
import path from "path";
import { brandLogoFiles } from "@/lib/poel-theme";

const DEFAULT_BRAND = "ELSIAA";

function sanitizeBrandName(raw: string | undefined): string | undefined {
  const name = raw?.trim();
  if (!name) return undefined;
  // Separate company: reject accidental Poel env leftovers.
  if (/poel/i.test(name)) return undefined;
  return name;
}

export function getOperationalBrandName(): string {
  return (
    sanitizeBrandName(process.env.NEXT_PUBLIC_OPERATIONAL_BRAND_NAME) ||
    sanitizeBrandName(process.env.OPERATIONAL_BRAND_NAME) ||
    DEFAULT_BRAND
  );
}

export function getOperationalTeamLine(): string {
  return `${getOperationalBrandName()} Team`;
}

/** Platform label for invitations and system emails */
export function getOperationalPlatformName(): string {
  const label = sanitizeBrandName(process.env.OPERATIONAL_PLATFORM_LABEL);
  return label || `${getOperationalBrandName()} portal`;
}

export function getOperationalLogoUrl(baseUrl: string, kind: "full" | "icon"): string {
  const root = baseUrl.replace(/\/$/, "");
  const p = kind === "full" ? brandLogoFiles.full : brandLogoFiles.icon;
  return `${root}${p}`;
}

/**
 * For pdfmake / attachments: first file that exists on disk.
 */
export function readOperationalLogoBase64ForPdf(): string | undefined {
  const candidates = [
    path.join(process.cwd(), "public", "assets", "elsiaa-lion.png"),
    path.join(process.cwd(), "public", "assets", "hero_lion.png"),
  ];
  for (const logoPath of candidates) {
    try {
      if (fs.existsSync(logoPath)) {
        return fs.readFileSync(logoPath).toString("base64");
      }
    } catch {
      /* try next */
    }
  }
  return undefined;
}

export function getSmtpFromDisplayName(): string {
  return sanitizeBrandName(process.env.SMTP_FROM_NAME) || getOperationalBrandName();
}

function sanitizeSenderEmail(raw: string | undefined): string | undefined {
  const email = raw?.trim();
  if (!email) return undefined;
  if (/@poel\.ai$/i.test(email)) return undefined;
  return email;
}

/** From-address for transactional mail (ELSIAA Mail API). Prefer @elsiaa.com. */
export function getTransactionalSenderEmail(): string {
  return (
    sanitizeSenderEmail(process.env.SMTP_FROM_EMAIL) ||
    sanitizeSenderEmail(process.env.MAIL_FROM_EMAIL) ||
    "hello@elsiaa.com"
  );
}
