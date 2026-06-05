-- Stripe billing: one-time event passes + annual subscriptions
-- Run in Supabase SQL Editor.

-- Expand tier values on hosts
ALTER TABLE hosts DROP CONSTRAINT IF EXISTS hosts_tier_check;
ALTER TABLE hosts ADD CONSTRAINT hosts_tier_check
  CHECK (tier IN ('free', 'pro', 'pro_annual', 'business_annual'));

-- Stripe customer/subscription IDs on hosts
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT;
ALTER TABLE hosts ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- One-time premium pass per event
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_premium_pass BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS pass_expires_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS hosts_stripe_customer_idx      ON hosts (stripe_customer_id);
CREATE INDEX IF NOT EXISTS hosts_stripe_subscription_idx  ON hosts (stripe_subscription_id);
