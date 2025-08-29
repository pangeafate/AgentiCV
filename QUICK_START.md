# 🚀 Quick Start - Local Development with Supabase

## Current Status
✅ Application is running at http://localhost:3001 in **MOCK MODE**
- You can see the UI and test drag & drop
- Files won't actually upload until you connect Supabase

## To Connect Real Supabase (5 minutes)

### 1. Create Free Supabase Account
Go to https://supabase.com → Sign Up (GitHub login works)

### 2. Create New Project
- Project name: `agenticv`
- Database Password: (save this)
- Region: Choose closest
- Click "Create new project"

### 3. Get Your Credentials
After ~2 minutes, go to:
- **Settings** → **API**
- Copy these two values:
  - Project URL: `https://[xxxxx].supabase.co`
  - Anon/Public Key: `eyJ...` (long string)

### 4. Create Storage Bucket
- Go to **Storage** in sidebar
- Click "New bucket"
- Name: `cv-uploads`
- Toggle ON "Public bucket"
- Click "Create"

### 5. Update Your Local Config
Edit `.env.local` file:
```bash
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...[your-anon-key]
```

### 6. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

### 7. Test Upload
- Open http://localhost:3001
- Console should show: "✅ Connected to Supabase"
- Try uploading a PDF
- Check Supabase Storage dashboard to see your file!

## Troubleshooting

### "Bucket not found" error
- Make sure bucket is named exactly `cv-uploads`
- Check it's set as "Public"

### Upload fails silently
- Check console for errors
- Verify your anon key is correct (starts with `eyJ`)
- Make sure URL includes `https://`

### CORS errors
- Supabase handles CORS automatically
- If issues persist, check your project URL is correct

## What's Working Now

In **MOCK MODE** (no Supabase):
- ✅ Terminal UI displays
- ✅ Drag & drop works
- ✅ File validation works
- ✅ Mock upload simulation

With **Supabase Connected**:
- ✅ Real file uploads to cloud
- ✅ Public URLs for uploaded files
- ✅ File storage in Supabase
- ✅ Ready for AI processing integration

## Next Steps

Once Supabase is working:
1. Add Flowise for AI processing
2. Create database tables for metadata
3. Add authentication (optional)
4. Deploy to production

---

**Need help?** Check console logs in browser (F12 → Console)