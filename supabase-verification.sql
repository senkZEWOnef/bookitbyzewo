-- Verification script: Run this to check if your Supabase setup is correct
-- Copy and paste sections into your Supabase SQL editor

-- 1. Check if all required tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'profiles', 'businesses', 'staff', 'services', 'service_staff',
      'availability_rules', 'availability_exceptions', 'appointments', 
      'payments', 'messages'
    ) THEN '✅ Required table exists'
    ELSE '❌ Unexpected table'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check if all required columns exist in businesses table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'businesses' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check payment-related columns in appointments
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
  AND table_schema = 'public'
  AND column_name IN ('deposit_amount', 'total_amount', 'customer_locale')
ORDER BY column_name;

-- 4. Check payments table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'payments' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check if payment_status enum has all required values
SELECT 
  enumlabel as status_value
FROM pg_enum 
WHERE enumtypid = 'payment_status'::regtype
ORDER BY enumlabel;

-- 6. Check if all required indexes exist
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 7. Check RLS policies
SELECT 
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 8. Test the is_business_member function
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'is_business_member';

-- 9. Check if the appointment_details view exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'appointment_details';

-- 10. Sample data check (run this after you have some test data)
-- Uncomment these lines when you have test data:

/*
-- Check if you can create a test business
INSERT INTO businesses (owner_id, name, slug, timezone) 
VALUES (auth.uid(), 'Test Business', 'test-business-' || extract(epoch from now()), 'America/Puerto_Rico');

-- Check if you can create a test service
INSERT INTO services (business_id, name, duration_min, price_cents, deposit_cents)
SELECT id, 'Test Service', 60, 5000, 1500
FROM businesses 
WHERE owner_id = auth.uid() 
LIMIT 1;

-- Clean up test data
DELETE FROM services WHERE name = 'Test Service';
DELETE FROM businesses WHERE name = 'Test Business';
*/