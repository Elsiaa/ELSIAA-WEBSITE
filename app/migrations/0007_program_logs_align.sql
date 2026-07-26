-- Program logs ingest token + ensure message/metadata schema (ELSIAA).
-- Safe to re-run.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS program_log_ingest_token TEXT;

UPDATE public.projects
SET program_log_ingest_token = encode(gen_random_bytes(24), 'hex')
WHERE program_log_ingest_token IS NULL OR btrim(program_log_ingest_token) = '';

-- If an older Poel-shaped table used summary/payload, add ELSIAA columns and backfill.
ALTER TABLE public.project_program_logs
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_program_logs' AND column_name = 'summary'
  ) THEN
    UPDATE public.project_program_logs
    SET message = COALESCE(NULLIF(btrim(message), ''), summary, '')
    WHERE message IS NULL OR btrim(message) = '';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_program_logs' AND column_name = 'payload'
  ) THEN
    UPDATE public.project_program_logs
    SET metadata = COALESCE(payload, '{}'::jsonb)
    WHERE metadata = '{}'::jsonb AND payload IS NOT NULL;
  END IF;
END $$;

UPDATE public.project_program_logs
SET message = ''
WHERE message IS NULL;

ALTER TABLE public.project_program_logs
  ALTER COLUMN message SET DEFAULT '',
  ALTER COLUMN message SET NOT NULL;
