-- Admin System Setup for BookIt
-- Run this in your Supabase SQL editor

-- 1. Add admin and subscription fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_test_account boolean DEFAULT false;

-- 2. Add subscription and payment tracking to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '14 days');
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_method_required boolean DEFAULT true;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_payment_failed boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_failure_count integer DEFAULT 0;

-- 3. Create coupon codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'free_trial')),
  discount_value numeric(5,2), -- percentage (25.00 for 25%)
  free_trial_months integer,   -- for free trial coupons
  max_uses integer DEFAULT 1,
  used_count integer DEFAULT 0,
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- 4. Create coupon usage tracking
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupon_codes(id) ON DELETE CASCADE,
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  used_by uuid REFERENCES profiles(id),
  used_at timestamptz DEFAULT now(),
  UNIQUE(coupon_id, business_id)
);

-- 5. Create platform analytics table
CREATE TABLE IF NOT EXISTS platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  business_id uuid REFERENCES businesses(id),
  user_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 6. Create admin sessions table (for backdoor access)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7. Create the test admin account
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at, 
  created_at, 
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@bookitbyzewo.com',
  crypt('TestAdmin123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"full_name": "BookIt Admin", "phone": "+1787555-ADMIN"}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- 8. Create the test admin profile
INSERT INTO profiles (
  id,
  full_name,
  phone,
  is_admin,
  is_test_account,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'BookIt Admin',
  '+1787555-ADMIN',
  true,
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  is_admin = true,
  is_test_account = true;

-- 9. Create test business for admin
INSERT INTO businesses (
  id,
  owner_id,
  name,
  slug,
  timezone,
  location,
  subscription_status,
  subscription_plan,
  payment_method_required,
  trial_ends_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'BookIt Test Business',
  'admin-test',
  'America/Puerto_Rico',
  'Test Location, PR',
  'active',
  'unlimited',
  false,
  now() + interval '10 years'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  subscription_status = 'active',
  subscription_plan = 'unlimited',
  payment_method_required = false;

-- 10. Helper functions for admin system
CREATE OR REPLACE FUNCTION is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION is_test_account(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_test_account FROM profiles WHERE id = user_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION can_access_business(user_id uuid, business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    -- Admin can access everything
    is_admin_user(user_id) OR
    -- Test accounts can access everything
    is_test_account(user_id) OR
    -- Regular business member access
    is_business_member(business_id);
$$;

CREATE OR REPLACE FUNCTION check_subscription_access(business_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM businesses b 
        JOIN profiles p ON b.owner_id = p.id 
        WHERE b.id = business_id 
        AND (p.is_admin = true OR p.is_test_account = true)
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = business_id 
        AND subscription_status = 'active'
        AND NOT last_payment_failed
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM businesses 
        WHERE id = business_id 
        AND subscription_status = 'trial'
        AND trial_ends_at > now()
        AND NOT last_payment_failed
      ) THEN true
      ELSE false
    END;
$$;

-- 11. Update RLS policies to respect admin access
DROP POLICY IF EXISTS "admin access override" ON businesses;
CREATE POLICY "admin access override" ON businesses
  FOR ALL USING (
    is_admin_user(auth.uid()) OR 
    is_test_account(auth.uid()) OR 
    is_business_member(id)
  );

DROP POLICY IF EXISTS "admin access appointments" ON appointments;
CREATE POLICY "admin access appointments" ON appointments
  FOR ALL USING (
    is_admin_user(auth.uid()) OR 
    is_test_account(auth.uid()) OR 
    is_business_member(business_id)
  );

-- 12. Policies for admin tables
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin only coupon codes" ON coupon_codes
  FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "admin only coupon usage" ON coupon_usage
  FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "admin only analytics" ON platform_analytics
  FOR ALL USING (is_admin_user(auth.uid()));

CREATE POLICY "admin only sessions" ON admin_sessions
  FOR ALL USING (is_admin_user(auth.uid()));

-- 13. Function to generate coupon codes
CREATE OR REPLACE FUNCTION generate_coupon_code(
  code_prefix text DEFAULT 'BOOK',
  discount_type_param text DEFAULT 'percentage',
  discount_value_param numeric DEFAULT 25.00,
  free_trial_months_param integer DEFAULT NULL,
  max_uses_param integer DEFAULT 1,
  expires_days integer DEFAULT 30
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code text;
  random_suffix text;
BEGIN
  -- Check if user is admin
  IF NOT is_admin_user(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can generate coupon codes';
  END IF;
  
  -- Generate random suffix
  random_suffix := upper(substring(md5(random()::text) from 1 for 6));
  new_code := code_prefix || random_suffix;
  
  -- Insert the coupon
  INSERT INTO coupon_codes (
    code,
    discount_type,
    discount_value,
    free_trial_months,
    max_uses,
    expires_at,
    created_by
  ) VALUES (
    new_code,
    discount_type_param,
    discount_value_param,
    free_trial_months_param,
    max_uses_param,
    now() + (expires_days || ' days')::interval,
    auth.uid()
  );
  
  RETURN new_code;
END;
$$;

-- 14. Function to track platform events
CREATE OR REPLACE FUNCTION track_platform_event(
  event_type_param text,
  event_data_param jsonb DEFAULT '{}',
  business_id_param uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO platform_analytics (
    event_type,
    event_data,
    business_id,
    user_id
  ) VALUES (
    event_type_param,
    event_data_param,
    business_id_param,
    auth.uid()
  );
END;
$$;

-- 15. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX IF NOT EXISTS idx_coupon_codes_active ON coupon_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_event_type ON platform_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_created_at ON platform_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_businesses_subscription_status ON businesses(subscription_status);

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_admin_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_test_account(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_business(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_subscription_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_coupon_code(text, text, numeric, integer, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION track_platform_event(text, jsonb, uuid) TO authenticated;

COMMENT ON TABLE coupon_codes IS 'Promotional codes for discounts and free trials';
COMMENT ON TABLE platform_analytics IS 'Platform usage analytics (privacy-compliant)';
COMMENT ON FUNCTION generate_coupon_code IS 'Generate promotional coupon codes (admin only)';
COMMENT ON FUNCTION check_subscription_access IS 'Check if business has valid subscription access';