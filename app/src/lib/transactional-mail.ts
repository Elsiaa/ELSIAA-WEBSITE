/**
 * Transactional email via ELSIAA Mail API (ELSSIA_MAIL_API_KEY).
 * All app mail (invites, billing, support, signatures, …) goes through here.
 *
 * Optional SMTP fallback only when TRANSACTIONAL_MAIL_SMTP_FALLBACK=1 and Mail API fails/missing.
 */

import nodemailer from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { getPaymentContactEmail } from "@/lib/payment-branding";
import {
  getSmtpFromDisplayName,
  getTransactionalSenderEmail,
} from "@/lib/operational-brand";
import { mailMasterConfigured } from "@/lib/mail/env";
import { executeScopedOrAdminSend } from "@/lib/mail/send.server";
import type { MailAttachment } from "@/lib/mail/types";

export type TransactionalMailPayload = {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional multipart plain alternative; if omitted, a simple text version is derived from html */
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: SendMailOptions["attachments"];
  /** Full RFC From header. Must resolve to @elsiaa.com for the Mail API. */
  from?: string;
};

function htmlToPlainText(html: string): string {
  const stripped = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return stripped || "(HTML message)";
}

/** Pull bare email from `Name <email@domain>` or raw address. */
export function extractEmailAddress(from: string): string {
  const angle = /<([^>]+)>/.exec(from);
  if (angle?.[1]) return angle[1].trim();
  return from.trim();
}

function formatFromHeader(fromOverride?: string): string {
  if (fromOverride?.trim()) {
    const email = extractEmailAddress(fromOverride);
    const nameMatch = /^"([^"]*)"\s*</.exec(fromOverride.trim());
    if (nameMatch) return `"${nameMatch[1]}" <${email}>`;
    if (fromOverride.includes("<")) return fromOverride.trim();
    return `"${getSmtpFromDisplayName()}" <${email}>`;
  }
  return `"${getSmtpFromDisplayName()}" <${getTransactionalSenderEmail()}>`;
}

function toMailAttachments(
  attachments: SendMailOptions["attachments"] | undefined,
): MailAttachment[] | undefined {
  if (!attachments?.length) return undefined;
  const list = Array.isArray(attachments) ? attachments : [attachments];
  const out: MailAttachment[] = [];
  for (const a of list) {
    if (!a || typeof a !== "object") continue;
    const name =
      ("filename" in a && typeof a.filename === "string" && a.filename) ||
      ("path" in a && typeof a.path === "string" && a.path.split("/").pop()) ||
      "attachment";
    const contentType =
      ("contentType" in a && typeof a.contentType === "string" && a.contentType) ||
      "application/octet-stream";
    let content = "";
    if ("content" in a && a.content != null) {
      const c = a.content;
      if (Buffer.isBuffer(c)) content = c.toString("base64");
      else if (typeof c === "string") {
        // Assume already base64 if encoding says so; else encode utf8
        const enc = "encoding" in a ? a.encoding : undefined;
        content =
          enc === "base64" ? c : Buffer.from(c, "utf8").toString("base64");
      } else if (c instanceof Uint8Array) {
        content = Buffer.from(c).toString("base64");
      }
    }
    if (!content) {
      console.warn(
        "sendTransactionalMail: skipping attachment without inline content:",
        name,
      );
      continue;
    }
    out.push({ Name: name, Content: content, ContentType: contentType });
  }
  return out.length ? out : undefined;
}

async function sendViaElsiaaMail(
  payload: TransactionalMailPayload,
): Promise<boolean> {
  const html = payload.html.trim();
  if (!html) {
    throw new Error("Transactional mail requires a non-empty html body");
  }
  const from = formatFromHeader(payload.from);
  const result = await executeScopedOrAdminSend({
    source: "transactional",
    payload: {
      From: from,
      To: payload.to,
      Cc: payload.cc,
      Bcc: payload.bcc,
      Subject: payload.subject,
      HtmlBody: html,
      TextBody: payload.text ?? htmlToPlainText(html),
      ReplyTo: payload.replyTo,
      Attachments: toMailAttachments(payload.attachments),
      Tag: "transactional",
    },
  });
  if (!result.ok) {
    console.error("sendTransactionalMail: ELSIAA Mail API failed:", result.error);
    return false;
  }
  return true;
}

