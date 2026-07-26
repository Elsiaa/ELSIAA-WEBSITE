-- ═══════════════════════════════════════════════════════════════════════════
-- ELSIAA — FULL Supabase schema (paste once into SQL Editor → Run)
-- Idempotent: safe to re-run. Prefer this over numbered slices for a new project.
--
-- Includes: auth helpers, profiles, companies, members, projects, billing,
--           portal files/messages/meetings/support, mail keys/log, admin leads.
-- Super admin: JWT app_metadata.role = 'super_admin' (RLS stays ON — unlike Poel).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Helpers that do not depend on app tables ───────────────────────────────
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- ── Profiles ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
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

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Companies + members ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

DROP TRIGGER IF EXISTS companies_set_updated_at ON public.companies;
CREATE TRIGGER companies_set_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_members (
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS company_members_user_idx ON public.company_members (user_id);

-- ── Tenant helpers (must come AFTER company_members exists) ───────────────
CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = p_company_id AND m.user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(p_company_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = p_company_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'admin')
    );
$$;

REVOKE ALL ON FUNCTION public.is_company_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_company_member(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_admin(UUID) TO authenticated, service_role;

-- ── Projects ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS projects_company_idx ON public.projects (company_id);

DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.project_members (
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS project_members_user_idx ON public.project_members (user_id);

-- ── Billing (simplified Bills — cents, yearly, due_date) ───────────────────
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  schedule TEXT NOT NULL CHECK (schedule IN ('one_time', 'recurring')),
  billing_interval TEXT CHECK (
    billing_interval IS NULL OR billing_interval IN ('weekly', 'monthly', 'yearly')
  ),
  collection_mode TEXT NOT NULL CHECK (collection_mode IN ('invoice_link', 'auto_charge')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  public_token TEXT NOT NULL UNIQUE,
  next_billing_date DATE,
  due_date DATE,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  attach_company_payment_method BOOLEAN NOT NULL DEFAULT FALSE,
  internal_note TEXT,
  last_reminder_sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bills_company_idx ON public.bills (company_id);
CREATE INDEX IF NOT EXISTS bills_status_idx ON public.bills (status);
CREATE INDEX IF NOT EXISTS bills_token_idx ON public.bills (public_token);
CREATE INDEX IF NOT EXISTS bills_next_billing_idx ON public.bills (next_billing_date)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS bills_recipient_email_idx ON public.bills (recipient_email);

DROP TRIGGER IF EXISTS bills_set_updated_at ON public.bills;
CREATE TRIGGER bills_set_updated_at
  BEFORE UPDATE ON public.bills
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.bill_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills (id) ON DELETE CASCADE,
  description TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  line_items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  invoice_number INTEGER,
  stripe_payment_intent_id TEXT,
  failure_message TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bill_charges_bill_idx ON public.bill_charges (bill_id);
CREATE INDEX IF NOT EXISTS bill_charges_status_idx ON public.bill_charges (status);

DROP TRIGGER IF EXISTS bill_charges_set_updated_at ON public.bill_charges;
CREATE TRIGGER bill_charges_set_updated_at
  BEFORE UPDATE ON public.bill_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.bill_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES public.bills (id) ON DELETE CASCADE,
  bill_charge_id UUID REFERENCES public.bill_charges (id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bill_events_bill_idx ON public.bill_events (bill_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  payment_method_type TEXT NOT NULL DEFAULT 'card'
    CHECK (payment_method_type IN ('card', 'us_bank_account')),
  brand TEXT NOT NULL DEFAULT '',
  last4 TEXT NOT NULL DEFAULT '',
  exp_month INTEGER,
  exp_year INTEGER,
  display_name TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS saved_pm_company_idx ON public.saved_payment_methods (company_id);
CREATE UNIQUE INDEX IF NOT EXISTS saved_pm_stripe_pm_uidx
  ON public.saved_payment_methods (stripe_payment_method_id);

DROP TRIGGER IF EXISTS saved_pm_set_updated_at ON public.saved_payment_methods;
CREATE TRIGGER saved_pm_set_updated_at
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.billing_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  bill_id UUID REFERENCES public.bills (id) ON DELETE SET NULL,
  bill_charge_id UUID REFERENCES public.bill_charges (id) ON DELETE SET NULL,
  amount_cents INTEGER,
  error_message TEXT,
  failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS billing_failures_company_idx ON public.billing_failures (company_id);

-- ── Portal: files, messages, meetings, support ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS company_files_company_idx ON public.company_files (company_id);

CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Messages',
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_threads_company_idx ON public.message_threads (company_id);

CREATE TABLE IF NOT EXISTS public.message_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads (id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff')),
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_messages_thread_idx
  ON public.message_messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS public.portal_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  join_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS portal_meetings_company_idx ON public.portal_meetings (company_id);

CREATE TABLE IF NOT EXISTS public.support_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_threads_company_idx ON public.support_threads (company_id);

CREATE TABLE IF NOT EXISTS public.support_thread_participants (
  thread_id UUID NOT NULL REFERENCES public.support_threads (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.support_threads (id) ON DELETE CASCADE,
  author_user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'staff')),
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_messages_thread_idx
  ON public.support_messages (thread_id, created_at);

CREATE OR REPLACE FUNCTION public.touch_support_thread_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.support_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_support_messages_touch_thread ON public.support_messages;
CREATE TRIGGER tr_support_messages_touch_thread
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_thread_updated_at();

CREATE OR REPLACE FUNCTION public.touch_message_thread_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.message_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_message_messages_touch_thread ON public.message_messages;
CREATE TRIGGER tr_message_messages_touch_thread
  AFTER INSERT ON public.message_messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_message_thread_updated_at();

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

CREATE INDEX IF NOT EXISTS mail_send_log_created_idx ON public.mail_send_log (created_at DESC);

-- ── Admin leads (marketing forms — was D1) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  project_types TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  features TEXT,
  audience TEXT,
  budget TEXT,
  timeline TEXT,
  notes TEXT,
  summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'reviewed', 'quoted', 'won', 'closed'))
);

CREATE TABLE IF NOT EXISTS public.meeting_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  slot_date TEXT NOT NULL,
  slot_time TEXT NOT NULL,
  topic TEXT,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'confirmed', 'done', 'declined'))
);

