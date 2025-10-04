-- Insert test user/profile first (since business references profile)
INSERT INTO users (
  id, email, password_hash, email_verified, created_at, updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'dummy_hash',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id, full_name, avatar_url, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Test User',
  '',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert test business
INSERT INTO businesses (
  id, owner_id, name, slug, timezone, location, 
  primary_color, messaging_mode, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001', 
  'Test Business',
  'test-business',
  'America/Puerto_Rico',
  'San Juan, PR',
  '#007bff',
  'manual',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert test service
INSERT INTO services (
  id, business_id, name, description, duration_min,
  price_cents, deposit_cents, buffer_before_min, buffer_after_min,
  max_per_slot, is_active, created_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Test Service',
  'A test service for demonstrations',
  60,
  5000,
  1000,
  0,
  0,
  1,
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;