function normalizeGmailAppPassword(pass: string): string {
  return pass.replace(/\s+/g, "");
}

function smtpFallbackEnabled(): boolean {
  return (
    process.env.TRANSACTIONAL_MAIL_SMTP_FALLBACK === "1" ||
    process.env.TRANSACTIONAL_MAIL_SMTP_FALLBACK === "true"
  );
}

function createZohoTransport(): nodemailer.Transporter {
  const zohoEmail = process.env.ZOHO_EMAIL || getPaymentContactEmail();
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,
    secure: false,
    auth: {
      user: zohoEmail,
      pass: process.env.ZOHO_APP_PASSWORD!,
    },
    tls: { rejectUnauthorized: false },
  });
}

function createGmailTransport(): nodemailer.Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER!.trim(),
      pass: normalizeGmailAppPassword(process.env.EMAIL_PASS!),
    },
  });
}

function buildMailOptions(payload: TransactionalMailPayload): SendMailOptions {
  const html = payload.html.trim();
  if (!html) {
    throw new Error("Transactional mail requires a non-empty html body");
  }
  const text = payload.text ?? htmlToPlainText(html);
  return {
    to: payload.to,
    subject: payload.subject,
    html,
    text,
    replyTo: payload.replyTo,
    cc: payload.cc,
    bcc: payload.bcc,
    attachments: payload.attachments,
  };
}

async function sendViaSmtpFallback(
  payload: TransactionalMailPayload,
): Promise<boolean> {
  const base = buildMailOptions(payload);
  const defaultFrom = formatFromHeader(payload.from);

  if (process.env.ZOHO_APP_PASSWORD) {
    try {
      await createZohoTransport().sendMail({ ...base, from: defaultFrom });
      return true;
    } catch (e) {
      console.error("sendTransactionalMail SMTP Zoho failed:", e);
    }
  }

  const gmailUser = process.env.EMAIL_USER?.trim();
  const gmailPass = process.env.EMAIL_PASS;
  if (gmailUser && gmailPass) {
    try {
      await createGmailTransport().sendMail({
        ...base,
        from: `"${getSmtpFromDisplayName()}" <${gmailUser}>`,
        replyTo: payload.replyTo ?? gmailUser,
      });
      return true;
    } catch (e) {
      console.error("sendTransactionalMail SMTP Gmail failed:", e);
    }
  }

  return false;
}

/**
 * Send one transactional email through the ELSIAA Mail API.
 */
export async function sendTransactionalMail(
  payload: TransactionalMailPayload,
): Promise<boolean> {
  if (mailMasterConfigured()) {
    const ok = await sendViaElsiaaMail(payload);
    if (ok) return true;
    if (smtpFallbackEnabled()) {
      console.warn(
        "sendTransactionalMail: Mail API failed; trying SMTP fallback (TRANSACTIONAL_MAIL_SMTP_FALLBACK)",
      );
      return sendViaSmtpFallback(payload);
    }
    return false;
  }

  if (smtpFallbackEnabled()) {
    console.warn(
      "sendTransactionalMail: ELSSIA_MAIL_API_KEY not set; using SMTP fallback",
    );
    return sendViaSmtpFallback(payload);
  }

  console.error(
    "sendTransactionalMail: ELSSIA_MAIL_API_KEY is not configured. Set it to send mail via the ELSIAA Mail API.",
  );
  return false;
}

/** Verifies Mail API (or SMTP fallback) is usable. */
export async function verifyTransactionalMailTransport(): Promise<void> {
  if (mailMasterConfigured()) {
    return;
  }
  if (!smtpFallbackEnabled()) {
    throw new Error(
      "Configure ELSSIA_MAIL_API_KEY (preferred), or set TRANSACTIONAL_MAIL_SMTP_FALLBACK=1 with SMTP credentials",
    );
  }

  const errs: string[] = [];
  if (process.env.ZOHO_APP_PASSWORD) {
    try {
      await createZohoTransport().verify();
      return;
    } catch (e) {
      errs.push(`Zoho: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (process.env.EMAIL_USER?.trim() && process.env.EMAIL_PASS) {
    try {
      await createGmailTransport().verify();
      return;
    } catch (e) {
      errs.push(`Gmail: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(
    errs.length
      ? errs.join(" | ")
      : "Configure ELSSIA_MAIL_API_KEY or SMTP fallback credentials",
  );
}
