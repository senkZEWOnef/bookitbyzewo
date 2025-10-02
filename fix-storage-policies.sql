-- Check if business-assets bucket exists
SELECT * FROM storage.buckets WHERE name = 'business-assets';

-- If the bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload to their business folder" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their business assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their business assets" ON storage.objects;

-- Create simple storage policies
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'business-assets');

CREATE POLICY "Authenticated users can delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'business-assets');