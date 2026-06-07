-- Pro feature: custom background image and photo frame overlay for the live wall
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS wall_background_url TEXT,
  ADD COLUMN IF NOT EXISTS wall_frame_url       TEXT;
