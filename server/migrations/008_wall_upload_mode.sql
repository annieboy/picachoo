-- Who can contribute (upload) photos to the live wall per event
ALTER TABLE events ADD COLUMN IF NOT EXISTS
  wall_upload_mode TEXT NOT NULL DEFAULT 'everyone'
  CHECK (wall_upload_mode IN ('everyone', 'host_only'));
