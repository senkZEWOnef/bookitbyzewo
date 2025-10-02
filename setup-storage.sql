-- Create the business-assets storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets', 
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage policy for authenticated users to upload to their business folder
CREATE POLICY "Users can upload to their business folder" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'business-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text 
    FROM businesses b 
    WHERE b.owner_id = auth.uid()
  )
);

-- Create storage policy for public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'business-assets');

-- Create storage policy for users to update their business assets
CREATE POLICY "Users can update their business assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'business-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text 
    FROM businesses b 
    WHERE b.owner_id = auth.uid()
  )
);

-- Create storage policy for users to delete their business assets
CREATE POLICY "Users can delete their business assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'business-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT b.id::text 
    FROM businesses b 
    WHERE b.owner_id = auth.uid()
  )
);