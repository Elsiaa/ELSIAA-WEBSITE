-- ELSIAA early bootstrap (tenancy + mail only).
-- For the FULL app schema, prefer: elsiaa_supabase_full.sql (idempotent; safe to run after this).
-- See migrations/README.md for account + env steps.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Super-admin helper (JWT app_metadata.role) ─────────────────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO service_role;

-- ── Profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Companies (minimal tenant model) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS company_members_user_idx
  ON public.company_members (user_id);

CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.company_members m
      WHERE m.company_id = p_company_id
        AND m.user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_company_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_member(UUID) TO service_role;

-- ── Mail control plane ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mail_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  allow_any_from BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_from TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by_email TEXT,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS mail_api_keys_prefix_idx ON public.mail_api_keys (key_prefix);

CREATE TABLE IF NOT EXISTS public.mail_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('admin_ui', 'scoped_api')),
  api_key_id UUID REFERENCES public.mail_api_keys (id) ON DELETE SET NULL,
  from_addr TEXT NOT NULL,
  to_addrs TEXT[] NOT NULL DEFAULT '{}',
  cc TEXT[] NOT NULL DEFAULT '{}',
  bcc TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_response TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS mail_send_log_created_idx
  ON public.mail_send_log (created_at DESC);

-- ── Enable RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_send_log ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = auth.uid());

DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_super ON public.profiles;
CREATE POLICY profiles_insert_super ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

-- Companies
DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(id));

DROP POLICY IF EXISTS companies_write_super ON public.companies;
CREATE POLICY companies_write_super ON public.companies
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Company members
DROP POLICY IF EXISTS company_members_select ON public.company_members;
CREATE POLICY company_members_select ON public.company_members
  FOR SELECT TO authenticated
  USING (public.is_super_admin() OR user_id = auth.uid() OR public.is_company_member(company_id));

DROP POLICY IF EXISTS company_members_write_super ON public.company_members;
CREATE POLICY company_members_write_super ON public.company_members
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Mail: super admin only via RLS (scoped API uses service role after app auth)
DROP POLICY IF EXISTS mail_api_keys_super ON public.mail_api_keys;
CREATE POLICY mail_api_keys_super ON public.mail_api_keys
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS mail_send_log_super ON public.mail_send_log;
CREATE POLICY mail_send_log_super ON public.mail_send_log
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Grants (no anon write)
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.companies TO authenticated;
GRANT SELECT ON public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_api_keys TO authenticated;
GRANT SELECT, INSERT ON public.mail_send_log TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.company_members TO service_role;
GRANT ALL ON public.mail_api_keys TO service_role;
GRANT ALL ON public.mail_send_log TO service_role;

-- ═══════════════════════════════════════════════════════════════════════════
-- PROMOTE SUPER ADMIN (run after creating the Auth user)
-- 1. Auth → Users → Add user (email + password)
-- 2. Copy user UUID
-- 3. Uncomment and run:
--
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
-- WHERE id = 'PASTE-USER-UUID-HERE';
--
-- Or by email:
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
-- WHERE email = 'you@elsiaa.com';
--
-- Then confirm in Auth → User → App metadata: { "role": "super_admin" }
-- Also put the same email in SUPER_ADMIN_EMAILS in .env.local
-- ═══════════════════════════════════════════════════════════════════════════
