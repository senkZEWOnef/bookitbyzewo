# Complete Supabase Setup Guide for BookIt by Zewo

## 1. Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign in with GitHub/Google
4. Click "New Project"
5. Choose your organization
6. Enter project details:
   - **Name**: `bookitbyzewo` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (US East for PR)
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

## 2. Get Your Environment Variables

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values to your `.env.local` file:

```env
# Replace these with your actual values from Supabase Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Keep these as-is for now
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Run the Database Schema

Go to **SQL Editor** in your Supabase dashboard and run this complete script:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create custom types
CREATE TYPE appointment_status AS ENUM ('pending','confirmed','canceled','noshow','completed');
CREATE TYPE payment_status AS ENUM ('pending','succeeded','failed','refunded');
CREATE TYPE payment_type AS ENUM ('deposit','service','no_show_fee');

-- 1) Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Businesses table
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  location text,
  timezone text NOT NULL DEFAULT 'America/Puerto_Rico',
  messaging_mode text NOT NULL DEFAULT 'manual', -- manual | wa_cloud | twilio
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Staff table
CREATE TABLE public.staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'member', -- member | admin
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) Services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_min integer NOT NULL CHECK (duration_min BETWEEN 5 AND 600),
  price_cents integer NOT NULL DEFAULT 0,
  deposit_cents integer NOT NULL DEFAULT 0,
  buffer_before_min integer NOT NULL DEFAULT 0,
  buffer_after_min integer NOT NULL DEFAULT 0,
  max_per_slot smallint NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) Service-Staff junction table
CREATE TABLE public.service_staff (
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (service_id, staff_id)
);

-- 6) Availability rules (weekly schedule)
CREATE TABLE public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7) Availability exceptions (holidays, special hours)
CREATE TABLE public.availability_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_closed boolean NOT NULL DEFAULT true,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8) Appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_locale text DEFAULT 'es-PR',
  status appointment_status NOT NULL DEFAULT 'confirmed',
  source text NOT NULL DEFAULT 'public', -- public | admin
  notes text,
  deposit_payment_id text, -- Stripe session ID or ATH reference
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent overlapping appointments for same staff
  EXCLUDE USING gist (
    staff_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (staff_id IS NOT NULL)
);

-- 9) Payments table
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  provider text NOT NULL, -- 'stripe' | 'ath'
  external_id text, -- Stripe session ID or ATH reference
  amount_cents integer NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  status payment_status NOT NULL DEFAULT 'pending',
  kind payment_type NOT NULL DEFAULT 'deposit',
  meta jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10) Messages log
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  to_phone text NOT NULL,
  channel text NOT NULL, -- whatsapp | sms
  direction text NOT NULL DEFAULT 'out', -- out | in
  status text NOT NULL DEFAULT 'queued', -- queued | sent | delivered | failed
  template_key text,
  body text NOT NULL,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Helper function to check business membership
CREATE OR REPLACE FUNCTION public.is_business_member(business_id uuid)
RETURNS boolean 
LANGUAGE sql 
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses b
    WHERE b.id = business_id
      AND (
        b.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.staff s 
          WHERE s.business_id = business_id 
            AND s.user_id = auth.uid()
        )
      )
  );
$$;

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Business members can view business" ON public.businesses
  FOR SELECT USING (is_business_member(id));

CREATE POLICY "Business owners can create business" ON public.businesses
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update business" ON public.businesses
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete business" ON public.businesses
  FOR DELETE USING (auth.uid() = owner_id);

-- Staff policies
CREATE POLICY "Business members can view staff" ON public.staff
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage staff" ON public.staff
  FOR ALL USING (is_business_member(business_id));

-- Services policies
CREATE POLICY "Business members can view services" ON public.services
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage services" ON public.services
  FOR ALL USING (is_business_member(business_id));

-- Service-staff policies
CREATE POLICY "Business members can view service assignments" ON public.service_staff
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = service_id AND is_business_member(s.business_id)
    )
  );

CREATE POLICY "Business members can manage service assignments" ON public.service_staff
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.services s 
      WHERE s.id = service_id AND is_business_member(s.business_id)
    )
  );

-- Availability rules policies
CREATE POLICY "Business members can view availability rules" ON public.availability_rules
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage availability rules" ON public.availability_rules
  FOR ALL USING (is_business_member(business_id));

-- Availability exceptions policies  
CREATE POLICY "Business members can view availability exceptions" ON public.availability_exceptions
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage availability exceptions" ON public.availability_exceptions
  FOR ALL USING (is_business_member(business_id));

-- Appointments policies
CREATE POLICY "Business members can view appointments" ON public.appointments
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage appointments" ON public.appointments
  FOR UPDATE USING (is_business_member(business_id));

CREATE POLICY "Business members can delete appointments" ON public.appointments
  FOR DELETE USING (is_business_member(business_id));

-- Allow anonymous users to create appointments (public booking)
CREATE POLICY "Anonymous users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (starts_at > now());

-- Payments policies
CREATE POLICY "Business members can view payments" ON public.payments
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage payments" ON public.payments
  FOR ALL USING (is_business_member(business_id));

-- Messages policies
CREATE POLICY "Business members can view messages" ON public.messages
  FOR SELECT USING (is_business_member(business_id));

CREATE POLICY "Business members can manage messages" ON public.messages
  FOR ALL USING (is_business_member(business_id));

-- Create indexes for better performance
CREATE INDEX idx_businesses_owner_id ON public.businesses(owner_id);
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_staff_business_id ON public.staff(business_id);
CREATE INDEX idx_staff_user_id ON public.staff(user_id);
CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_availability_rules_business_id ON public.availability_rules(business_id);
CREATE INDEX idx_availability_rules_staff_id ON public.availability_rules(staff_id);
CREATE INDEX idx_availability_exceptions_business_id ON public.availability_exceptions(business_id);
CREATE INDEX idx_availability_exceptions_date ON public.availability_exceptions(date);
CREATE INDEX idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX idx_appointments_starts_at ON public.appointments(starts_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_payments_business_id ON public.payments(business_id);
CREATE INDEX idx_payments_external_id ON public.payments(external_id);
CREATE INDEX idx_messages_business_id ON public.messages(business_id);
CREATE INDEX idx_messages_appointment_id ON public.messages(appointment_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_rules_updated_at BEFORE UPDATE ON public.availability_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_exceptions_updated_at BEFORE UPDATE ON public.availability_exceptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. **Site URL**: Set to `http://localhost:3000` (for development)
3. **Redirect URLs**: Add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/dashboard`
4. **Email Templates**: Customize if needed (optional)

## 5. Test the Setup

1. **Restart your dev server**:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

2. **Test Sign Up**:
   - Go to http://localhost:3000/signup
   - Create a test account
   - Check that you can access /dashboard

3. **Verify Database**:
   - Go to **Table Editor** in Supabase
   - You should see your profile in the `profiles` table
   - Check that RLS is enabled (lock icons on tables)

## 6. Optional: Seed Data (for testing)

If you want some test data, run this in SQL Editor:

```sql
-- Insert a test business (replace user_id with your actual profile ID)
INSERT INTO public.businesses (owner_id, name, slug, location, timezone) 
VALUES (
  'your-user-id-here', -- Replace with your actual profile ID from profiles table
  'Test Hair Salon',
  'test-salon', 
  '123 Main St, San Juan, PR',
  'America/Puerto_Rico'
);

