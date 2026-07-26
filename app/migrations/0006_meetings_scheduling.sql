-- ELSIAA: Poel meetings / scheduling tables missing from 0004–0005.
-- Paste after 0005. Idempotent.

-- Jitsi / admin calendar meetings (distinct from portal_meetings lead bookings)
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  host_user_id TEXT NOT NULL,
  participant_user_ids TEXT[] NOT NULL DEFAULT '{}',
  participant_company_ids UUID[] NOT NULL DEFAULT '{}',
  access_type TEXT NOT NULL DEFAULT 'users'
    CHECK (access_type IN ('users', 'company', 'public')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  jitsi_room_name TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  meeting_request_id UUID REFERENCES public.meeting_requests (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_at ON public.meetings (scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON public.meetings (company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_host_user_id ON public.meetings (host_user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON public.meetings (status);

DROP TRIGGER IF EXISTS meetings_set_updated_at ON public.meetings;
CREATE TRIGGER meetings_set_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Admin calendar blocked slots
CREATE TABLE IF NOT EXISTS public.blocked_time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT blocked_time_slots_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_time_slots_range
  ON public.blocked_time_slots (start_time, end_time);

-- Public / lead availability requests (availability check form)
CREATE TABLE IF NOT EXISTS public.availability_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_requests_created_at
  ON public.availability_requests (created_at DESC);

DROP TRIGGER IF EXISTS availability_requests_set_updated_at ON public.availability_requests;
CREATE TRIGGER availability_requests_set_updated_at
  BEFORE UPDATE ON public.availability_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.meetings IS 'Poel Jitsi meetings used by admin calendar + portal join links.';
COMMENT ON TABLE public.blocked_time_slots IS 'Admin calendar blocked ranges.';
COMMENT ON TABLE public.availability_requests IS 'Inbound availability / contact requests.';
