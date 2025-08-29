# CVUploader Component

## Purpose
Terminal-themed CV upload component with drag-and-drop functionality and Supabase integration.

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| onUploadSuccess | function | No | Callback when file uploaded successfully |
| onUploadError | function | No | Callback when upload fails |

## Dependencies
- Internal: CVService from supabase services
- External: react-dropzone, react-hot-toast

## State Management
Uses local state for:
- Upload status (idle, uploading, success, error)
- Upload progress
- Current processing task
- Uploaded file metadata

## Features
- Drag and drop file upload
- File validation (PDF, DOC, DOCX under 10MB)
- Progress indication with terminal-style UI
- Success/error handling with toast notifications
- File deletion capability
- Responsive terminal theme design

## File Upload Flow
1. User drops/selects file
2. File validation occurs
3. Upload to Supabase Storage
4. Progress feedback displayed
5. Success confirmation or error handling
6. File metadata stored for future operations

## Performance
- Lazy validation prevents unnecessary processing
- Progress simulation for better UX
- Automatic cleanup of temporary states
- Optimized file size calculations

## Usage Example
```jsx
import CVUploader from './components/cv/CVUploader/CVUploader';

const handleSuccess = (fileData) => {
  console.log('Upload successful:', fileData);
};

const handleError = (error) => {
  console.error('Upload failed:', error);
};

<CVUploader 
  onUploadSuccess={handleSuccess}
  onUploadError={handleError}
/>
```

## Styling
Uses terminal-themed CSS classes:
- `.terminal-window` - Main container
- `.terminal-header` - Title bar with controls
- `.terminal-content` - Main content area
- `.dropzone` - File drop zone
- Terminal color scheme (black background, green/red/yellow accents)