/**
 * One-off: create pending super-admin row + send password invite to yisrael@elsiaa.com
 * Run: node scripts/invite-super-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (!m) continue;
  if (!(m[1] in process.env)) process.env[m[1]] = m[2];
}

const EMAIL = "yisrael@elsiaa.com";
const FIRST_NAME = "Yisrael";
const SITE = "https://elsiaa.com";
const COMPANY_ID = "f617bcd3-ff4c-4484-b21c-4d82f48e4851"; // invite context only
const COMPANY_NAME = "ELSIAA";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const mailKey = process.env.ELSSIA_MAIL_API_KEY;
const mailBase = (process.env.ELSSIA_MAIL_API_BASE || "https://mail.elsiaa.com/mail-api").replace(
  /\/$/,
  "",
);

if (!url || !key || !mailKey) {
  console.error("Missing SUPABASE_URL, SUPABASE_SECRET_KEY, or ELSSIA_MAIL_API_KEY");
  process.exit(1);
}

function generateInvitationToken(email, companyId, { superAdmin = false } = {}) {
  const payload = {
    email,
    companyId,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    ...(superAdmin ? { superAdmin: true } : {}),
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

const sb = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existingAuth } = await sb.auth.admin.listUsers({ perPage: 200 });
const authHit = existingAuth?.users?.find(
  (u) => (u.email || "").toLowerCase() === EMAIL,
);
if (authHit) {
  console.log("Auth user already exists:", authHit.id, authHit.app_metadata);
  const { error: metaErr } = await sb.auth.admin.updateUserById(authHit.id, {
    app_metadata: { ...(authHit.app_metadata || {}), role: "super_admin" },
  });
  if (metaErr) {
    console.error("Failed to set super_admin claim:", metaErr);
    process.exit(1);
  }
}

const { data: existingRow } = await sb
  .from("users")
  .select("*")
  .ilike("email", EMAIL)
  .maybeSingle();

let userId = existingRow?.id;
if (existingRow?.auth_user_id && existingRow?.status === "active") {
  console.log("User already active with auth link — not sending invite.");
  console.log("Ensure SUPER_ADMIN_EMAILS includes", EMAIL, "on Vercel.");
  process.exit(0);
}

if (!existingRow) {
  const { data: created, error } = await sb
    .from("users")
    .insert({
      email: EMAIL,
      first_name: FIRST_NAME,
      last_name: null,
      company_id: COMPANY_ID,
      role: "member",
      status: "pending",
      platform_role: "none",
      auth_user_id: null,
      all_projects_access: false,
    })
    .select()
    .single();
  if (error) {
    console.error("Failed to create pending user:", error);
    process.exit(1);
  }
  userId = created.id;
  console.log("Created pending public.users row:", userId);
} else {
  const { error } = await sb
    .from("users")
    .update({
      status: "pending",
      auth_user_id: null,
      first_name: existingRow.first_name || FIRST_NAME,
      company_id: COMPANY_NAME === "ELSIAA" ? COMPANY_ID : existingRow.company_id,
    })
    .eq("id", existingRow.id);
  if (error) {
    console.error("Failed to reset pending user:", error);
    process.exit(1);
  }
  console.log("Reset existing row to pending:", existingRow.id);
}

const token = generateInvitationToken(EMAIL, COMPANY_ID, { superAdmin: true });
const signupUrl = `${SITE}/sign-up?invitation=${encodeURIComponent(token)}`;

const subject = "Set your ELSIAA password";
const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#111;line-height:1.5">
  <p>Hi ${FIRST_NAME},</p>
  <p>You've been invited as an ELSIAA admin. Open the link below and choose a password for <strong>${EMAIL}</strong>.</p>
  <p style="margin:28px 0"><a href="${signupUrl}" style="display:inline-block;background:#1e6b3c;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Choose password</a></p>
  <p>Or paste this link into your browser:</p>
  <p><a href="${signupUrl}">${signupUrl}</a></p>
  <p>After that, sign in at <a href="${SITE}/portal/sign-in">${SITE}/portal/sign-in</a> with your ELSIAA email and password.</p>
  <p>Best regards,<br>ELSIAA Team</p>
</body></html>`;

const text = `Hi ${FIRST_NAME},

You've been invited as an ELSIAA admin. Choose a password for ${EMAIL}:

${signupUrl}

Then sign in at ${SITE}/portal/sign-in with your ELSIAA email and password.

— ELSIAA Team`;

const mailRes = await fetch(`${mailBase}/v1/send`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${mailKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    From: `"ELSIAA" <hello@elsiaa.com>`,
    To: EMAIL,
    Subject: subject,
    HtmlBody: html,
    TextBody: text,
    Tag: "super-admin-invite",
  }),
});

const mailBody = await mailRes.text();
if (!mailRes.ok) {
  console.error("Mail send failed:", mailRes.status, mailBody);
  process.exit(1);
}

console.log("Invitation emailed to", EMAIL);
console.log("Signup URL:", signupUrl);
console.log("Mail API response:", mailBody.slice(0, 400));
console.log("\nIMPORTANT: Add yisrael@elsiaa.com to SUPER_ADMIN_EMAILS on Vercel (production), then redeploy.");
