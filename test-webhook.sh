#!/bin/bash

echo "Testing n8n Webhook"
echo "==================="
echo ""
echo "Production URL: https://n8n.lakestrom.com/webhook/533919be-b5e1-4ab6-9899-9cce246fcab1"
echo ""

curl -X POST https://n8n.lakestrom.com/webhook/533919be-b5e1-4ab6-9899-9cce246fcab1 \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test-cv.pdf",
    "publicUrl": "https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-uploads/test-cv-1756460986521.txt",
    "fileType": "application/pdf",
    "fileSize": 123456,
    "bucket": "cv-uploads",
    "uploadedAt": "2025-08-29T15:00:00.000Z"
  }' \
  -v

echo ""
echo "Test complete!"