-- Get the business ID and insert test services
INSERT INTO public.services (business_id, name, description, duration_min, price_cents, deposit_cents) 
VALUES 
  ((SELECT id FROM public.businesses WHERE slug = 'test-salon'), 'Haircut', 'Classic haircut', 45, 3500, 1000),
  ((SELECT id FROM public.businesses WHERE slug = 'test-salon'), 'Beard Trim', 'Professional beard trim', 20, 1500, 500);

-- Insert test availability (Monday to Friday, 9 AM to 5 PM)
INSERT INTO public.availability_rules (business_id, staff_id, weekday, start_time, end_time)
SELECT 
  (SELECT id FROM public.businesses WHERE slug = 'test-salon'),
  NULL,
  generate_series(1, 5), -- Monday to Friday
  '09:00'::time,
  '17:00'::time;
```

## 7. Common Issues & Solutions

### ❌ **"relation does not exist" errors**
- Make sure you ran the complete SQL script
- Check that you're in the correct project
- Verify all tables were created in **Table Editor**

### ❌ **RLS policy errors**  
- Ensure you're signed in when testing
- Check that your user ID exists in `profiles` table
- Verify the `is_business_member()` function was created

### ❌ **Environment variable errors**
- Double-check your `.env.local` file
- Restart your dev server after changing env vars
- Make sure there are no spaces around the `=` signs

### ❌ **Authentication not working**
- Check your Site URL in Auth settings
- Verify redirect URLs are correct
- Try signing out and back in

## 8. Production Setup (Later)

When you're ready to deploy:

1. **Update Site URLs** in Auth settings to your production domain
2. **Environment Variables**: Set production values in your hosting platform
3. **Database Backups**: Enable automatic backups in Supabase
4. **SSL**: Ensure HTTPS for production (handled by Vercel/Netlify)

## 🎉 Next Steps

Once Supabase is set up:

1. ✅ Test the auth flow (signup/login)
2. ✅ Complete the business onboarding  
3. ✅ Create your first service
4. ✅ Test the public booking page
5. ✅ Set up Stripe for payments

Your WhatsApp-first booking system backend is now ready! 🚀