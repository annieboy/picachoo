-- Photo metadata written after each successful Drive upload.
-- The thumbnail_url points to the public Drive thumbnail so the wall
-- can display images without any authentication proxy.
CREATE TABLE IF NOT EXISTS photos (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  guest_name    TEXT        NOT NULL,
  drive_file_id TEXT        NOT NULL,
  thumbnail_url TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_event_id_created
  ON photos(event_id, created_at DESC);
