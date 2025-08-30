/**
 * Shared Test Setup and Utilities
 * Following GL-TESTING-GUIDELINES.md
 */

import '@testing-library/jest-dom';

// Mock Supabase config to avoid import.meta issues
jest.mock('../../src/services/supabase/config');

// Mock import.meta.env globally for all tests
const mockEnv = {
  PROD: false,
  DEV: true,
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze'
};

// Create the mock for import.meta.env
global.import = {
  meta: {
    env: mockEnv
  }
};

// Also set on globalThis for better compatibility
globalThis.import = {
  meta: {
    env: mockEnv
  }
};

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

/**
 * Setup test environment with shared utilities
 * @returns {Object} Test utilities
 */
export function setupTest() {
  // Set up fake timers
  jest.useFakeTimers();

  // Clean up function
  const cleanup = () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
  };

  // Get wrapper for React components
  const getWrapper = () => ({ children }) => children;

  // Get query client for React Query tests
  const getQueryClient = () => null; // Will implement when React Query is added

  return {
    cleanup,
    getWrapper,
    getQueryClient,
  };
}

// Re-export common testing utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';