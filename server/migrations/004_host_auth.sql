-- Link hosts table to Supabase Auth users.
-- auth_id = auth.users.id (UUID stored as text for portability).
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS auth_id TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_hosts_auth_id ON hosts(auth_id);
