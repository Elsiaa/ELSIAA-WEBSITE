-- ELSIAA: Poel portal/admin tables (users, chat, time tracking, grants, fees, etc.)
-- Paste after 0004. Idempotent where possible.
-- Uses Supabase auth.users (not Poel's next_auth schema) and public.set_updated_at().

-- Poel-compatible users (portal identity). auth_user_id = auth.users.id / profiles.id
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  auth_user_id UUID UNIQUE REFERENCES auth.users (id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'inactive')),
  platform_role TEXT NOT NULL DEFAULT 'none',
  all_projects_access BOOLEAN NOT NULL DEFAULT FALSE,
  authorizations_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  program_logs_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  files_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  support_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_company_idx ON public.users (company_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS support_agent_company_files_allowed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.user_project_permissions (
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  message TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS chat_messages_project_idx ON public.chat_messages (project_id, created_at);


-- from create_support_agent_company_grants.sql
-- Per-company access for platform_role = support_agent (managed by super admins).
CREATE TABLE IF NOT EXISTS public.support_agent_company_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies (id) ON DELETE CASCADE,
  support_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  authorizations_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT support_agent_company_grants_user_company UNIQUE (user_id, company_id),
  CONSTRAINT support_agent_company_grants_some_access CHECK (
    support_allowed = TRUE OR authorizations_allowed = TRUE
  )
);

CREATE INDEX IF NOT EXISTS idx_support_agent_grants_user_id ON public.support_agent_company_grants (user_id);
CREATE INDEX IF NOT EXISTS idx_support_agent_grants_company_id ON public.support_agent_company_grants (company_id);

COMMENT ON TABLE public.support_agent_company_grants IS 'Support agents: which companies they may access in Support vs Authorizations admin areas';

-- from add_support_agent_program_logs_grant.sql
-- Support agents: optional per-company access to Admin → Program logs (read/delete for those companies' projects).
ALTER TABLE public.support_agent_company_grants
  ADD COLUMN IF NOT EXISTS program_logs_allowed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.support_agent_company_grants
  DROP CONSTRAINT IF EXISTS support_agent_company_grants_some_access;

ALTER TABLE public.support_agent_company_grants
  ADD CONSTRAINT support_agent_company_grants_some_access CHECK (
    support_allowed = TRUE
    OR authorizations_allowed = TRUE
    OR program_logs_allowed = TRUE
  );

COMMENT ON COLUMN public.support_agent_company_grants.program_logs_allowed IS 'When true, support agent may open Admin Logs for this company''s projects (list/delete; no ingest URL).';

-- from add_support_agent_files_grant.sql
-- Fourth grant: Admin → Files (per company), used with companies.support_agent_company_files_allowed.
ALTER TABLE public.support_agent_company_grants
  ADD COLUMN IF NOT EXISTS files_allowed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.support_agent_company_grants
  DROP CONSTRAINT IF EXISTS support_agent_company_grants_some_access;

ALTER TABLE public.support_agent_company_grants
  ADD CONSTRAINT support_agent_company_grants_some_access CHECK (
    support_allowed = TRUE
    OR authorizations_allowed = TRUE
    OR program_logs_allowed = TRUE
    OR files_allowed = TRUE
  );

COMMENT ON COLUMN public.support_agent_company_grants.files_allowed IS 'When true, support agent may use Admin → Files for this company if the company also allows support file access.';

-- from create_time_tracking_tables.sql
-- Personal time tracking (Clockify-style): keyed to Supabase auth.users (not Poel next_auth).

CREATE TABLE IF NOT EXISTS time_tracking_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_tracking_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES time_tracking_clients(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  billable BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_tracking_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES time_tracking_tasks(id) ON DELETE CASCADE,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_tracking_clients_auth_user_id ON time_tracking_clients(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_tasks_client_id ON time_tracking_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_tasks_auth_user_id ON time_tracking_tasks(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_entries_task_id ON time_tracking_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_entries_auth_user_id ON time_tracking_entries(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_time_tracking_entries_running ON time_tracking_entries(auth_user_id) WHERE ended_at IS NULL;

DROP TRIGGER IF EXISTS update_time_tracking_tasks_updated_at ON time_tracking_tasks;
CREATE TRIGGER update_time_tracking_tasks_updated_at
  BEFORE UPDATE ON time_tracking_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Payment requests (Poel billing). Needed before project_fees FKs.
CREATE TABLE IF NOT EXISTS public.payments_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users (id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'invoiced', 'completed', 'cancelled')),
  public_token TEXT NOT NULL UNIQUE,
  created_by_clerk_user_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL DEFAULT '',
  recipient_name TEXT NOT NULL DEFAULT '',
  payment_type TEXT NOT NULL DEFAULT 'one_time'
    CHECK (payment_type IN ('one_time', 'monthly', 'interval_billing')),
  monthly_amounts JSONB,
  next_billing_date DATE,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  invoice_number INTEGER,
  invoice_line_items JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_requests_user_id ON public.payments_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_requests_created_at ON public.payments_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_requests_status_type_due
  ON public.payments_requests(status, payment_type, next_billing_date);

DROP TRIGGER IF EXISTS update_payments_requests_updated_at ON public.payments_requests;
CREATE TRIGGER update_payments_requests_updated_at
  BEFORE UPDATE ON public.payments_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- from create_project_fees_and_subscriptions.sql
-- Create project_fees table for one-time fees linked to projects
CREATE TABLE IF NOT EXISTS project_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  payment_request_id UUID REFERENCES payments_requests(id) ON DELETE SET NULL,
  created_by_clerk_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_subscriptions table for monthly recurring fees linked to projects
CREATE TABLE IF NOT EXISTS project_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'stopped')),
  payment_request_id UUID REFERENCES payments_requests(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT, -- Link to Stripe subscription for automatic billing
  last_billed_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('daily', 'weekly', 'monthly')),
  created_by_clerk_user_id TEXT NOT NULL,
  stopped_by_clerk_user_id TEXT,
  stopped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_fee_transactions table to track all fee payments (for billing history)
CREATE TABLE IF NOT EXISTS project_fee_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_fee_id UUID NOT NULL REFERENCES project_fees(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payments_requests(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  invoice_number INTEGER,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create project_subscription_transactions table to track all subscription payments (for billing history)
CREATE TABLE IF NOT EXISTS project_subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_subscription_id UUID NOT NULL REFERENCES project_subscriptions(id) ON DELETE CASCADE,
  payment_request_id UUID REFERENCES payments_requests(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  invoice_number INTEGER,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_fees_project_id ON project_fees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_fees_company_id ON project_fees(company_id);
CREATE INDEX IF NOT EXISTS idx_project_fees_status ON project_fees(status);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_project_id ON project_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_company_id ON project_subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_project_subscriptions_status ON project_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_project_fee_transactions_project_fee_id ON project_fee_transactions(project_fee_id);
CREATE INDEX IF NOT EXISTS idx_project_subscription_transactions_project_subscription_id ON project_subscription_transactions(project_subscription_id);

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_project_fees_updated_at ON project_fees;
CREATE TRIGGER update_project_fees_updated_at
  BEFORE UPDATE ON project_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_project_subscriptions_updated_at ON project_subscriptions;
CREATE TRIGGER update_project_subscriptions_updated_at
  BEFORE UPDATE ON project_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- from create_project_extension_sources.sql
-- Per-project GitHub repo for POEL-style extension config/scripts (served via /api/extension/project/*)
CREATE TABLE IF NOT EXISTS project_extension_sources (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  github_owner TEXT NOT NULL,
  github_repo TEXT NOT NULL,
  github_ref TEXT NOT NULL DEFAULT 'main',
  deployment_visible_from DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE project_extension_sources
  ADD COLUMN IF NOT EXISTS deployment_visible_from DATE NULL;

CREATE INDEX IF NOT EXISTS idx_project_extension_sources_owner_repo
  ON project_extension_sources (github_owner, github_repo);

DROP TRIGGER IF EXISTS update_project_extension_sources_updated_at ON project_extension_sources;
CREATE TRIGGER update_project_extension_sources_updated_at
  BEFORE UPDATE ON project_extension_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE project_extension_sources IS 'GitHub owner/repo/ref for extension config per project; super admin sets via admin API.';

-- from create_public_upload_links.sql
-- Public upload links: share a URL so anonymous recipients can upload into a company folder.
CREATE TABLE IF NOT EXISTS public.public_upload_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  relative_dir TEXT NOT NULL DEFAULT '',
  label TEXT,
  created_by_auth_user_id TEXT NOT NULL,
  max_bytes BIGINT,
  max_uploads INT,
  upload_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_public_upload_links_token ON public.public_upload_links(token);
CREATE INDEX IF NOT EXISTS idx_public_upload_links_company ON public.public_upload_links(company_id);
CREATE INDEX IF NOT EXISTS idx_public_upload_links_active
  ON public.public_upload_links(company_id, created_at DESC)
  WHERE revoked_at IS NULL;

COMMENT ON TABLE public.public_upload_links IS
  'Tokenized public upload URLs targeting a folder under company-admin-files/{companyId}/.';

-- from add_project_api_key.sql
-- Project API key for entitlement checks (external sites call GET /api/entitlement with this key)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_api_key ON projects(api_key) WHERE api_key IS NOT NULL;

COMMENT ON COLUMN projects.api_key IS 'Secret key for entitlement API; external sites use it to check if project company is paid up.';

-- from add_app_features.sql
-- Product feature flags for extension/project auth payloads.
-- Open-ended JSON maps (string → boolean).
-- Merge order at auth time: platform defaults → project.features → device.features.
-- NULL at any layer = no override for that layer.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT NULL;

ALTER TABLE public.project_auth_devices
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT NULL;

-- Drop mistaken per-user column if an earlier draft of this migration added it.
ALTER TABLE public.users
  DROP COLUMN IF EXISTS features;

COMMENT ON COLUMN public.projects.features IS
  'Open-ended product feature map for this project (JSON object of string → boolean). Null = platform defaults only.';
COMMENT ON COLUMN public.project_auth_devices.features IS
  'Per-device product feature overrides on top of project features. Null = inherit project/defaults.';

-- Authorizations bundle: project + per-device features for admin UI.
CREATE OR REPLACE FUNCTION public.get_company_authorizations_bundle(p_company_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(t.payload ORDER BY t.sort_key DESC)
      FROM (
        SELECT
          p.created_at AS sort_key,
          jsonb_build_object(
            'id', p.id,
            'title', p.title,
            'companyId', p.company_id,
            'accessOverride', p.access_override,
            'deviceLimit', p.device_limit,
            'features', p.features,
            'devices', COALESCE(
              (
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'id', d.id,
                    'name', d.name,
                    'deviceId', d.device_id,
                    'status', d.status,
                    'isAdminDevice', d.is_admin_device,
                    'features', d.features
                  )
                  ORDER BY d.created_at DESC
                )
                FROM project_auth_devices d
                WHERE d.project_id = p.id
              ),
              '[]'::jsonb
            ),
            'extensionSource', (
              SELECT jsonb_build_object(
                'owner', e.github_owner,
                'repo', e.github_repo,
                'ref', e.github_ref,
                'deploymentVisibleFrom', e.deployment_visible_from
              )
              FROM project_extension_sources e
              WHERE e.project_id = p.id
              LIMIT 1
            )
          ) AS payload
        FROM projects p
        WHERE p.company_id = p_company_id
      ) t
    ),
    '[]'::jsonb
  );
$$;

-- from add_is_admin_device_to_project_auth_devices.sql
-- Admin devices: visible only to super admins; excluded from customer device quota.
ALTER TABLE project_auth_devices
  ADD COLUMN IF NOT EXISTS is_admin_device BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_project_auth_devices_admin_device
  ON project_auth_devices(project_id)
  WHERE is_admin_device = true;

COMMENT ON COLUMN project_auth_devices.is_admin_device IS
  'Internal/admin device: hidden from company admins and not counted toward device_limit.';

-- from add_pending_status_to_auth_devices.sql
-- Allow 'pending' status for device requests submitted by external sites
ALTER TABLE project_auth_devices
  DROP CONSTRAINT IF EXISTS project_auth_devices_status_check;

ALTER TABLE project_auth_devices
  ADD CONSTRAINT project_auth_devices_status_check
  CHECK (status IN ('active', 'paused', 'pending'));

-- from add_extension_deployment_visible_from.sql
-- Company admins only see extension repo commits on/after this date (UTC midnight).
-- Super admins see all commits; UI marks pre-cutoff rows.
ALTER TABLE project_extension_sources
  ADD COLUMN IF NOT EXISTS deployment_visible_from DATE NULL;

COMMENT ON COLUMN project_extension_sources.deployment_visible_from IS
  'If set, company admins only see commits with committer/author time >= this date 00:00 UTC. NULL = no filter.';

-- Sync helper: create public.users row from profiles when missing (run after Auth users exist)
-- INSERT INTO public.users (auth_user_id, email, first_name, last_name, role, company_id, ...)
-- SELECT p.id, p.email, p.first_name, p.last_name, ...

GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_project_permissions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated, service_role;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_all_service ON public.users;
-- Service role bypasses RLS; authenticated policies for members:
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR public.is_super_admin());
DROP POLICY IF EXISTS chat_messages_access ON public.chat_messages;
CREATE POLICY chat_messages_access ON public.chat_messages FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

