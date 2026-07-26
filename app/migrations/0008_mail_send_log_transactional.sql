-- Allow transactional app mail in mail_send_log.source
-- Safe to re-run.

ALTER TABLE public.mail_send_log DROP CONSTRAINT IF EXISTS mail_send_log_source_check;

ALTER TABLE public.mail_send_log
  ADD CONSTRAINT mail_send_log_source_check
  CHECK (source IN ('admin_ui', 'scoped_api', 'transactional'));
