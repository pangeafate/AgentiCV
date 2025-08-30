import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const FLOWISE_ENDPOINT = process.env.VITE_FLOWISE_WEBHOOK_URL;
const FLOWISE_API_KEY = process.env.VITE_FLOWISE_API_KEY;
const TEST_FILE_URL = 'https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test-cv-1756460986521.txt';

async function testFlowiseFlow() {
  console.log('🧪 Testing Complete Flowise Flow');
  console.log('=' .repeat(60));
  
  if (!FLOWISE_ENDPOINT || !FLOWISE_API_KEY) {
    console.error('❌ Missing configuration:');
    if (!FLOWISE_ENDPOINT) console.error('   - VITE_FLOWISE_WEBHOOK_URL not set');
    if (!FLOWISE_API_KEY) console.error('   - VITE_FLOWISE_API_KEY not set');
    return;
  }
  
  console.log('📍 Configuration:');
  console.log('   Endpoint:', FLOWISE_ENDPOINT);
  console.log('   API Key:', FLOWISE_API_KEY.substring(0, 10) + '...');
  console.log('   Test File:', TEST_FILE_URL);
  
  // Test 1: Simple question format
  console.log('\n\n1️⃣ TEST 1: Simple Question Format');
  console.log('-'.repeat(40));
  
  const simplePayload = {
    question: `Please analyze this CV file: ${TEST_FILE_URL}`
  };
  
  console.log('Payload:', JSON.stringify(simplePayload, null, 2));
  
  try {
    const response1 = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify(simplePayload)
    });
    
    console.log('Response Status:', response1.status, response1.statusText);
    if (response1.ok) {
      const result = await response1.json();
      console.log('✅ Success! Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response1.text();
      console.log('❌ Error:', error.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Test 2: With overrideConfig (as frontend sends)
  console.log('\n\n2️⃣ TEST 2: With Override Config (Frontend Format)');
  console.log('-'.repeat(40));
  
  const frontendPayload = {
    question: "Parse this CV and extract key information",
    overrideConfig: {
      filename: "test-cv-1756460986521.txt",
      publicUrl: TEST_FILE_URL,
      fileType: "text/plain",
      fileSize: 253,
      uploadedAt: new Date().toISOString()
    }
  };
  
  console.log('Payload:', JSON.stringify(frontendPayload, null, 2));
  
  try {
    const response2 = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify(frontendPayload)
    });
    
    console.log('Response Status:', response2.status, response2.statusText);
    if (response2.ok) {
      const result = await response2.json();
      console.log('✅ Success! Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response2.text();
      console.log('❌ Error:', error.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  // Test 3: Direct variables format
  console.log('\n\n3️⃣ TEST 3: Direct Variables Format');
  console.log('-'.repeat(40));
  
  const variablesPayload = {
    question: "Parse CV",
    publicUrl: TEST_FILE_URL,
    filename: "test-cv-1756460986521.txt",
    fileType: "text/plain"
  };
  
  console.log('Payload:', JSON.stringify(variablesPayload, null, 2));
  
  try {
    const response3 = await fetch(FLOWISE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify(variablesPayload)
    });
    
    console.log('Response Status:', response3.status, response3.statusText);
    if (response3.ok) {
      const result = await response3.json();
      console.log('✅ Success! Response:', JSON.stringify(result, null, 2));
    } else {
      const error = await response3.text();
      console.log('❌ Error:', error.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('\n📋 Debugging Tips:');
  console.log('\n1. If you get HTML response:');
  console.log('   - Make sure your agentflow is SAVED');
  console.log('   - Check that all nodes are connected');
  console.log('   - Verify the Start node has Chat Input type');
  console.log('\n2. If you get "Cannot find agentflow":');
  console.log('   - The agentflow ID might be wrong');
  console.log('   - The agentflow might not be saved');
  console.log('\n3. If you get authentication errors:');
  console.log('   - Verify the API key is correct');
  console.log('   - Check if the key has proper permissions');
  console.log('\n4. In your Flowise canvas:');
  console.log('   - Start node: Chat Input with Flow State variables');
  console.log('   - HTTP Request: URL = {{publicUrl}} or extract from question');
  console.log('   - Document Loader: Connected to HTTP output');
  console.log('   - LLM: Parse the document content');
}

testFlowiseFlow();