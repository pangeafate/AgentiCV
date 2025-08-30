import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCompleteFlow() {
  console.log('🚀 Testing Complete Upload → Flowise Flow');
  console.log('=' .repeat(60));
  
  // Step 1: Upload a test CV to Supabase
  console.log('\n1️⃣ Uploading test CV to Supabase...');
  
  const testCV = `John Doe
Software Engineer
john.doe@email.com
+1-234-567-8900

SKILLS:
- JavaScript, React, Node.js
- Python, Django, Flask
- AWS, Docker, Kubernetes

EXPERIENCE:
Senior Developer at Tech Corp (2020-2024)
- Led team of 5 developers
- Implemented microservices architecture
- Reduced deployment time by 70%

EDUCATION:
BS Computer Science - MIT (2016-2020)`;

  const fileName = `test-cv-${Date.now()}.txt`;
  const file = new Blob([testCV], { type: 'text/plain' });
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('cv-uploads')
    .upload(fileName, file);
  
  if (uploadError) {
    console.error('❌ Upload failed:', uploadError);
    return;
  }
  
  console.log('✅ Uploaded:', fileName);
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('cv-uploads')
    .getPublicUrl(fileName);
  
  const publicUrl = urlData.publicUrl;
  console.log('📎 Public URL:', publicUrl);
  
  // Step 2: Test if file is accessible
  console.log('\n2️⃣ Verifying file is accessible...');
  const checkResponse = await fetch(publicUrl);
  if (checkResponse.ok) {
    console.log('✅ File is publicly accessible');
  } else {
    console.log('❌ File not accessible');
    return;
  }
  
  // Step 3: Trigger Flowise
  console.log('\n3️⃣ Triggering Flowise webhook...');
  
  const payload = {
    question: "Parse this CV and extract: name, email, skills, experience, and education",
    overrideConfig: {
      filename: fileName,
      publicUrl: publicUrl,
      fileType: "text/plain",
      fileSize: file.size,
      uploadedAt: new Date().toISOString()
    }
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const flowiseResponse = await fetch(process.env.VITE_FLOWISE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_FLOWISE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('\n📊 Flowise Response:');
    console.log('Status:', flowiseResponse.status, flowiseResponse.statusText);
    
    const contentType = flowiseResponse.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      const result = await flowiseResponse.json();
      console.log('✅ JSON Response:', JSON.stringify(result, null, 2));
    } else {
      const text = await flowiseResponse.text();
      if (text.includes('<!DOCTYPE')) {
        console.log('⚠️ Received HTML - Agentflow not configured properly');
        console.log('\nTo fix:');
        console.log('1. Open: https://flowise.lakestrom.com/v2/agentcanvas/4f8194ac-001f-4b1c-aa2f-114f00bbfad6');
        console.log('2. Ensure all nodes are connected');
        console.log('3. Save the agentflow');
        console.log('4. Test again');
      } else {
        console.log('Response:', text.substring(0, 500));
      }
    }
  } catch (error) {
    console.error('❌ Flowise request failed:', error.message);
  }
  
  // Step 4: Cleanup
  console.log('\n4️⃣ Cleaning up...');
  await supabase.storage.from('cv-uploads').remove([fileName]);
  console.log('✅ Test file removed');
  
  console.log('\n' + '=' .repeat(60));
  console.log('Test complete!');
}

// Also test uploading through the frontend
async function testFrontendUpload() {
  console.log('\n\n📱 To test from the frontend:');
  console.log('1. Open http://localhost:5173');
  console.log('2. Upload any PDF or text file');
  console.log('3. Check browser console for webhook trigger');
  console.log('4. Check Flowise logs for incoming requests');
}

testCompleteFlow().then(() => {
  testFrontendUpload();
});