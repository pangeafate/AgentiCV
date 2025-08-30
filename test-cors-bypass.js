import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

console.log('🔧 CORS Bypass Test for Flowise');
console.log('=' .repeat(60));

console.log('\n⚠️ CORS Issue Detected!');
console.log('The browser is blocking requests to Flowise due to CORS policy.');

console.log('\n📋 Solutions:');
console.log('\n1️⃣ OPTION 1: Use Flowise Embed (Recommended)');
console.log('   Instead of API calls, use the Flowise chat embed:');
console.log('   - Go to your agentflow');
console.log('   - Click "Share" or "Embed" button');
console.log('   - Get the embed code');

console.log('\n2️⃣ OPTION 2: Use a Backend Proxy');
console.log('   Create an API endpoint in your backend that forwards requests to Flowise');

console.log('\n3️⃣ OPTION 3: Configure Flowise CORS');
console.log('   If you control the Flowise instance, add CORS headers:');
console.log('   - Access-Control-Allow-Origin: http://localhost:5173');
console.log('   - Access-Control-Allow-Headers: Authorization, Content-Type');

console.log('\n4️⃣ OPTION 4: Use Node.js Scripts (Current Workaround)');
console.log('   Run the test scripts from Node.js instead of browser:');
console.log('   node test-upload-and-trigger.js');

console.log('\n' + '=' .repeat(60));

// Test if the API works from Node.js (no CORS)
async function testFromNode() {
  console.log('\n🧪 Testing from Node.js (No CORS)...');
  
  const testUrl = 'https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/2025-08-29T11-22-30-151Z_25%2006%2009%20CV%20SERGEY%20PODOLSKIY%20EN%20(2)_3ulee4.pdf';
  
  const payload = {
    question: `Parse this CV: ${testUrl}`,
    overrideConfig: {
      publicUrl: testUrl,
      filename: "CV_SERGEY_PODOLSKIY.pdf",
      fileType: "application/pdf"
    }
  };
  
  try {
    const response = await fetch(process.env.VITE_FLOWISE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_FLOWISE_API_KEY}`,
        'Origin': 'http://localhost:5173'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        console.log('✅ Success from Node.js!');
        console.log('Response:', JSON.stringify(result, null, 2));
      } else {
        console.log('⚠️ Agentflow not configured - returned HTML');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFromNode();

console.log('\n💡 Quick Solution:');
console.log('Since CORS blocks browser requests, you can:');
console.log('1. Upload files through the frontend (works)');
console.log('2. Test Flowise integration using Node.js scripts (works)');
console.log('3. Configure your Flowise to accept the webhook data');