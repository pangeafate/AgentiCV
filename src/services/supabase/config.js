import { createClient } from '@supabase/supabase-js';

// Placeholder Supabase configuration
// Update these values with your actual Supabase project credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket name for CV files
export const CV_BUCKET_NAME = 'cv-uploads';

// Configuration for file uploads
export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  allowedExtensions: ['.pdf', '.doc', '.docx']
};