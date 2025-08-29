import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const flowiseWebhookUrl = process.env.VITE_FLOWISE_WEBHOOK_URL;

const supabase = createClient(supabaseUrl, supabaseKey);

async function demonstrateCompleteFlow() {
  console.log('🔄 Complete Upload-to-Processing Flow Demo\n');
  console.log('=' .repeat(60));
  
  // Step 1: Simulate file upload
  console.log('\n1️⃣ UPLOAD: Simulating CV upload to Supabase...');
  
  const testContent = `John Doe
Software Engineer
john.doe@email.com
+1-234-567-8900

SKILLS:
- JavaScript, React, Node.js
- Python, Django
- AWS, Docker

EXPERIENCE:
Senior Developer at Tech Corp (2020-2024)
- Led team of 5 developers
- Implemented microservices architecture`;

  const fileName = `cv-demo-${Date.now()}.txt`;
  const filePath = `cv-uploads/${fileName}`;
  const file = new Blob([testContent], { type: 'text/plain' });
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('cv-uploads')
    .upload(fileName, file);
  
  if (uploadError) {
    console.error('❌ Upload failed:', uploadError.message);
    return;
  }
  
  console.log('✅ File uploaded:', fileName);
  
  // Step 2: Get public URL
  const { data: urlData } = supabase.storage
    .from('cv-uploads')
    .getPublicUrl(fileName);
  
  const publicUrl = urlData.publicUrl;
  console.log('🔗 Public URL:', publicUrl);
  
  // Step 3: Prepare webhook payload
  console.log('\n2️⃣ WEBHOOK: Preparing payload for Flowise...');
  
  const webhookPayload = {
    filename: fileName,
    filepath: filePath,
    publicUrl: publicUrl,
    bucket: 'cv-uploads',
    fileType: 'text/plain',
    fileSize: file.size,
    uploadedAt: new Date().toISOString()
  };
  
  console.log('📦 Webhook payload:');
  console.log(JSON.stringify(webhookPayload, null, 2));
  
  // Step 4: Show how Flowise would process
  console.log('\n3️⃣ FLOWISE: How the agent processes the file...');
  console.log('   a) Webhook receives payload');
  console.log('   b) Extracts publicUrl:', webhookPayload.publicUrl);
  console.log('   c) HTTP node fetches file from URL');
  console.log('   d) Document loader processes content');
  console.log('   e) Claude/LLM extracts structured data');
  
  // Step 5: Trigger Flowise webhook (if configured)
  if (flowiseWebhookUrl) {
    console.log('\n4️⃣ TRIGGER: Sending to Flowise webhook...');
    console.log('   URL:', flowiseWebhookUrl);
    
    try {
      const response = await fetch(flowiseWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Flowise response:', result);
      } else {
        console.log('❌ Flowise returned:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('⚠️ Flowise not available:', error.message);
      console.log('   Configure VITE_FLOWISE_WEBHOOK_URL in .env.local');
    }
  } else {
    console.log('\n⚠️ No Flowise webhook configured');
    console.log('   Add VITE_FLOWISE_WEBHOOK_URL to .env.local to enable');
  }
  
  // Step 6: Verify file is accessible
  console.log('\n5️⃣ VERIFY: Checking file is publicly accessible...');
  
  try {
    const downloadResponse = await fetch(publicUrl);
    if (downloadResponse.ok) {
      const content = await downloadResponse.text();
      console.log('✅ File is accessible');
      console.log('   Content preview:', content.substring(0, 50) + '...');
    } else {
      console.log('❌ File not accessible:', downloadResponse.status);
    }
  } catch (error) {
    console.log('❌ Download failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n✨ Complete Flow Summary:');
  console.log('1. Frontend uploads file to Supabase ✅');
  console.log('2. Frontend gets unique filename and URL ✅');
  console.log('3. Frontend sends webhook with file details ✅');
  console.log('4. Flowise receives filename and URL in payload');
  console.log('5. Flowise downloads and processes the specific file');
  console.log('6. Results returned to frontend or stored in database');
  
  console.log('\n📝 The key: Flowise gets the exact file URL in the webhook payload!');
  console.log('   No searching needed - direct access to the specific uploaded file.');
  
  // Cleanup
  console.log('\n🧹 Cleaning up test file...');
  await supabase.storage.from('cv-uploads').remove([fileName]);
  console.log('✅ Test file removed');
}

demonstrateCompleteFlow();