-- Setup Demo Business for BookIt by Zewo
-- Run this in Supabase SQL Editor to create demo data

-- Option 1: Use your actual user ID (replace with your real user ID from auth.users)
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Let's just update one of your existing businesses to be the demo
-- First, let's see what businesses exist and convert one to demo

-- Option 1: Convert your first business to be the demo
UPDATE businesses 
SET 
  name = 'Maria''s Hair Salon',
  slug = 'demo',
  timezone = 'America/Puerto_Rico',
  location = '123 Calle Principal, San Juan, PR 00901',
  messaging_mode = 'manual'
WHERE owner_id IN (SELECT id FROM auth.users LIMIT 1)
AND id IN (SELECT id FROM businesses LIMIT 1);

-- Get the business ID for later use
-- (We'll reference it in services and staff)

-- Update existing services to have demo-friendly content using a CTE
WITH numbered_services AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM services 
  WHERE business_id IN (SELECT id FROM businesses WHERE slug = 'demo')
),
demo_updates AS (
  SELECT 
    id,
    CASE 
      WHEN rn = 1 THEN 'Corte de Cabello / Haircut'
      WHEN rn = 2 THEN 'Color y Highlights'  
      WHEN rn = 3 THEN 'Manicura / Manicure'
      ELSE 'Pedicura / Pedicure'
    END as new_name,
    CASE 
      WHEN rn = 1 THEN 'Professional haircut and styling. Corte profesional y peinado.'
      WHEN rn = 2 THEN 'Hair coloring and highlights service. Servicio de coloración y mechas.'
      WHEN rn = 3 THEN 'Complete manicure service. Servicio completo de manicura.'
      ELSE 'Relaxing pedicure treatment. Tratamiento relajante de pedicura.'
    END as new_description,
    CASE 
      WHEN rn = 1 THEN 45
      WHEN rn = 2 THEN 120
      WHEN rn = 3 THEN 60
      ELSE 90
    END as new_duration,
    CASE 
      WHEN rn = 1 THEN 3500
      WHEN rn = 2 THEN 8500
      WHEN rn = 3 THEN 3000
      ELSE 4500
    END as new_price,
    CASE 
      WHEN rn = 1 THEN 1000
      WHEN rn = 2 THEN 2500
      WHEN rn = 3 THEN 1000
      ELSE 1500
    END as new_deposit
  FROM numbered_services
)
UPDATE services 
SET 
  name = du.new_name,
  description = du.new_description,
  duration_min = du.new_duration,
  price_cents = du.new_price,
  deposit_cents = du.new_deposit,
  buffer_before_min = 15,
  buffer_after_min = 15,
  max_per_slot = 1
FROM demo_updates du
WHERE services.id = du.id;

-- Delete existing availability rules for demo business
DELETE FROM availability_rules WHERE business_id IN (SELECT id FROM businesses WHERE slug = 'demo');

-- Create availability rules (Mon-Sat)  
WITH demo_business AS (
  SELECT id as business_id FROM businesses WHERE slug = 'demo' LIMIT 1
)
INSERT INTO availability_rules (business_id, staff_id, weekday, start_time, end_time, created_at)
SELECT 
  business_id,
  null, -- business-wide availability
  weekday,
  start_time,
  end_time,
  now()
FROM demo_business,
(VALUES 
  (1, '09:00'::time, '18:00'::time), -- Monday
  (2, '09:00'::time, '18:00'::time), -- Tuesday  
  (3, '09:00'::time, '18:00'::time), -- Wednesday
  (4, '09:00'::time, '18:00'::time), -- Thursday
  (5, '09:00'::time, '18:00'::time), -- Friday
  (6, '10:00'::time, '16:00'::time)  -- Saturday
) AS t(weekday, start_time, end_time);

-- Update existing staff for demo business
UPDATE staff 
SET 
  display_name = 'Maria Rodriguez',
  phone = '+1-787-555-0123',
  role = 'admin'
WHERE business_id IN (SELECT id FROM businesses WHERE slug = 'demo');

-- Make sure all services are linked to staff (delete and recreate links)
DELETE FROM service_staff 
WHERE service_id IN (
  SELECT s.id FROM services s 
  JOIN businesses b ON s.business_id = b.id 
  WHERE b.slug = 'demo'
);

-- Link all services to all staff members for the demo business
INSERT INTO service_staff (service_id, staff_id)
SELECT srv.id, st.id
FROM services srv
JOIN businesses b ON srv.business_id = b.id
JOIN staff st ON st.business_id = b.id
WHERE b.slug = 'demo'
ON CONFLICT (service_id, staff_id) DO NOTHING;