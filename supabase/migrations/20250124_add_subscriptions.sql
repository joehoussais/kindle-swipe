-- ============================================================================
-- Highlight Pro: Subscription & Usage Tracking Schema
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Subscriptions table: tracks Stripe subscription status
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'free',  -- free, active, canceled, past_due, unpaid
  plan TEXT NOT NULL DEFAULT 'free',    -- free, pro
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage limits table: tracks free tier usage
CREATE TABLE IF NOT EXISTS usage_limits (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  exports_used INTEGER DEFAULT 0,
  extension_imports_used INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial creation)
CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only service role (webhooks) can update subscriptions
-- This ensures subscription status can only be changed by Stripe webhooks
CREATE POLICY "Service role can update subscriptions" ON subscriptions
  FOR UPDATE USING (auth.role() = 'service_role');

-- RLS Policies for usage_limits
-- Users can read their own usage
CREATE POLICY "Users can read own usage" ON usage_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage record
CREATE POLICY "Users can insert own usage" ON usage_limits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage (for incrementing counters)
CREATE POLICY "Users can update own usage" ON usage_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check if a user has pro access
CREATE OR REPLACE FUNCTION has_pro_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND plan = 'pro'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining exports for a user
CREATE OR REPLACE FUNCTION get_remaining_exports(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_is_pro BOOLEAN;
  v_exports_used INTEGER;
  v_last_reset TIMESTAMPTZ;
  v_free_limit INTEGER := 3;
BEGIN
  -- Check if user is pro
  SELECT has_pro_access(p_user_id) INTO v_is_pro;
  IF v_is_pro THEN
    RETURN 999999; -- Unlimited
  END IF;

  -- Get usage
  SELECT exports_used, last_reset_at INTO v_exports_used, v_last_reset
  FROM usage_limits WHERE user_id = p_user_id;

  -- If no record exists, they have full free limit
  IF v_exports_used IS NULL THEN
    RETURN v_free_limit;
  END IF;

  -- Check if we should reset (monthly)
  IF v_last_reset < date_trunc('month', NOW()) THEN
    -- Reset the counter
    UPDATE usage_limits
    SET exports_used = 0, last_reset_at = NOW()
    WHERE user_id = p_user_id;
    RETURN v_free_limit;
  END IF;

  RETURN GREATEST(0, v_free_limit - v_exports_used);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment export count (returns false if limit reached)
CREATE OR REPLACE FUNCTION increment_export_count(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  SELECT get_remaining_exports(p_user_id) INTO v_remaining;

  IF v_remaining <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Upsert usage record
  INSERT INTO usage_limits (user_id, exports_used, last_reset_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET exports_used = usage_limits.exports_used + 1;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger to auto-create usage_limits record when user signs up
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usage_limits (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_usage();
