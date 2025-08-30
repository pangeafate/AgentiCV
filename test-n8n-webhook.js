#!/usr/bin/env node

// Test n8n webhook with a sample CV URL
const testN8nWebhook = async () => {
  const webhookUrl = 'https://n8n.lakestrom.com/webhook/533919be-b5e1-4ab6-9899-9cce246fcab1';
  
  // Test payload matching what the frontend sends
  const payload = {
    filename: "test-cv-1756460986521.txt",
    publicUrl: "https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test-cv-1756460986521.txt",
    fileType: "text/plain",
    fileSize: 123,
    bucket: "cv-uploads",
    uploadedAt: new Date().toISOString()
  };

  console.log('🔄 Testing n8n webhook...');
  console.log('URL:', webhookUrl);
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log('\n📊 Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Response:');
      console.log(JSON.stringify(result, null, 2));
      
      if (result.parsedData) {
        console.log('\n📄 Parsed CV Data:');
        console.log(JSON.stringify(result.parsedData, null, 2));
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Error Response:', errorText);
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
};

// Run the test
console.log('='.repeat(60));
console.log('n8n Webhook Test');
console.log('='.repeat(60));

testN8nWebhook().then(() => {
  console.log('\n✅ Test complete');
}).catch(error => {
  console.error('\n❌ Test failed:', error);
});