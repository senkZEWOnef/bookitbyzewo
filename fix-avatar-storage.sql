-- Fix Avatar Storage - Simple approach
-- Run this in your Supabase SQL Editor

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create avatars storage bucket with public access
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Disable RLS on storage.objects for avatars bucket specifically
-- This is a simpler approach for development/demo
CREATE OR REPLACE FUNCTION public.disable_rls_for_avatars()
RETURNS void AS $$
BEGIN
  -- Remove all existing policies for avatars bucket
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
  
  -- Create a permissive policy for the avatars bucket
  CREATE POLICY "Public Access for Avatars" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars');
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT public.disable_rls_for_avatars();

-- Drop the function after use
DROP FUNCTION public.disable_rls_for_avatars();