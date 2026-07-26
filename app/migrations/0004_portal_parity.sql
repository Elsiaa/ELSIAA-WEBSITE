-- ELSIAA portal parity with Poel (module access, authorizations, signatures, logs).
-- Paste after elsiaa_supabase_full.sql. Idempotent.

-- ── Module flags on company membership (Poel: columns on users) ────────────
ALTER TABLE public.company_members
  ADD COLUMN IF NOT EXISTS authorizations_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS program_logs_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS files_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS support_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS all_projects_access BOOLEAN NOT NULL DEFAULT FALSE;

-- Owners/admins get full modules by default (existing rows)
UPDATE public.company_members
SET
  authorizations_allowed = TRUE,
  program_logs_allowed = TRUE,
  files_allowed = TRUE,
  support_allowed = TRUE,
  all_projects_access = TRUE
WHERE role IN ('owner', 'admin');

-- ── Projects: entitlement fields (Poel authorizations) ──────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS device_limit INTEGER,
  ADD COLUMN IF NOT EXISTS access_override TEXT
    CHECK (access_override IS NULL OR access_override IN ('allowed', 'blocked')),
  ADD COLUMN IF NOT EXISTS api_key TEXT;

-- ── Auth devices ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_auth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  device_id TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'pending')),
  is_admin_device BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, device_id)
);

CREATE INDEX IF NOT EXISTS project_auth_devices_project_idx
  ON public.project_auth_devices (project_id);

DROP TRIGGER IF EXISTS project_auth_devices_set_updated_at ON public.project_auth_devices;
CREATE TRIGGER project_auth_devices_set_updated_at
  BEFORE UPDATE ON public.project_auth_devices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Program logs ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_program_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'info'
    CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_program_logs_project_idx
  ON public.project_program_logs (project_id, created_at DESC);

-- ── PDF signatures (Poel Signatures) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pdf_signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  storage_key TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'completed', 'cancelled')),
  public_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  created_by UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdf_signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.pdf_signature_requests (id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Signature',
  page INTEGER NOT NULL DEFAULT 1,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  width NUMERIC NOT NULL DEFAULT 200,
  height NUMERIC NOT NULL DEFAULT 60,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pdf_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.pdf_signature_requests (id) ON DELETE CASCADE,
  field_id UUID REFERENCES public.pdf_signature_fields (id) ON DELETE SET NULL,
  signer_name TEXT,
  signer_email TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pdf_sig_requests_company_idx
  ON public.pdf_signature_requests (company_id);
CREATE INDEX IF NOT EXISTS pdf_sig_requests_token_idx
  ON public.pdf_signature_requests (public_token);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.project_auth_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_program_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_signature_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_auth_devices_access ON public.project_auth_devices;
CREATE POLICY project_auth_devices_access ON public.project_auth_devices
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.is_company_admin(p.company_id)
          OR EXISTS (
            SELECT 1 FROM public.company_members m
            WHERE m.company_id = p.company_id
              AND m.user_id = auth.uid()
              AND m.authorizations_allowed = TRUE
          )
        )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.is_company_admin(p.company_id)
          OR EXISTS (
            SELECT 1 FROM public.company_members m
            WHERE m.company_id = p.company_id
              AND m.user_id = auth.uid()
              AND m.authorizations_allowed = TRUE
          )
        )
    )
  );

DROP POLICY IF EXISTS project_program_logs_access ON public.project_program_logs;
CREATE POLICY project_program_logs_access ON public.project_program_logs
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND (
          public.is_company_admin(p.company_id)
          OR EXISTS (
            SELECT 1 FROM public.company_members m
            WHERE m.company_id = p.company_id
              AND m.user_id = auth.uid()
              AND m.program_logs_allowed = TRUE
          )
        )
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND public.is_company_admin(p.company_id)
    )
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS pdf_sig_requests_access ON public.pdf_signature_requests;
CREATE POLICY pdf_sig_requests_access ON public.pdf_signature_requests
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (company_id IS NOT NULL AND public.is_company_member(company_id))
  )
  WITH CHECK (
    public.is_super_admin()
    OR (company_id IS NOT NULL AND public.is_company_admin(company_id))
  );

DROP POLICY IF EXISTS pdf_sig_fields_access ON public.pdf_signature_fields;
CREATE POLICY pdf_sig_fields_access ON public.pdf_signature_fields
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.pdf_signature_requests r
      WHERE r.id = request_id
        AND (r.company_id IS NULL OR public.is_company_member(r.company_id))
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.pdf_signature_requests r
      WHERE r.id = request_id
        AND (r.company_id IS NULL OR public.is_company_admin(r.company_id))
    )
  );

DROP POLICY IF EXISTS pdf_signatures_access ON public.pdf_signatures;
CREATE POLICY pdf_signatures_access ON public.pdf_signatures
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.pdf_signature_requests r
      WHERE r.id = request_id
        AND (r.company_id IS NULL OR public.is_company_member(r.company_id))
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.pdf_signature_requests r
      WHERE r.id = request_id
        AND (r.company_id IS NULL OR public.is_company_member(r.company_id))
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_auth_devices TO authenticated;
GRANT SELECT, INSERT ON public.project_program_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_signature_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdf_signature_fields TO authenticated;
GRANT SELECT, INSERT ON public.pdf_signatures TO authenticated;
GRANT ALL ON public.project_auth_devices TO service_role;
GRANT ALL ON public.project_program_logs TO service_role;
GRANT ALL ON public.pdf_signature_requests TO service_role;
GRANT ALL ON public.pdf_signature_fields TO service_role;
GRANT ALL ON public.pdf_signatures TO service_role;
