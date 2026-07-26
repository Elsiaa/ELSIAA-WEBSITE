# ELSIAA Supabase migrations

## Fresh project (recommended)

1. Open **Supabase → SQL Editor**
2. Paste and run the entire file:
   - [`elsiaa_supabase_full.sql`](./elsiaa_supabase_full.sql)
3. Create Auth user + promote (below)

That one file is the **entire app** schema: tenancy, projects, billing, portal modules, mail, leads, RLS.

## Already ran `0003_supabase_rls_bootstrap.sql`?

Still run [`elsiaa_supabase_full.sql`](./elsiaa_supabase_full.sql) — it is idempotent (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `DROP POLICY IF EXISTS`). It extends what `0003` created.

## Numbered files (history / reference only)

| File | Purpose |
|------|---------|
| `0001_init.sql` | Legacy D1 stub (ignore for Supabase) |
| `0002_mail_control_plane.sql` | Mail tables only (superseded by full) |
| `0003_supabase_rls_bootstrap.sql` | Early tenancy + mail (superseded by full) |
| `0004_portal_parity.sql` | Module flags, auth devices, program logs, PDF signatures |
| `0005_poel_full_tables.sql` | Poel `users`, chat, time tracking, fees, support-agent grants, etc. |
| `0006_meetings_scheduling.sql` | Poel `meetings`, `blocked_time_slots`, `availability_requests` |
| `0007_program_logs_align.sql` | `program_log_ingest_token` on projects; align `message`/`metadata` columns |
| `0008_mail_send_log_transactional.sql` | Allow `source = transactional` on mail send log |

After full + 0004, also run **`0005_poel_full_tables.sql`** so copied Poel admin/portal APIs have their tables.

Then run **`0006_meetings_scheduling.sql`** for calendar / join-meeting / availability.

Then run **`0007_program_logs_align.sql`** so Logs ingest URLs and list queries work.

Then run **`0008_mail_send_log_transactional.sql`** so app transactional mail (invites, billing, …) can write to the mail send log.

If `0005` failed earlier with `schema "next_auth" does not exist`, re-run the **updated** `0005_poel_full_tables.sql` from this repo (it now uses `auth.users`). Safe to paste again — it is mostly `IF NOT EXISTS`.

---

## Accounts & env (do in order)

### 1. Environment (`.env.local` — do not commit)

```bash
SUPER_ADMIN_EMAILS=davidh@elsiaa.com
AUTH_SECRET=your-long-secret-at-least-32-chars

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=…   # anon / publishable
SUPABASE_SECRET_KEY=…        # service role — scoped mail API / public forms / webhooks only
SUPABASE_JWKS_URL=https://YOUR_PROJECT.supabase.co/auth/v1/.well-known/jwks.json

ELSSIA_MAIL_API_KEY=…
# ELSSIA_MAIL_API_BASE=https://mail.elsiaa.com/mail-api
```

`ADMIN_KEY` is **not** used for `/admin` login anymore (Supabase password instead).

Optional: `DATABASE_URL` from Supabase → Settings → Database (direct Postgres). Not required for the app data plane.

### 2. Create Auth user

Supabase → **Authentication → Users → Add user**

- Email: same as `SUPER_ADMIN_EMAILS`
- Password: what you type at `/admin/sign-in`
- Auto Confirm: **on**

### 3. Run full SQL

Paste [`elsiaa_supabase_full.sql`](./elsiaa_supabase_full.sql) → **Run**.

### 4. Promote super admin

```sql
UPDATE auth.users
SET raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
WHERE email = 'davidh@elsiaa.com';
```

Confirm under the user → **App metadata**: `{ "role": "super_admin" }`.

### 5. Sign in

Open `/admin/sign-in` with that email + Supabase password.

---

## Access model (unlike Poel)

| Actor | How |
|-------|-----|
| Super admin UI | JWT with `app_metadata.role = super_admin` **and** email in `SUPER_ADMIN_EMAILS`. RLS policies grant full access — **no** service-role bypass for day-to-day admin. |
| Company member | RLS via `company_members` / `is_company_member()` |
| Company owner/admin | Extra write via `is_company_admin()` |
| Scoped mail `emk_` API | App verifies key, then uses `SUPABASE_SECRET_KEY` |
| Public `/pay/:token`, lead forms | Server + service role (never anon table SELECT) |

---

## Tables included

- **Tenancy:** `profiles`, `companies`, `company_members`
- **Projects:** `projects`, `project_members`
- **Billing:** `bills`, `bill_charges`, `bill_events`, `saved_payment_methods`, `billing_failures`
- **Portal:** `company_files`, `message_threads`, `message_messages`, `portal_meetings`, `support_*`
- **Mail:** `mail_api_keys`, `mail_send_log`
- **Leads:** `quote_requests`, `meeting_requests`, `merch_orders`

Helpers: `is_super_admin()`, `is_company_member(uuid)`, `is_company_admin(uuid)`.
