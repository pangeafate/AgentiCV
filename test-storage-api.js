import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const SUPABASE_URL = 'https://vhzqyeqyxghrpsgedzxn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoenF5ZXF5eGdocnBzZ2VkenhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY5MDgsImV4cCI6MjA3MTk3MjkwOH0.VoTeZayogG2605DUVyS3rRhnL88N_dpD96oQkWdmaho';

async function testStorageAPI() {
  console.log('🧪 Testing Supabase Storage API Endpoints\n');
  console.log('=' .repeat(50));

  // Test 1: List all files in bucket
  console.log('\n📋 Test 1: List all files in cv-uploads bucket');
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/cv-uploads`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (response.ok) {
      const files = await response.json();
      console.log(`✅ Success! Found ${files.length} file(s):`);
      
      if (files.length > 0) {
        files.slice(0, 3).forEach(file => {
          console.log(`   - ${file.name}`);
          console.log(`     Size: ${file.metadata?.size || 'unknown'} bytes`);
          console.log(`     Created: ${file.created_at}`);
        });
        
        // Save the latest file for next test
        const latestFile = files[0];
        console.log(`\n📌 Latest file: ${latestFile.name}`);
        
        // Test 2: Get direct file URL
        console.log('\n🔗 Test 2: Get public URL for latest file');
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/cv-uploads/${latestFile.name}`;
        console.log(`✅ Public URL: ${publicUrl}`);
        
        // Test 3: Download file content
        console.log('\n📥 Test 3: Download file content');
        const downloadResponse = await fetch(publicUrl);
        if (downloadResponse.ok) {
          const contentType = downloadResponse.headers.get('content-type');
          const contentLength = downloadResponse.headers.get('content-length');
          console.log(`✅ File accessible!`);
          console.log(`   Type: ${contentType}`);
          console.log(`   Size: ${contentLength} bytes`);
          
          // For text files, show preview
          if (contentType?.includes('text')) {
            const text = await downloadResponse.text();
            console.log(`   Preview: ${text.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ Could not download file: ${downloadResponse.status}`);
        }
      }
    } else {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      const error = await response.text();
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: Get latest file with sorting
  console.log('\n🔄 Test 4: Get latest uploaded file (with sorting)');
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/list/cv-uploads?limit=1&sortBy=created_at&order=desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (response.ok) {
      const files = await response.json();
      if (files.length > 0) {
        const latest = files[0];
        console.log(`✅ Latest file: ${latest.name}`);
        console.log(`   Uploaded: ${latest.created_at}`);
      }
    } else {
      console.log(`❌ Failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n✨ API Configuration for Flowise:\n');
  console.log('List Files Endpoint:');
  console.log(`   URL: ${SUPABASE_URL}/storage/v1/object/list/cv-uploads`);
  console.log('   Method: GET');
  console.log('   Headers:');
  console.log(`     apikey: ${SUPABASE_KEY}`);
  console.log(`     Authorization: Bearer ${SUPABASE_KEY}`);
  console.log('\nDownload File URL Pattern:');
  console.log(`   ${SUPABASE_URL}/storage/v1/object/public/cv-uploads/{filename}`);
  console.log('   Method: GET');
  console.log('   Headers: None needed (public bucket)');
}

testStorageAPI();