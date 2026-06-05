-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── HOSTS ────────────────────────────────────────────────────────────────────
-- Represents a registered user who creates and owns events.
CREATE TABLE IF NOT EXISTS hosts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  display_name  TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── EVENTS ───────────────────────────────────────────────────────────────────
-- An event created by a host. Guests use the join_code or QR to upload.
CREATE TABLE IF NOT EXISTS events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id       UUID        NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,

  name          TEXT        NOT NULL,
  description   TEXT,

  -- Short alphanumeric code guests type/scan to join (e.g. "WEDD24")
  join_code     TEXT        NOT NULL UNIQUE,

  -- Where the QR code deep-link points (populated after creation)
  qr_url        TEXT,

  -- Status lifecycle: draft → active → closed
  status        TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'closed')),

  starts_at     TIMESTAMPTZ,
  ends_at       TIMESTAMPTZ,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_host_id  ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_join_code ON events(join_code);

-- ─── CLOUD_TOKENS ─────────────────────────────────────────────────────────────
-- Stores encrypted OAuth tokens linking a host's event to their cloud storage.
-- One row per provider per event (a host could link both Google Drive and Dropbox).
CREATE TABLE IF NOT EXISTS cloud_tokens (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id             UUID        NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
  event_id            UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- "google_drive" | "dropbox" | "onedrive"
  provider            TEXT        NOT NULL
                        CHECK (provider IN ('google_drive', 'dropbox', 'onedrive')),

  -- AES-256-GCM encrypted: stored as "iv:authTag:ciphertext" (all hex)
  access_token_enc    TEXT        NOT NULL,
  refresh_token_enc   TEXT,

  -- When the access token expires so we know when to refresh
  token_expires_at    TIMESTAMPTZ,

  -- Provider-specific folder/album ID where photos are uploaded
  destination_folder_id   TEXT,
  destination_folder_name TEXT,

  -- Provider's user/account identifier for display purposes
  provider_account_id   TEXT,
  provider_account_email TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (event_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_cloud_tokens_event_id ON cloud_tokens(event_id);

-- ─── AUTO-UPDATE updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hosts_updated_at
  BEFORE UPDATE ON hosts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cloud_tokens_updated_at
  BEFORE UPDATE ON cloud_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
