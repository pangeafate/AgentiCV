// Environment configuration
export const env = {
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || 'test-key',
  VITE_N8N_COMPLETE_ANALYSIS_URL: import.meta.env?.VITE_N8N_COMPLETE_ANALYSIS_URL || 'https://n8n.test.com/webhook/analyze',
  PROD: import.meta.env?.PROD || false,
  DEV: import.meta.env?.DEV || true
};

export const isProduction = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname !== 'localhost';
  }
  return import.meta.env?.PROD || false;
};