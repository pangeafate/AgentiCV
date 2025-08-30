# Supabase Setup Instructions for AgentiCV

## ✅ Supabase Connection is Configured

Your `.env` file has been updated with the Supabase credentials:
- **Project URL**: https://vhzqyeqyxghrpsgedzxn.supabase.co
- **Anon Key**: Already configured in .env

## ⚠️ Required: Create Storage Bucket

You need to manually create the storage bucket in Supabase Dashboard:

### Step 1: Open Supabase Dashboard
Go to: https://vhzqyeqyxghrpsgedzxn.supabase.co/project/vhzqyeqyxghrpsgedzxn/storage/buckets

### Step 2: Create New Bucket
1. Click **"New bucket"** button
2. Enter the following settings:
   - **Name**: `cv-documents`
   - **Public bucket**: ✅ Enable (toggle ON)
   - **File size limit**: `10` MB
   - **Allowed MIME types**: 
     ```
     application/pdf
     application/msword
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     ```

3. Click **"Save"**

### Step 3: Set Bucket Policies (Optional - for better security)
If the bucket creation fails, you can also run this SQL in the SQL Editor:

1. Go to: https://vhzqyeqyxghrpsgedzxn.supabase.co/project/vhzqyeqyxghrpsgedzxn/sql/new
2. Paste and run:

```sql
-- Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-documents', 'cv-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to files
CREATE POLICY "Public Access" ON storage.objects
FOR ALL USING (bucket_id = 'cv-documents')
WITH CHECK (bucket_id = 'cv-documents');
```

## 🚀 Application Status

The application is running at: **http://localhost:5174/**

Once you create the bucket in Supabase, the application will be fully functional with:
- Real file uploads to Supabase Storage
- Persistent file storage
- Public URLs for uploaded CVs

## Testing the Connection

1. Open http://localhost:5174/
2. Try uploading a PDF file
3. If successful, you'll see "CV uploaded successfully"
4. If there's an error, check:
   - The bucket exists in Supabase
   - The bucket is set to public
   - Your internet connection is working

## Troubleshooting

If you see "Supabase is not connected":
1. Make sure the `.env` file has the correct credentials
2. Restart the development server: `npm run dev`
3. Check browser console for specific errors

If uploads fail:
1. Ensure the `cv-documents` bucket exists
2. Check that the bucket is public
3. Verify file size is under 10MB
4. Ensure file type is PDF, DOC, or DOCX