/**
 * Mock import.meta for Jest environment
 * Following GL-TESTING-GUIDELINES.md shared infrastructure pattern
 */

// Set up process.env for Jest
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
process.env.VITE_N8N_COMPLETE_ANALYSIS_URL = 'https://n8n.test.com/webhook/analyze';
process.env.PROD = 'false';
process.env.DEV = 'true';

// Mock import.meta globally for Jest
const mockImportMeta = {
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key',
    VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze',
    PROD: false,
    DEV: true
  }
};

// Define import.meta on global scope
Object.defineProperty(globalThis, 'import', {
  value: { meta: mockImportMeta },
  writable: true,
  configurable: true
});

// Also define on global for direct access
global.import = { meta: mockImportMeta };

// Window compatibility for jsdom
if (typeof window !== 'undefined') {
  window.import = { meta: mockImportMeta };
}