CREATE TABLE IF NOT EXISTS public.merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'invoiced', 'paid', 'shipped', 'closed'))
);

-- ── Enable RLS ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mail_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_orders ENABLE ROW LEVEL SECURITY;

-- Profiles
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (public.is_super_admin() OR id = auth.uid());
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_super_admin() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR id = auth.uid());
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

-- Companies
DROP POLICY IF EXISTS companies_select ON public.companies;
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(id));
DROP POLICY IF EXISTS companies_write_super ON public.companies;
CREATE POLICY companies_write_super ON public.companies FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS companies_update_admin ON public.companies;
CREATE POLICY companies_update_admin ON public.companies FOR UPDATE TO authenticated
  USING (public.is_company_admin(id)) WITH CHECK (public.is_company_admin(id));

-- Company members
DROP POLICY IF EXISTS company_members_select ON public.company_members;
CREATE POLICY company_members_select ON public.company_members FOR SELECT TO authenticated
  USING (public.is_super_admin() OR user_id = auth.uid() OR public.is_company_member(company_id));
DROP POLICY IF EXISTS company_members_write_super ON public.company_members;
CREATE POLICY company_members_write_super ON public.company_members FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS company_members_manage_admin ON public.company_members;
CREATE POLICY company_members_manage_admin ON public.company_members FOR ALL TO authenticated
  USING (public.is_company_admin(company_id)) WITH CHECK (public.is_company_admin(company_id));

-- Projects
DROP POLICY IF EXISTS projects_select ON public.projects;
CREATE POLICY projects_select ON public.projects FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR public.is_company_admin(company_id)
    OR (
      public.is_company_member(company_id)
      AND (
        NOT EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = id)
        OR EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = id AND pm.user_id = auth.uid()
        )
      )
    )
  );
DROP POLICY IF EXISTS projects_write ON public.projects;
CREATE POLICY projects_write ON public.projects FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_admin(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_admin(company_id));

DROP POLICY IF EXISTS project_members_select ON public.project_members;
CREATE POLICY project_members_select ON public.project_members FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_company_member(p.company_id)
    )
  );
DROP POLICY IF EXISTS project_members_write ON public.project_members;
CREATE POLICY project_members_write ON public.project_members FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_company_admin(p.company_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_company_admin(p.company_id)
    )
  );

-- Bills (+ related): members read; super_admin writes (public pay uses service role + token)
DROP POLICY IF EXISTS bills_select ON public.bills;
CREATE POLICY bills_select ON public.bills FOR SELECT TO authenticated
  USING (public.is_super_admin() OR (company_id IS NOT NULL AND public.is_company_member(company_id)));
