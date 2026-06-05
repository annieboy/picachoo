-- Add subscription tier to hosts.
-- Run this in Supabase SQL Editor.
ALTER TABLE hosts
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro'));

-- Index for fast tier lookups during upload session checks
CREATE INDEX IF NOT EXISTS hosts_tier_idx ON hosts (tier);
