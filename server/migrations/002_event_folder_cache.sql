-- Cache the Drive folder ID on the event row so we only call the Drive API
-- once to create the folder, then reuse the ID for every subsequent upload.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
