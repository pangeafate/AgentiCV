-- Run this in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/vhzqyeqyxghrpsgedzxn/sql/new

-- First, check if the bucket exists
SELECT * FROM storage.buckets WHERE name = 'cv-uploads';

-- Make the bucket public if it isn't already
UPDATE storage.buckets 
SET public = true 
WHERE name = 'cv-uploads';

-- Drop existing policies if any (to start fresh)
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public viewing" ON storage.objects;
DROP POLICY IF EXISTS "Allow public downloads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new policies for public access
-- Policy 1: Allow anyone to upload files
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT 
TO public 
WITH CHECK (bucket_id = 'cv-uploads');

-- Policy 2: Allow anyone to view/download files
CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT 
TO public 
USING (bucket_id = 'cv-uploads');

-- Policy 3: Allow file updates (optional)
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE 
TO public 
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');

-- Policy 4: Allow file deletion (optional)
CREATE POLICY "Allow public deletions" ON storage.objects
FOR DELETE 
TO public 
USING (bucket_id = 'cv-uploads');

-- Verify the policies were created
SELECT * FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%public%';

-- Test message
SELECT 'Permissions fixed! Try uploading again.' as message;