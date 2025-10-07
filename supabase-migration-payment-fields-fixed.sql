-- Migration: Add missing payment and business configuration fields
-- Run this in your Supabase SQL editor (FIXED VERSION)

-- 1. Add payment configuration fields to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ath_movil_enabled boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ath_movil_public_token text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ath_movil_private_token text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_enabled boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_publishable_key text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_secret_key text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deposit_enabled boolean DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deposit_amount numeric(10,2) DEFAULT 10.00;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS deposit_policy text DEFAULT 'A deposit is required to confirm your appointment';

-- 2. Add payment tracking fields to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS deposit_amount integer; -- in cents
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_amount integer;   -- in cents

-- 3. Update payment_status enum to match codebase usage
-- First, check if we need to update the enum
DO $$ 
BEGIN
    -- Add 'completed' status if it doesn't exist (maps to 'succeeded')
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'payment_status'::regtype) THEN
        ALTER TYPE payment_status ADD VALUE 'completed';
    END IF;
END $$;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_starts_at ON appointments(starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_availability_rules_business_id ON availability_rules(business_id);

-- 5. Add policies for anonymous users (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "public can read business for booking" ON businesses;
DROP POLICY IF EXISTS "public can read services for booking" ON services;
DROP POLICY IF EXISTS "service role can manage payments" ON payments;
DROP POLICY IF EXISTS "service role can update appointments" ON appointments;

-- Create the policies
CREATE POLICY "public can read business for booking" 
ON businesses 
FOR SELECT 
TO anon 
USING (true);

CREATE POLICY "public can read services for booking"
ON services
FOR SELECT
TO anon
USING (true);

CREATE POLICY "service role can manage payments"
ON payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "service role can update appointments"
ON appointments  
FOR UPDATE
TO service_role
USING (true);

-- 6. Fix appointment overlapping constraints
-- Drop existing constraints if they exist
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_staff_id_tstzrange_excl;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_staff_overlap_excl;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_business_overlap_excl;

-- Recreate with better handling of NULL staff_id
-- For staff-specific appointments
ALTER TABLE appointments ADD CONSTRAINT appointments_staff_overlap_excl 
EXCLUDE USING gist (
  staff_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (staff_id IS NOT NULL);

-- For business-level appointments (staff_id IS NULL)
ALTER TABLE appointments ADD CONSTRAINT appointments_business_overlap_excl
EXCLUDE USING gist (
  business_id WITH =,
  tstzrange(starts_at, ends_at, '[)') WITH &&
) WHERE (staff_id IS NULL);

-- 7. Create helpful view for appointment details
DROP VIEW IF EXISTS appointment_details;
CREATE VIEW appointment_details AS
SELECT 
  a.*,
  s.name as service_name,
  s.duration_min,
  s.price_cents as service_price_cents,
  st.display_name as staff_name,
  b.name as business_name,
  b.timezone as business_timezone,
  COALESCE(p.status, 'pending') as payment_status,
  p.provider as payment_provider,
  p.amount_cents as payment_amount_cents
FROM appointments a
JOIN services s ON a.service_id = s.id
JOIN businesses b ON a.business_id = b.id
LEFT JOIN staff st ON a.staff_id = st.id
LEFT JOIN payments p ON p.meta->>'appointment_id' = a.id::text AND p.status IN ('completed', 'succeeded');

-- Grant access to the view
GRANT SELECT ON appointment_details TO authenticated;
GRANT SELECT ON appointment_details TO service_role;