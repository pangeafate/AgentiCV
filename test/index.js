/**
 * Consolidated Test Infrastructure Exports
 * Following GL-TESTING-GUIDELINES.md
 */

// Core test setup
export { setupTest } from './utils/testSetup';

// Mock data factories
export {
  createMockCV,
  createMockJobDescription,
  createMockAnalysis,
  createMockFile
} from './utils/mockData';

// Service mocks
export { SupabaseMockFactory, createClient } from './mocks/supabase';
export { N8NMockFactory } from './mocks/n8n';

// Test fixtures
export * as fixtures from './fixtures';

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';