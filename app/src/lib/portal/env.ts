/**
 * Portal environment accessors — names only; values come from `.env.local` / Vercel later.
 * Never hardcode secrets here.
 *
 * Prefer static `process.env.FOO` reads so Vite/Nitro can inject values.
 * Dynamic `process.env[name]` alone often stays undefined under SSR.
 */

function trim(v: string | undefined | null): string | undefined {
  const t = v?.trim();
  return t || undefined;
}

function read(...names: string[]): string | undefined {
  for (const name of names) {
    const fromProcess =
      typeof process !== "undefined" ? trim(process.env[name]) : undefined;
    if (fromProcess) return fromProcess;
    if (name.startsWith("VITE_")) {
      const fromVite = trim(
        (import.meta.env as Record<string, string | undefined>)[name],
      );
      if (fromVite) return fromVite;
    }
  }
  return undefined;
}

export function portalEnv() {
  return {
    siteUrl: read("VITE_SITE_URL"),
    databaseUrl: read("DATABASE_URL"),
    databaseSslNoVerify: read("DATABASE_SSL_NO_VERIFY") === "1",
    authSecret: read("AUTH_SECRET"),
    authUrl: read("AUTH_URL"),
    superAdminEmails: (read("SUPER_ADMIN_EMAILS") ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    supabaseUrl: read("SUPABASE_URL", "VITE_SUPABASE_URL"),
    /** Browser / user-scoped key (new name + legacy aliases). */
    supabaseAnonKey: read(
      "SUPABASE_PUBLISHABLE_KEY",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_ANON_KEY",
    ),
    /** Service role — bypasses RLS; narrow server paths only. */
    supabaseServiceRoleKey: read("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    supabaseJwksUrl: read("SUPABASE_JWKS_URL"),
    stripeSecretKey: read("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: read("STRIPE_WEBHOOK_SECRET"),
    stripePublishableKey: read("VITE_STRIPE_PUBLISHABLE_KEY", "STRIPE_PUBLISHABLE_KEY"),
    resendApiKey: read("RESEND_API_KEY"),
    smtpFromEmail: read("SMTP_FROM_EMAIL"),
    smtpFromName: read("SMTP_FROM_NAME") ?? "ELSIAA",
    s3: {
      bucket: read("S3_BUCKET"),
      region: read("S3_REGION"),
      accessKeyId: read("S3_ACCESS_KEY_ID"),
      secretAccessKey: read("S3_SECRET_ACCESS_KEY"),
      endpoint: read("S3_ENDPOINT"),
    },
    adminKey: read("ADMIN_KEY"),
  };
}

export function portalConfigured(): {
  database: boolean;
  supabase: boolean;
  stripe: boolean;
  email: boolean;
  storage: boolean;
} {
  const e = portalEnv();
  return {
    database: Boolean(e.databaseUrl || (e.supabaseUrl && e.supabaseAnonKey)),
    supabase: Boolean(e.supabaseUrl && e.supabaseAnonKey),
    stripe: Boolean(e.stripeSecretKey && e.stripePublishableKey),
    email: Boolean(e.resendApiKey || read("ZOHO_EMAIL") || read("EMAIL_USER")),
    storage: Boolean(e.s3.bucket && e.s3.accessKeyId && e.s3.secretAccessKey),
  };
}
