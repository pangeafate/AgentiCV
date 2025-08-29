# Create Storage Bucket in Supabase

Since we need to create the bucket, please follow these steps:

## Option 1: Via Supabase Dashboard (Easiest)

1. Open your Supabase project: https://supabase.com/dashboard/project/vhzqyeqyxghrpsgedzxn
2. Click on **Storage** in the left sidebar
3. Click **New bucket** button
4. Configure:
   - Bucket name: `cv-uploads`
   - Toggle **ON** "Public bucket" 
   - Click **Create**

## Option 2: Via SQL Editor in Supabase

1. Go to SQL Editor in your Supabase dashboard
2. Run this SQL:

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('cv-uploads', 'cv-uploads', true);

-- Create public access policy for uploads
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'cv-uploads');

-- Create public access policy for viewing
CREATE POLICY "Allow public viewing" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'cv-uploads');
```

## Option 3: Using Supabase CLI (if installed)

```bash
supabase storage create cv-uploads --public
```

## After Creating the Bucket

Once the bucket is created, the app will automatically work!
- Open http://localhost:3001
- Try uploading a PDF
- Check Storage in Supabase dashboard to see your uploads

The application is already configured and waiting for the bucket.