import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

// Your Flowise Agentflow endpoint
const FLOWISE_ENDPOINT = 'https://flowise.lakestrom.com/api/v1/agentflows/4f8194ac-001f-4b1c-aa2f-114f00bbfad6';

// Test file that exists in your Supabase storage
const TEST_FILE_URL = 'https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test-cv-1756460986521.txt';

async function testFlowiseWebhook() {
  console.log('🧪 Testing Flowise Webhook Integration\n');
  console.log('=' .repeat(60));
  
  console.log('\n📍 Flowise Instance:');
  console.log('   Canvas: https://flowise.lakestrom.com/v2/agentcanvas/4f8194ac-001f-4b1c-aa2f-114f00bbfad6');
  console.log('   API Endpoint:', FLOWISE_ENDPOINT);
  
  console.log('\n📦 Sending webhook payload...');
  
  const payload = {
    question: "Parse this CV and extract key information",
    overrideConfig: {
      filename: "test-cv-1756460986521.txt",
      publicUrl: TEST_FILE_URL,
      fileType: "text/plain",
      fileSize: 253,
      uploadedAt: new Date().toISOString()
    }
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    console.log('\n🚀 Calling Flowise API...');
    
    const response = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add API key if required:
        // 'Authorization': `Bearer ${process.env.VITE_FLOWISE_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Success! Flowise Response:');
      console.log(JSON.stringify(result, null, 2));
      
      // Check if the response indicates the agentflow processed the data
      if (result.text || result.output || result.data) {
        console.log('\n🎯 CV Processing Result:');
        console.log(result.text || result.output || result.data);
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ Error Response:');
      console.log(errorText);
      
      if (response.status === 404) {
        console.log('\n📝 Troubleshooting:');
        console.log('1. Check if the agentflow ID is correct');
        console.log('2. Ensure the agentflow is saved and published');
        console.log('3. Verify the API endpoint is enabled');
      }
    }
  } catch (error) {
    console.error('\n❌ Request Failed:', error.message);
    console.log('\n📝 Troubleshooting:');
    console.log('1. Check if Flowise is running');
    console.log('2. Verify the URL is correct');
    console.log('3. Check for CORS or network issues');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📋 Next Steps:');
  console.log('1. Open your Flowise canvas');
  console.log('2. Add nodes in this order:');
  console.log('   - Start node (receives webhook data)');
  console.log('   - HTTP Request node (fetches file from publicUrl)');
  console.log('   - Document Loader (processes the file)');
  console.log('   - LLM node (Claude/GPT for parsing)');
  console.log('   - Output node (returns structured data)');
  console.log('3. Save and test the agentflow');
  console.log('4. Update .env.local with:');
  console.log(`   VITE_FLOWISE_WEBHOOK_URL=${FLOWISE_ENDPOINT}`);
}

// Alternative: Test with streaming response
async function testFlowiseStreaming() {
  console.log('\n\n🔄 Testing Streaming Response...');
  
  const payload = {
    question: "Parse CV from: " + TEST_FILE_URL,
    streaming: true
  };
  
  try {
    const response = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      console.log('Streaming response:');
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
      }
    }
  } catch (error) {
    console.error('Streaming failed:', error.message);
  }
}

// Run tests
testFlowiseWebhook().then(() => {
  // Uncomment to test streaming:
  // return testFlowiseStreaming();
});