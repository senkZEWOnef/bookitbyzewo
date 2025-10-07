-- Authentication setup for Supabase
-- Run this in your Supabase SQL editor

-- 1. Create a trigger function to automatically create profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- 2. Create the trigger to fire when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Add policy to allow users to insert their own profile during signup
DROP POLICY IF EXISTS "users can insert own profile during signup" ON profiles;
CREATE POLICY "users can insert own profile during signup"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 4. Add policy to allow users to update their own profile
DROP POLICY IF EXISTS "users can update own profile" ON profiles;
CREATE POLICY "users can update own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Ensure profiles table has proper RLS policies
-- Check if basic profile policies exist, if not create them
DO $$
BEGIN
  -- Check if the select policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'own profile'
  ) THEN
    CREATE POLICY "own profile" ON profiles
      FOR SELECT USING (id = auth.uid());
  END IF;
END $$;

-- 6. Add email confirmation settings (optional - you can configure this in Supabase dashboard)
-- These are just reference queries, actual email settings are configured in the dashboard

-- To check current auth settings:
-- SELECT * FROM auth.config;

-- 7. Add custom claims function for role-based access (if needed later)
CREATE OR REPLACE FUNCTION public.get_user_business_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM businesses WHERE owner_id = user_id) THEN 'owner'
      WHEN EXISTS (SELECT 1 FROM staff WHERE user_id = user_id AND role = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM staff WHERE user_id = user_id) THEN 'staff'
      ELSE 'none'
    END;
$$;

-- 8. Create a function to check if user has completed onboarding
CREATE OR REPLACE FUNCTION public.user_has_business(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM businesses WHERE owner_id = user_id
  );
$$;

-- 9. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_business_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_business(uuid) TO authenticated;

-- 10. Add helpful indexes for auth-related queries
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a user signs up';
COMMENT ON FUNCTION public.get_user_business_role(uuid) IS 'Returns the user role in their business (owner, admin, staff, none)';
COMMENT ON FUNCTION public.user_has_business(uuid) IS 'Checks if user has completed business setup';