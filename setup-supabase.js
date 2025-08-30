import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupSupabase() {
  console.log('🚀 Setting up Supabase for AgentiCV...')
  console.log('📍 Project URL:', supabaseUrl)
  
  try {
    // Test connection
    console.log('\n1️⃣ Testing connection...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Connection failed:', listError.message)
      console.log('\n📝 Please ensure:')
      console.log('   - Your Supabase project is active')
      console.log('   - The API key is correct')
      return
    }
    
    console.log('✅ Connected to Supabase successfully!')
    console.log('📦 Existing buckets:', buckets?.map(b => b.name).join(', ') || 'none')
    
    // Check if cv-uploads bucket exists
    const bucketExists = buckets?.some(b => b.name === 'cv-uploads')
    
    if (bucketExists) {
      console.log('\n✅ Bucket "cv-uploads" already exists!')
    } else {
      console.log('\n2️⃣ Creating storage bucket "cv-uploads"...')
      console.log('⚠️  Note: Bucket creation requires service role key (not anon key)')
      console.log('📝 Please create the bucket manually in Supabase dashboard:')
      console.log('   1. Go to Storage in your Supabase dashboard')
      console.log('   2. Click "New bucket"')
      console.log('   3. Name: cv-uploads')
      console.log('   4. Toggle ON "Public bucket"')
      console.log('   5. Click "Create"')
    }
    
    // Test upload capability
    console.log('\n3️⃣ Testing upload capability...')
    const testFile = new Blob(['Test file content'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('cv-uploads')
      .upload(testFileName, testFile)
    
    if (uploadError) {
      if (uploadError.message.includes('not found')) {
        console.log('❌ Bucket "cv-uploads" not found.')
        console.log('📝 Please create it in Supabase dashboard (see instructions above)')
      } else if (uploadError.message.includes('policies')) {
        console.log('⚠️  Upload failed - likely due to RLS policies')
        console.log('📝 To fix: Make bucket public or add upload policy in Supabase dashboard')
      } else {
        console.log('❌ Upload test failed:', uploadError.message)
      }
    } else {
      console.log('✅ Upload test successful!')
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cv-uploads')
        .getPublicUrl(testFileName)
      
      console.log('🔗 Test file URL:', urlData.publicUrl)
      
      // Clean up test file
      await supabase.storage.from('cv-uploads').remove([testFileName])
      console.log('🧹 Cleaned up test file')
    }
    
    console.log('\n✨ Setup check complete!')
    console.log('📝 Next steps:')
    console.log('   1. Ensure "cv-uploads" bucket exists and is public')
    console.log('   2. Open http://localhost:3001 in your browser')
    console.log('   3. Try uploading a PDF file')
    console.log('   4. Check Supabase Storage dashboard to see uploads')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
  }
}

setupSupabase()