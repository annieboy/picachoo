-- Add a secret token used to share the wall with non-host viewers.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS wall_view_token TEXT;

-- Back-fill existing events with a random 12-char hex token.
UPDATE events
SET wall_view_token = encode(gen_random_bytes(6), 'hex')
WHERE wall_view_token IS NULL;
