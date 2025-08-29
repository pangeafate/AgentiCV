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

async function checkBuckets() {
  console.log('🔍 Checking Supabase buckets...\n')
  console.log('Project:', supabaseUrl)
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('❌ Error:', error.message)
      return
    }
    
    console.log(`\n📦 Found ${buckets?.length || 0} bucket(s):\n`)
    
    if (buckets && buckets.length > 0) {
      buckets.forEach(bucket => {
        console.log(`  • ${bucket.name}`)
        console.log(`    ID: ${bucket.id}`)
        console.log(`    Public: ${bucket.public}`)
        console.log(`    Created: ${bucket.created_at}`)
        console.log('')
      })
      
      // Check if any bucket matches what we need
      const hasCorrectBucket = buckets.some(b => 
        b.name === 'cv-uploads' || 
        b.id === 'cv-uploads' ||
        b.name === 'cv_uploads' ||
        b.id === 'cv_uploads'
      )
      
      if (hasCorrectBucket) {
        console.log('✅ Found a bucket that might work!')
        console.log('📝 Trying to upload to different bucket names...\n')
        
        // Try different bucket names
        const testFile = new Blob(['Test content'], { type: 'text/plain' })
        const possibleNames = ['cv-uploads', 'cv_uploads']
        
        for (const bucketName of possibleNames) {
          try {
            console.log(`Testing bucket: "${bucketName}"...`)
            const { data, error } = await supabase.storage
              .from(bucketName)
              .upload(`test-${Date.now()}.txt`, testFile)
            
            if (!error) {
              console.log(`✅ SUCCESS! Use bucket name: "${bucketName}"`)
              console.log(`📝 Update STORAGE_CONFIG.bucketName to: '${bucketName}' in config.js`)
              
              // Clean up test file
              if (data?.path) {
                await supabase.storage.from(bucketName).remove([data.path])
              }
              break
            } else {
              console.log(`❌ ${bucketName}: ${error.message}`)
            }
          } catch (e) {
            console.log(`❌ ${bucketName}: ${e.message}`)
          }
        }
      }
    } else {
      console.log('No buckets found. Please create one in Supabase dashboard.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkBuckets()