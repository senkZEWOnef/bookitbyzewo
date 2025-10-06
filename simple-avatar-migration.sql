-- Simple Avatar Migration - Base64 approach
-- Run this in your Supabase SQL Editor

-- Add avatar_url column to profiles table (for base64 data)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;