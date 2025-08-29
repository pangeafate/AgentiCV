# Supabase Setup Guide for AgentiCV

## 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Fill in:
   - Project name: `agenticv` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to you
4. Click "Create new project" and wait ~2 minutes

## 2. Get Your Credentials

Once project is created:
1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://[YOUR-PROJECT-ID].supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string)

## 3. Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Click "Create bucket"
3. Name it: `cv-uploads`
4. Toggle ON "Public bucket" (for now, to simplify)
5. Click "Create"

## 4. Set Up Storage Policies (Optional for Testing)

For public uploads (no auth):
1. Go to Storage → Policies
2. For `cv-uploads` bucket, create new policy:
   - Name: `Public Upload`
   - Policy: `INSERT`
   - Check: Enable for all users
   - With check: Enable for all users

## 5. Configure Local Environment

Create `.env.local` file in project root:
```bash
VITE_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...[YOUR-ANON-KEY]
```

## 6. Test Connection

```bash
npm run dev
```

Open http://localhost:3001 and try uploading a file.

## 7. Verify Upload in Supabase

1. Go to Storage → cv-uploads in Supabase dashboard
2. You should see uploaded files
3. Click on a file to get its public URL

## Database Schema (For Future)

When ready to add database features:

```sql
-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Add RLS policies
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for testing)
CREATE POLICY "Allow public uploads" ON documents
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public reads (for testing)
CREATE POLICY "Allow public reads" ON documents
  FOR SELECT TO anon
  USING (true);
```

## Troubleshooting

### CORS Issues
- Supabase automatically handles CORS for your project URL
- Make sure you're using the correct project URL

### Upload Fails
- Check bucket is set to public
- Verify your anon key is correct
- Check file size (Supabase free tier: 50MB max per file)

### Can't See Files
- Ensure bucket is public
- Check Storage policies
- Refresh the Supabase dashboard

## Next Steps

Once working locally with Supabase:
1. Add authentication (optional)
2. Implement database for metadata
3. Add Flowise integration for AI processing
4. Deploy to production