/**
 * Consolidated Test Infrastructure Exports
 * Following GL-TESTING-GUIDELINES.md
 * 
 * This module provides a single import point for all test utilities,
 * achieving the goal of 50% boilerplate reduction by centralizing
 * commonly used test setup patterns and mock factories.
 * 
 * Usage:
 * import { setupTest, createMockCV, SupabaseMockFactory } from '@/test';
 */

// Core test setup and patterns
export { 
  setupTest, 
  TestPatterns 
} from './utils/testSetup';

// Mock data factories
export {
  createMockCV,
  createMockJobDescription,
  createMockAnalysis,
  createMockFile,
  createMockUser,
  createMockApiResponse,
  createMockProgressEvent,
  createMockFormData,
  TestDataFactory
} from './utils/mockData';

// All mock services and utilities
export * from './mocks';

// Test fixtures with utilities
export * as fixtures from './fixtures';
export { FixtureUtils } from './fixtures';

// Re-export testing library utilities for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Convenience wrapper that sets up a complete test environment
 * Combines setupTest, mocks, and fixtures for maximum boilerplate reduction
 * 
 * @param {Object} config - Test configuration
 * @returns {Object} Complete test environment
 */
export function createTestEnvironment(config = {}) {
  const {
    useMocks = true,
    useFixtures = true,
    testSetupOptions = {},
    mockConfig = {}
  } = config;

  const testUtils = setupTest(testSetupOptions);
  const environment = { ...testUtils };

  if (useMocks) {
    // Import all mocks dynamically to avoid circular dependencies
    const { setupMocks } = require('./mocks');
    environment.mocks = setupMocks(mockConfig);
  }

  if (useFixtures) {
    const { fixtures, FixtureUtils } = require('./fixtures');
    environment.fixtures = fixtures;
    environment.fixtureUtils = FixtureUtils;
  }

  // Add convenience methods for common test patterns
  environment.createScenario = TestDataFactory.createCompleteScenario;
  environment.createUploadScenario = TestDataFactory.createUploadScenario;
  environment.createErrorScenario = TestDataFactory.createErrorScenario;

  return environment;
}

/**
 * Quick setup for component testing with sensible defaults
 * Further reduces boilerplate for the most common test case
 * 
 * @param {React.Component} Component - Component to test
 * @param {Object} props - Component props
 * @param {Object} options - Test options
 */
export function quickTestSetup(Component, props = {}, options = {}) {
  return TestPatterns.testComponentRender(Component, props, {
    testSetup: { 
      useFakeTimers: true,
      mockConsole: true,
      mockStorage: true,
      mockFetch: true,
      ...options.testSetup 
    },
    wrapper: { 
      router: true,
      theme: false,
      queryClient: false,
      ...options.wrapper 
    }
  });
}