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

const supabase = createClient(supabaseUrl, supabaseKey)

async function directUploadTest() {
  console.log('🚀 Direct Upload Test\n')
  console.log('Project:', supabaseUrl)
  console.log('Attempting to upload directly to "cv-uploads" bucket...\n')
  
  // Create a test file
  const testContent = `Test CV Upload at ${new Date().toISOString()}`
  const testFile = new Blob([testContent], { type: 'text/plain' })
  const fileName = `test-cv-${Date.now()}.txt`
  
  try {
    console.log(`📤 Uploading: ${fileName}`)
    
    // Try to upload directly to cv-uploads bucket
    const { data, error } = await supabase.storage
      .from('cv-uploads')
      .upload(fileName, testFile, {
        contentType: 'text/plain',
        upsert: false
      })
    
    if (error) {
      console.error('❌ Upload failed:', error.message)
      
      // Try alternative bucket names
      console.log('\n🔄 Trying alternative bucket names...')
      const alternatives = ['cv_uploads', 'cvuploads', 'cv-documents', 'documents']
      
      for (const bucketName of alternatives) {
        console.log(`  Trying "${bucketName}"...`)
        const { data: altData, error: altError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, testFile)
        
        if (!altError) {
          console.log(`  ✅ SUCCESS with bucket: "${bucketName}"`)
          console.log(`  📝 Update your config to use: "${bucketName}"`)
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName)
          console.log(`  🔗 Public URL: ${urlData.publicUrl}`)
          
          return
        } else {
          console.log(`  ❌ ${altError.message}`)
        }
      }
      
      console.log('\n📝 Please ensure the bucket is created with the exact name "cv-uploads"')
      return
    }
    
    console.log('✅ Upload successful!')
    console.log('📁 Path:', data.path)
    console.log('📊 ID:', data.id)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(fileName)
    
    console.log('🔗 Public URL:', urlData.publicUrl)
    
    // Try to list files in the bucket
    console.log('\n📋 Listing files in bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('cv-uploads')
      .list()
    
    if (!listError && files) {
      console.log(`Found ${files.length} file(s):`)
      files.forEach(file => {
        console.log(`  • ${file.name}`)
      })
    }
    
    console.log('\n✨ Your Supabase storage is working perfectly!')
    console.log('🎯 You can now upload CVs from the app at http://localhost:3001')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

directUploadTest()