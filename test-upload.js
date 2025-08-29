import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUpload() {
  console.log('🧪 Testing Supabase Upload...\n')
  
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === 'cv-uploads')
    
    if (!bucketExists) {
      console.log('❌ Bucket "cv-uploads" not found!')
      console.log('📝 Please create it first (see create-bucket.md)')
      return
    }
    
    console.log('✅ Bucket "cv-uploads" exists!')
    
    // Create a test PDF-like file
    const testContent = `%PDF-1.4
Test CV Document
This is a test upload to verify Supabase integration.
Name: John Doe
Skills: JavaScript, React, Node.js
Experience: 5 years`
    
    const testFile = new Blob([testContent], { type: 'application/pdf' })
    const fileName = `test-cv-${Date.now()}.pdf`
    
    console.log(`\n📤 Uploading test file: ${fileName}`)
    
    // Upload file
    const { data, error } = await supabase.storage
      .from('cv-uploads')
      .upload(fileName, testFile, {
        contentType: 'application/pdf',
        upsert: false
      })
    
    if (error) {
      console.error('❌ Upload failed:', error.message)
      return
    }
    
    console.log('✅ Upload successful!')
    console.log('📁 File path:', data.path)
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('cv-uploads')
      .getPublicUrl(fileName)
    
    console.log('🔗 Public URL:', urlData.publicUrl)
    
    // List files in bucket
    const { data: files } = await supabase.storage
      .from('cv-uploads')
      .list()
    
    console.log(`\n📊 Total files in bucket: ${files?.length || 0}`)
    if (files && files.length > 0) {
      console.log('📁 Files:')
      files.slice(-5).forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(1)}KB)`)
      })
    }
    
    console.log('\n✨ Test complete! Your Supabase integration is working!')
    console.log('🎯 Next: Open http://localhost:3001 and try the UI')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testUpload()