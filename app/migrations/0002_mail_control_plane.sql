-- Postgres: Elssia Mail control plane (scoped send keys + audit log).
-- Apply manually against DATABASE_URL, or rely on ensureMailSchema() at runtime.

CREATE TABLE IF NOT EXISTS mail_api_keys (
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

CREATE INDEX IF NOT EXISTS mail_api_keys_prefix_idx ON mail_api_keys (key_prefix);
CREATE INDEX IF NOT EXISTS mail_api_keys_enabled_idx ON mail_api_keys (enabled)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS mail_send_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL CHECK (source IN ('admin_ui', 'scoped_api')),
  api_key_id UUID REFERENCES mail_api_keys (id) ON DELETE SET NULL,
  from_addr TEXT NOT NULL,
  to_addrs TEXT[] NOT NULL DEFAULT '{}',
  cc TEXT[] NOT NULL DEFAULT '{}',
  bcc TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  provider_response TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS mail_send_log_created_idx ON mail_send_log (created_at DESC);
CREATE INDEX IF NOT EXISTS mail_send_log_api_key_idx ON mail_send_log (api_key_id);
