// Environment configuration that works in both Vite and Jest
const getEnvVar = (key, defaultValue = '') => {
  // In Vite environment (browser/build)
  try {
    if (import.meta && import.meta.env) {
      return import.meta.env[key] || defaultValue;
    }
  } catch (e) {
    // Fallback for environments where import.meta is not available
  }
  
  // In Jest/Node environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
};

export const env = {
  VITE_SUPABASE_URL: getEnvVar('VITE_SUPABASE_URL', 'https://test.supabase.co'),
  VITE_SUPABASE_ANON_KEY: getEnvVar('VITE_SUPABASE_ANON_KEY', 'test-key'),
  VITE_N8N_COMPLETE_ANALYSIS_URL: getEnvVar('VITE_N8N_COMPLETE_ANALYSIS_URL', 'https://n8n.test.com/webhook/analyze'),
  PROD: getEnvVar('PROD', false),
  DEV: getEnvVar('DEV', true)
};

export const isProduction = () => env.PROD || (typeof window !== 'undefined' && window.location.hostname !== 'localhost');