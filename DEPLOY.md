# 🚀 Quick Deployment Guide

## Deploy to GitHub Pages (pangeafate/AgentiCV)

### Step 1: Push to GitHub

```bash
# If not already added, add the remote
git remote add origin https://github.com/pangeafate/AgentiCV.git

# Push the code
git push -u origin master
```

### Step 2: Enable GitHub Pages

1. Go to: https://github.com/pangeafate/AgentiCV/settings/pages
2. Under "Build and deployment" → Source → Select "GitHub Actions"
3. Wait 2-3 minutes for the first deployment

### Step 3: Access Your Site

Your site will be live at: https://pangeafate.github.io/AgentiCV/

## 🔧 Optional: Add Supabase Credentials

If you have a Supabase project:

1. Go to: https://github.com/pangeafate/AgentiCV/settings/secrets/actions
2. Add these secrets:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

Without these, the app runs in mock mode (shows UI but doesn't actually upload files).

## ✅ What Works Now

- Terminal-themed UI with drag & drop
- File validation and progress tracking
- Mock upload simulation (without Supabase)
- Full responsive design

## 📝 Notes

- The app works without Supabase credentials (mock mode)
- First deployment takes 2-3 minutes
- Subsequent deployments are faster (~1 minute)
- GitHub Actions automatically deploys on every push to master/main