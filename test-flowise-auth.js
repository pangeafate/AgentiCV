import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const FLOWISE_ENDPOINT = 'https://flowise.lakestrom.com/api/v1/agentflows/4f8194ac-001f-4b1c-aa2f-114f00bbfad6';
const TEST_FILE_URL = 'https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test-cv-1756460986521.txt';

async function testWithoutAuth() {
  console.log('\n🔓 Testing WITHOUT authentication...');
  
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
  
  try {
    const response = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    const result = await response.text();
    console.log('Response:', result);
    return response.ok;
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

async function testWithApiKey(apiKey) {
  console.log('\n🔐 Testing WITH API key authentication...');
  
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
  
  try {
    const response = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    const result = await response.text();
    console.log('Response:', result);
    return response.ok;
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

async function testSimplifiedPayload() {
  console.log('\n📝 Testing with SIMPLIFIED payload (just question)...');
  
  const payload = {
    question: `Please analyze this CV file: ${TEST_FILE_URL}`
  };
  
  try {
    const response = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response Status:', response.status, response.statusText);
    const result = await response.text();
    console.log('Response:', result);
    return response.ok;
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Flowise Authentication Testing');
  console.log('=' .repeat(60));
  console.log('Endpoint:', FLOWISE_ENDPOINT);
  console.log('Test File:', TEST_FILE_URL);
  
  // Test 1: Without auth
  const test1 = await testWithoutAuth();
  
  // Test 2: With simplified payload
  const test2 = await testSimplifiedPayload();
  
  // Test 3: With API key if provided
  const apiKey = process.env.VITE_FLOWISE_API_KEY;
  if (apiKey) {
    const test3 = await testWithApiKey(apiKey);
  } else {
    console.log('\n⚠️ No API key found in VITE_FLOWISE_API_KEY');
    console.log('   If your Flowise requires authentication:');
    console.log('   1. Go to Flowise dashboard → API Keys');
    console.log('   2. Copy or create an API key');
    console.log('   3. Add to .env.local: VITE_FLOWISE_API_KEY=your-key-here');
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📋 Next Steps:');
  
  if (!test1 && !test2) {
    console.log('\n❌ Authentication Required');
    console.log('Your Flowise instance requires authentication.');
    console.log('\nTo fix:');
    console.log('1. Log into Flowise: https://flowise.lakestrom.com');
    console.log('2. Navigate to API Keys section');
    console.log('3. Create or copy an API key');
    console.log('4. Add to .env.local:');
    console.log('   VITE_FLOWISE_API_KEY=your-api-key-here');
    console.log('\nOR');
    console.log('\n1. Open your agentflow canvas');
    console.log('2. Check if the agentflow is saved and published');
    console.log('3. Look for API settings or public access toggle');
  } else {
    console.log('\n✅ API is accessible!');
    console.log('Your agentflow can receive webhooks.');
    console.log('\nNow configure your agentflow:');
    console.log('1. Open canvas: https://flowise.lakestrom.com/v2/agentcanvas/4f8194ac-001f-4b1c-aa2f-114f00bbfad6');
    console.log('2. Add Start node to receive webhook data');
    console.log('3. Add HTTP Request node to fetch from publicUrl');
    console.log('4. Add Document Loader for file processing');
    console.log('5. Add LLM node for CV parsing');
    console.log('6. Save and test the flow');
  }
}

runTests();