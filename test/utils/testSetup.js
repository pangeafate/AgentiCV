/**
 * Shared Test Setup and Utilities
 * Following GL-TESTING-GUIDELINES.md
 * 
 * This module provides centralized test setup utilities that reduce boilerplate
 * by providing common patterns, mocks, and helpers for testing React components.
 */

import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
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
 * Reduces test boilerplate by providing common setup patterns
 * @param {Object} options - Configuration options
 * @returns {Object} Test utilities
 */
export function setupTest(options = {}) {
  const {
    useFakeTimers = true,
    mockConsole = true,
    autoCleanup = false,
    mockStorage = true,
    mockFetch = false
  } = options;

  const testUtils = {};

  // Set up fake timers if requested
  if (useFakeTimers) {
    jest.useFakeTimers();
    testUtils.advanceTimers = (time) => jest.advanceTimersByTime(time);
    testUtils.runAllTimers = () => jest.runAllTimers();
  }

  // Mock console methods if requested
  if (mockConsole) {
    const originalConsole = { ...console };
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
    
    testUtils.getConsoleCalls = (method = 'error') => console[method].mock.calls;
    testUtils.restoreConsole = () => {
      Object.assign(console, originalConsole);
    };
  }

  // Mock localStorage and sessionStorage if requested
  if (mockStorage) {
    const mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      get length() { return 0; }
    };
    
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
    
    testUtils.localStorage = mockStorage;
    testUtils.sessionStorage = mockStorage;
  }

  // Mock fetch if requested
  if (mockFetch) {
    global.fetch = jest.fn();
    testUtils.mockFetch = global.fetch;
    
    // Helper to set up fetch responses
    testUtils.setFetchResponse = (data, options = {}) => {
      const { status = 200, headers = {} } = options;
      global.fetch.mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        headers: new Headers(headers)
      });
    };
  }

  // Clean up function
  const cleanup = () => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    if (useFakeTimers) {
      jest.useRealTimers();
    }
    if (mockConsole) {
      testUtils.restoreConsole?.();
    }
  };

  // Return cleanup function instead of setting up hook automatically
  // Tests should call cleanup manually or set up their own afterEach hook

  // Get wrapper for React components with providers
  const getWrapper = (providers = []) => {
    return ({ children }) => {
      return providers.reduceRight(
        (acc, Provider) => React.createElement(Provider, {}, acc),
        children
      );
    };
  };

  // Create a test component wrapper with common providers
  const createTestWrapper = (options = {}) => {
    const { router = false, theme = false, queryClient = false } = options;
    const providers = [];

    if (router) {
      providers.push(({ children }) => 
        React.createElement('div', { 'data-testid': 'router-provider' }, children)
      );
    }

    if (theme) {
      providers.push(({ children }) => 
        React.createElement('div', { 'data-testid': 'theme-provider' }, children)
      );
    }

    if (queryClient) {
      providers.push(({ children }) => 
        React.createElement('div', { 'data-testid': 'query-provider' }, children)
      );
    }

    return getWrapper(providers);
  };

  // Utility for waiting for async operations
  const waitFor = async (callback, options = {}) => {
    const { timeout = 1000, interval = 50 } = options;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await callback();
        if (result) return result;
      } catch (error) {
        // Continue trying
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`waitFor timed out after ${timeout}ms`);
  };

  // Helper for testing async components
  const renderAsync = async (component) => {
    const result = render(component);
    await act(async () => {
      // Wait for any pending promises
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    return result;
  };

  // Helper for simulating user interactions with delay
  const userInteraction = {
    click: async (element, delay = 0) => {
      if (delay > 0 && useFakeTimers) {
        fireEvent.click(element);
        jest.advanceTimersByTime(delay);
      } else {
        await userEvent.click(element);
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      }
    },
    type: async (element, text, delay = 0) => {
      if (delay > 0 && useFakeTimers) {
        await userEvent.type(element, text);
        jest.advanceTimersByTime(delay);
      } else {
        await userEvent.type(element, text);
        if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
      }
    },
    upload: async (input, file) => {
      await userEvent.upload(input, file);
    }
  };

  return {
    cleanup,
    getWrapper,
    createTestWrapper,
    waitFor,
    renderAsync,
    userInteraction,
    ...testUtils
  };
}

/**
 * Convenience function for common test patterns
 * Reduces boilerplate for typical test scenarios
 */
export const TestPatterns = {
  /**
   * Test component rendering with props
   * @param {React.Component} Component - Component to test
   * @param {Object} props - Props to pass
   * @param {Object} options - Render options
   */
  testComponentRender: (Component, props = {}, options = {}) => {
    const utils = setupTest(options.testSetup);
    const Wrapper = utils.createTestWrapper(options.wrapper);
    
    return {
      ...utils,
      render: () => render(
        React.createElement(Wrapper, {}, 
          React.createElement(Component, props)
        )
      )
    };
  },

  /**
   * Test form submission flow
   * @param {React.Component} FormComponent - Form component
   * @param {Object} formData - Data to fill in form
   * @param {Object} expectedSubmit - Expected submission data
   */
  testFormSubmission: async (FormComponent, formData, expectedSubmit) => {
    const onSubmit = jest.fn();
    const { render, userInteraction } = TestPatterns.testComponentRender(
      FormComponent,
      { onSubmit }
    );
    
    const { container } = render();
    
    // Fill form fields
    for (const [field, value] of Object.entries(formData)) {
      const input = container.querySelector(`[name="${field}"]`);
      if (input) {
        await userInteraction.type(input, value);
      }
    }
    
    // Submit form
    const submitButton = container.querySelector('[type="submit"]');
    if (submitButton) {
      await userInteraction.click(submitButton);
    }
    
    expect(onSubmit).toHaveBeenCalledWith(expectedSubmit);
  },

  /**
   * Test file upload component
   * @param {React.Component} UploadComponent - Upload component
   * @param {File} file - File to upload
   * @param {Object} expectedResult - Expected upload result
   */
  testFileUpload: async (UploadComponent, file, expectedResult) => {
    const onUpload = jest.fn();
    const { render, userInteraction, setFetchResponse } = TestPatterns.testComponentRender(
      UploadComponent,
      { onUpload },
      { testSetup: { mockFetch: true } }
    );
    
    setFetchResponse(expectedResult);
    const { container } = render();
    
    const fileInput = container.querySelector('input[type="file"]');
    await userInteraction.upload(fileInput, file);
    
    expect(onUpload).toHaveBeenCalledWith(expectedResult);
  },

  /**
   * Test API integration with loading states
   * @param {React.Component} Component - Component that makes API calls
   * @param {Object} apiResponse - Mock API response
   * @param {Array} expectedStates - Expected component states during API call
   */
  testApiIntegration: async (Component, apiResponse, expectedStates = []) => {
    const { render, setFetchResponse, getByTestId } = TestPatterns.testComponentRender(
      Component,
      {},
      { testSetup: { mockFetch: true } }
    );
    
    setFetchResponse(apiResponse, { delay: 100 });
    const { container } = render();
    
    // Check initial state
    if (expectedStates.includes('loading')) {
      expect(container).toHaveTextContent(/loading/i);
    }
    
    // Wait for API response
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });
    
    // Check final state
    if (expectedStates.includes('success')) {
      expect(container).toHaveTextContent(/success|complete/i);
    }
  }
};

// Re-export common testing utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';