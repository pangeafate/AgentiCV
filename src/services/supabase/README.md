# Supabase Services

## Overview
Service layer for Supabase integration, handling file storage and data operations.

## Configuration

### Environment Variables
Create a `.env.local` file in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Storage Bucket Setup
1. Create a storage bucket named `cv-uploads`
2. Set bucket to public for file access
3. Configure RLS policies as needed

## Services

### CVService
Handles CV file upload and management.

**Methods:**
- `uploadCV(file)` - Upload CV file to storage
- `deleteCV(fileName)` - Remove CV file from storage  
- `validateFile(file)` - Validate file type and size
- `formatFileSize(bytes)` - Format bytes to readable string

**File Constraints:**
- Max size: 10MB
- Allowed types: PDF, DOC, DOCX
- Auto-generates unique filenames

## Usage Example

```javascript
import { CVService } from './services/supabase/cv.service.js';

const handleUpload = async (file) => {
  const result = await CVService.uploadCV(file);
  
  if (result.success) {
    console.log('Upload successful:', result.data);
  } else {
    console.error('Upload failed:', result.error);
  }
};
```

## Error Handling
All service methods return a standardized response:

```javascript
{
  success: boolean,
  data?: any,      // Present on success
  error?: string   // Present on failure
}
```