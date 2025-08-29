-- Make bucket public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'cv-uploads';

-- Allow public uploads using anon role
CREATE POLICY "Allow public uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  auth.role() = 'anon'
);

-- Allow public viewing
CREATE POLICY "Allow public viewing" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cv-uploads');