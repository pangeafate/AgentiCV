// Mock import.meta for Jest environment and set up process.env
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_N8N_COMPLETE_ANALYSIS_URL = 'https://n8n.test.com/webhook/analyze';
process.env.PROD = 'false';
process.env.DEV = 'true';

// Mock import.meta for Jest environment (fallback)
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze',
        PROD: false,
        DEV: true
      }
    }
  },
  writable: true
});

// Alternative approach - define on window for browser compatibility
if (typeof window !== 'undefined') {
  window.import = {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
        VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze',
        PROD: false,
        DEV: true
      }
    }
  };
}