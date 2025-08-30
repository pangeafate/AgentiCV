// Environment configuration
export const env = {
  VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL || 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY || 'test-key',
  VITE_N8N_COMPLETE_ANALYSIS_URL: import.meta.env?.VITE_N8N_COMPLETE_ANALYSIS_URL || 'https://n8n.lakestrom.com/webhook/get_cvjd',
  VITE_USE_PROXY_IN_PROD: import.meta.env?.VITE_USE_PROXY_IN_PROD === 'true',
  VITE_PROXY_SERVER_URL: import.meta.env?.VITE_PROXY_SERVER_URL || 'http://localhost:3002',
  PROD: import.meta.env?.PROD || false,
  DEV: import.meta.env?.DEV || true
};

export const isProduction = () => {
  if (typeof window !== 'undefined') {
    return window.location.hostname !== 'localhost';
  }
  return import.meta.env?.PROD || false;
};

export const shouldUseProxy = () => {
  // Use proxy in development by default
  if (!isProduction()) {
    return true;
  }
  
  // In production, use proxy only if explicitly configured
  return env.VITE_USE_PROXY_IN_PROD;
};