#!/bin/bash

# Test Flowise PDF extraction
echo "Testing Flowise PDF parsing..."

curl -X POST https://flowise.lakestrom.com/api/v1/prediction/a1885d0f-9a79-4232-8e23-99174987a22e \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SQ3K5w6IA7Ne_pnm5Sm089lglmVK71yrTrYtIsECNRI" \
  -d '{
    "question": "Extract CV information from this PDF",
    "input": "https://vhzqyeqyxghrpsgedzxn.supabase.co/storage/v1/object/public/cv-documents/[YOUR_UPLOADED_FILE_NAME]"
  }' | jq '.'

echo "Test complete!"