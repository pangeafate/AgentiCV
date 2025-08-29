import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Validate required environment variables
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disable auth for file upload only
  },
  global: {
    headers: {
      'x-my-custom-header': 'agenticv-frontend',
    },
  },
})

// Supabase storage bucket configuration
export const STORAGE_CONFIG = {
  bucketName: 'cv-documents',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx']
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

// Test connection function
export const testConnection = async () => {
  try {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured')
    }
    
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      throw error
    }
    
    return {
      success: true,
      buckets: data?.map(bucket => bucket.name) || [],
      message: 'Connected to Supabase successfully'
    }
  } catch (error) {
    console.error('Supabase connection test failed:', error)
    return {
      success: false,
      error: error.message,
      message: 'Failed to connect to Supabase'
    }
  }
}

export default supabase