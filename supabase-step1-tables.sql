-- Step 1: Add table columns and enum values
-- Run this first, then run step 2

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
DO $$ 
BEGIN
    -- Add 'completed' status if it doesn't exist (maps to 'succeeded')
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'completed' AND enumtypid = 'payment_status'::regtype) THEN
        ALTER TYPE payment_status ADD VALUE 'completed';
    END IF;
END $$;