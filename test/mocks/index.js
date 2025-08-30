/**
 * Centralized Mock Exports
 * Following GL-TESTING-GUIDELINES.md
 */

// Supabase mocks
export { 
  SupabaseMockFactory, 
  createClient as createSupabaseClient 
} from './supabase.js';

// N8N/Flowise mocks
export { N8NMockFactory } from './n8n.js';

// Component mocks
export {
  RouterMocks,
  FileInputMock,
  ProgressMock,
  ModalMock,
  LoadingSpinnerMock,
  ButtonMock,
  FormMocks,
  ToastMock,
  DropzoneMock,
  ComponentMockFactory
} from './components.js';

// Environment mocks
export { mockEnv } from './importMetaEnv.js';

/**
 * Convenience function to setup common mocks for tests
 * @param {Object} config - Configuration for which mocks to enable
 */
export function setupMocks(config = {}) {
  const {
    supabase = true,
    n8n = true,
    router = true,
    environment = true,
    components = []
  } = config;

  const mocks = {};

  if (supabase) {
    mocks.supabase = SupabaseMockFactory.createSuccessMock();
  }

  if (n8n) {
    mocks.n8n = N8NMockFactory.createGapAnalysisMock();
  }

  if (router) {
    mocks.router = RouterMocks;
    
    // Mock react-router-dom if not already mocked
    jest.doMock('react-router-dom', () => RouterMocks);
  }

  if (environment) {
    // Mock environment variables
    global.import = {
      meta: {
        env: {
          PROD: false,
          DEV: true,
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key',
          VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze'
        }
      }
    };
  }

  // Setup component mocks if specified
  components.forEach(componentName => {
    const mockName = `${componentName}Mock`;
    if (ComponentMockFactory[mockName]) {
      mocks[componentName] = ComponentMockFactory[mockName];
    }
  });

  return mocks;
}

/**
 * Reset all mocks to their initial state
 */
export function resetAllMocks() {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();
}

/**
 * Create a mock fetch function for API testing
 * @param {Object} responses - Map of URL patterns to responses
 */
export function createFetchMock(responses = {}) {
  return jest.fn((url, options = {}) => {
    // Find matching response for the URL
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        const responseData = typeof response === 'function' ? response(url, options) : response;
        
        return Promise.resolve({
          ok: responseData.status < 400,
          status: responseData.status || 200,
          statusText: responseData.statusText || 'OK',
          json: () => Promise.resolve(responseData.data || responseData),
          text: () => Promise.resolve(JSON.stringify(responseData.data || responseData)),
          headers: new Headers(responseData.headers || {}),
          url
        });
      }
    }

    // Default response for unmatched URLs
    return Promise.reject(new Error(`No mock response found for: ${url}`));
  });
}

/**
 * Create a mock WebSocket for real-time testing
 */
export function createWebSocketMock() {
  const mockWebSocket = {
    readyState: 1, // WebSocket.OPEN
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    
    // Utility methods for testing
    triggerOpen: function() {
      this.readyState = 1;
      if (this.onopen) this.onopen();
    },
    triggerMessage: function(data) {
      if (this.onmessage) this.onmessage({ data: JSON.stringify(data) });
    },
    triggerError: function(error) {
      if (this.onerror) this.onerror(error);
    },
    triggerClose: function() {
      this.readyState = 3; // WebSocket.CLOSED
      if (this.onclose) this.onclose();
    }
  };

  global.WebSocket = jest.fn(() => mockWebSocket);
  return mockWebSocket;
}

/**
 * Create a mock for local storage
 */
export function createLocalStorageMock() {
  const store = new Map();
  
  return {
    getItem: jest.fn(key => store.get(key) || null),
    setItem: jest.fn((key, value) => store.set(key, String(value))),
    removeItem: jest.fn(key => store.delete(key)),
    clear: jest.fn(() => store.clear()),
    key: jest.fn(index => Array.from(store.keys())[index] || null),
    get length() { return store.size; },
    
    // Test utilities
    _getStore: () => Object.fromEntries(store),
    _setStore: (data) => {
      store.clear();
      Object.entries(data).forEach(([key, value]) => store.set(key, String(value)));
    }
  };
}

/**
 * Mock intersection observer for scroll and visibility testing
 */
export function createIntersectionObserverMock() {
  const mockIntersectionObserver = jest.fn((callback) => ({
    observe: jest.fn((element) => {
      // Simulate element being visible
      callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1
      }]);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  global.IntersectionObserver = mockIntersectionObserver;
  return mockIntersectionObserver;
}