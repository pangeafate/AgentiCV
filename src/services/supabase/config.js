import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Check if we're in mock mode
export const isMockMode = !import.meta.env.VITE_SUPABASE_URL || 
                          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                          import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co'

// Validate required environment variables
if (isMockMode) {
  console.log('🔧 Running in MOCK MODE - No real Supabase connection')
  console.log('📝 To connect to Supabase:')
  console.log('   1. Create a project at https://supabase.com')
  console.log('   2. Get your project URL and anon key from Settings → API')
  console.log('   3. Update .env.local with your credentials')
  console.log('   4. Restart the dev server with: npm run dev')
} else {
  console.log('✅ Connected to Supabase:', supabaseUrl)
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
  bucketName: 'cv-uploads', // Must match the bucket name in Supabase
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