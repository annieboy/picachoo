-- Live wall visibility mode per event
ALTER TABLE events ADD COLUMN IF NOT EXISTS
  wall_mode TEXT NOT NULL DEFAULT 'off'
  CHECK (wall_mode IN ('off', 'everyone', 'host_only'));