DROP POLICY IF EXISTS bills_write_super ON public.bills;
CREATE POLICY bills_write_super ON public.bills FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS bill_charges_select ON public.bill_charges;
CREATE POLICY bill_charges_select ON public.bill_charges FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_id AND b.company_id IS NOT NULL AND public.is_company_member(b.company_id)
    )
  );
DROP POLICY IF EXISTS bill_charges_write_super ON public.bill_charges;
CREATE POLICY bill_charges_write_super ON public.bill_charges FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS bill_events_select ON public.bill_events;
CREATE POLICY bill_events_select ON public.bill_events FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_id AND b.company_id IS NOT NULL AND public.is_company_member(b.company_id)
    )
  );
DROP POLICY IF EXISTS bill_events_write_super ON public.bill_events;
CREATE POLICY bill_events_write_super ON public.bill_events FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS saved_pm_select ON public.saved_payment_methods;
CREATE POLICY saved_pm_select ON public.saved_payment_methods FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id));
DROP POLICY IF EXISTS saved_pm_write ON public.saved_payment_methods;
CREATE POLICY saved_pm_write ON public.saved_payment_methods FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_member(company_id));

DROP POLICY IF EXISTS billing_failures_super ON public.billing_failures;
CREATE POLICY billing_failures_super ON public.billing_failures FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Portal modules
DROP POLICY IF EXISTS company_files_select ON public.company_files;
CREATE POLICY company_files_select ON public.company_files FOR SELECT TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id));
DROP POLICY IF EXISTS company_files_write ON public.company_files;
CREATE POLICY company_files_write ON public.company_files FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_admin(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_admin(company_id));

DROP POLICY IF EXISTS message_threads_all ON public.message_threads;
CREATE POLICY message_threads_all ON public.message_threads FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_member(company_id));

DROP POLICY IF EXISTS message_messages_all ON public.message_messages;
CREATE POLICY message_messages_all ON public.message_messages FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.message_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  );

DROP POLICY IF EXISTS portal_meetings_all ON public.portal_meetings;
CREATE POLICY portal_meetings_all ON public.portal_meetings FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_member(company_id));

DROP POLICY IF EXISTS support_threads_all ON public.support_threads;
CREATE POLICY support_threads_all ON public.support_threads FOR ALL TO authenticated
  USING (public.is_super_admin() OR public.is_company_member(company_id))
  WITH CHECK (public.is_super_admin() OR public.is_company_member(company_id));

DROP POLICY IF EXISTS support_participants_all ON public.support_thread_participants;
CREATE POLICY support_participants_all ON public.support_thread_participants FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  );

DROP POLICY IF EXISTS support_messages_all ON public.support_messages;
CREATE POLICY support_messages_all ON public.support_messages FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.support_threads t
      WHERE t.id = thread_id AND public.is_company_member(t.company_id)
    )
  );

-- Mail + leads: super_admin only (public form inserts use service role / server)
DROP POLICY IF EXISTS mail_api_keys_super ON public.mail_api_keys;
CREATE POLICY mail_api_keys_super ON public.mail_api_keys FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS mail_send_log_super ON public.mail_send_log;
CREATE POLICY mail_send_log_super ON public.mail_send_log FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS quote_requests_super ON public.quote_requests;
CREATE POLICY quote_requests_super ON public.quote_requests FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS meeting_requests_super ON public.meeting_requests;
CREATE POLICY meeting_requests_super ON public.meeting_requests FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS merch_orders_super ON public.merch_orders;
CREATE POLICY merch_orders_super ON public.merch_orders FOR ALL TO authenticated
  USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Grants
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT SELECT ON public.bills, public.bill_charges, public.bill_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_payment_methods TO authenticated;
GRANT SELECT ON public.billing_failures TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_threads, public.message_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_meetings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_threads, public.support_thread_participants, public.support_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_api_keys TO authenticated;
GRANT SELECT, INSERT ON public.mail_send_log TO authenticated;
GRANT SELECT, UPDATE ON public.quote_requests, public.meeting_requests, public.merch_orders TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Realtime for support chat (ignore if already added)
DO $pub$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$pub$;

DO $pub2$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.message_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$pub2$;

-- ═══════════════════════════════════════════════════════════════════════════
-- PROMOTE SUPER ADMIN (after Auth → Users → Add user)
--
-- UPDATE auth.users
-- SET raw_app_meta_data =
--   coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
-- WHERE email = 'you@elsiaa.com';
--
-- Also set SUPER_ADMIN_EMAILS=you@elsiaa.com in .env.local
-- ═══════════════════════════════════════════════════════════════════════════
