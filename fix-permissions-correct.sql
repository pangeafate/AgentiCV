-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/vhzqyeqyxghrpsgedzxn/sql/new

-- Make bucket public (if not already)
UPDATE storage.buckets 
SET public = true 
WHERE name = 'cv-uploads';

-- Drop existing policies to start fresh (optional)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;

-- Create policy for public uploads
-- Note: Using anon role which is what your app uses
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  auth.role() = 'anon'
);

-- Create policy for public viewing/downloading
CREATE POLICY "Allow public viewing" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'cv-uploads'
);

-- Alternative: If the above doesn't work, try this simpler version
-- that allows everything for the bucket:

-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- CREATE POLICY "Public Access" 
-- ON storage.objects 
-- FOR ALL 
-- USING (bucket_id = 'cv-uploads')
-- WITH CHECK (bucket_id = 'cv-uploads');

-- Verify policies
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';