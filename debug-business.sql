-- Debug business and user data

-- 1. Check all businesses in the table
SELECT id, name, slug, owner_id, created_at 
FROM businesses 
ORDER BY created_at DESC;

-- 2. Check all users/profiles 
SELECT id, full_name, email, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- 3. Check auth.users (if accessible)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check if there are any businesses with NULL owner_id
SELECT COUNT(*) as businesses_with_null_owner 
FROM businesses 
WHERE owner_id IS NULL;

-- 5. Check recent activity
SELECT 
  b.name as business_name,
  b.slug,
  b.owner_id,
  p.full_name as owner_name,
  p.email as owner_email
FROM businesses b
LEFT JOIN profiles p ON b.owner_id = p.id
ORDER BY b.created_at DESC;