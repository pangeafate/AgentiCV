/**
 * Supabase Config Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import { setupTest } from '../../test/utils/testSetup';

// Mock @supabase/supabase-js
const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}));

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

describe('Supabase Config', () => {
  let testUtils;
  let originalEnv;

  beforeEach(() => {
    testUtils = setupTest({ mockFetch: false });
    
    // Store original import.meta.env
    originalEnv = global.import?.meta?.env || {};
    
    // Clear all mocks
    jest.clearAllMocks();
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
    
    // Reset modules to get fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    testUtils.cleanup();
    
    // Restore original environment
    if (global.import) {
      global.import.meta.env = originalEnv;
    }
  });

  const mockEnvironment = (envVars = {}) => {
    global.import = {
      meta: {
        env: {
          VITE_SUPABASE_URL: undefined,
          VITE_SUPABASE_ANON_KEY: undefined,
          ...envVars
        }
      }
    };
  };

  describe('Environment Configuration', () => {
    describe('Production mode', () => {
      it('should initialize with valid Supabase credentials', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test-project.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-anon-key-12345'
        });

        const mockClient = {
          storage: { from: jest.fn() },
          auth: { getSession: jest.fn() }
        };
        mockCreateClient.mockReturnValue(mockClient);

        // Import after mocking environment
        const config = require('./config');

        expect(config.isMockMode).toBe(false);
        expect(config.isSupabaseConfigured()).toBe(true);
        expect(mockCreateClient).toHaveBeenCalledWith(
          'https://test-project.supabase.co',
          'test-anon-key-12345',
          expect.objectContaining({
            auth: {
              persistSession: false
            },
            global: {
              headers: {
                'x-my-custom-header': 'agenticv-frontend'
              }
            }
          })
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          '✅ Connected to Supabase:',
          'https://test-project.supabase.co'
        );
      });

      it('should handle different Supabase URL formats', async () => {
        const testUrls = [
          'https://abc123def.supabase.co',
          'https://my-project-name.supabase.co',
          'https://custom.domain.com'
        ];

        for (const url of testUrls) {
          jest.resetModules();
          mockEnvironment({
            VITE_SUPABASE_URL: url,
            VITE_SUPABASE_ANON_KEY: 'test-key'
          });

          const config = require('./config');
          expect(config.isSupabaseConfigured()).toBe(true);
          expect(config.isMockMode).toBe(false);
        }
      });
    });

    describe('Mock mode', () => {
      it('should detect mock mode when no environment variables are set', () => {
        mockEnvironment();

        const config = require('./config');

        expect(config.isMockMode).toBe(true);
        expect(config.isSupabaseConfigured()).toBe(false);
        expect(consoleSpy.log).toHaveBeenCalledWith('🔧 Running in MOCK MODE - No real Supabase connection');
        expect(consoleSpy.log).toHaveBeenCalledWith('📝 To connect to Supabase:');
      });

      it('should detect mock mode when using default placeholder values', () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://your-project.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'your-anon-key-here'
        });

        const config = require('./config');

        expect(config.isMockMode).toBe(true);
        expect(config.isSupabaseConfigured()).toBe(false);
      });

      it('should detect mock mode when URL is missing', () => {
        mockEnvironment({
          VITE_SUPABASE_ANON_KEY: 'valid-key'
        });

        const config = require('./config');

        expect(config.isMockMode).toBe(true);
        expect(config.isSupabaseConfigured()).toBe(false);
      });

      it('should detect mock mode when key is missing', () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://valid-project.supabase.co'
        });

        const config = require('./config');

        expect(config.isMockMode).toBe(true);
        expect(config.isSupabaseConfigured()).toBe(false);
      });

      it('should create client in mock mode with default values', () => {
        mockEnvironment();

        const mockClient = {
          storage: { from: jest.fn() },
          auth: { getSession: jest.fn() }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');

        expect(mockCreateClient).toHaveBeenCalledWith(
          'https://your-project.supabase.co',
          'your-anon-key-here',
          expect.any(Object)
        );
        expect(config.supabase).toBe(mockClient);
      });
    });
  });

  describe('Storage Configuration', () => {
    it('should export correct storage configuration', () => {
      mockEnvironment();
      const config = require('./config');

      expect(config.STORAGE_CONFIG).toEqual({
        bucketName: 'cv-uploads',
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        allowedExtensions: ['.pdf', '.doc', '.docx']
      });
    });

    it('should have consistent bucket name across configuration', () => {
      mockEnvironment();
      const config = require('./config');

      expect(config.STORAGE_CONFIG.bucketName).toBe('cv-uploads');
    });

    it('should validate file size limits', () => {
      mockEnvironment();
      const config = require('./config');

      const maxSize = config.STORAGE_CONFIG.maxFileSize;
      expect(maxSize).toBe(10 * 1024 * 1024); // 10MB
      expect(typeof maxSize).toBe('number');
      expect(maxSize).toBeGreaterThan(0);
    });

    it('should validate allowed file types', () => {
      mockEnvironment();
      const config = require('./config');

      const { allowedMimeTypes, allowedExtensions } = config.STORAGE_CONFIG;
      
      expect(allowedMimeTypes).toHaveLength(3);
      expect(allowedExtensions).toHaveLength(3);
      
      // Check PDF support
      expect(allowedMimeTypes).toContain('application/pdf');
      expect(allowedExtensions).toContain('.pdf');
      
      // Check DOC support
      expect(allowedMimeTypes).toContain('application/msword');
      expect(allowedExtensions).toContain('.doc');
      
      // Check DOCX support
      expect(allowedMimeTypes).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(allowedExtensions).toContain('.docx');
    });
  });

  describe('Client Configuration', () => {
    it('should configure client with correct auth settings', () => {
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });

      const mockClient = { storage: { from: jest.fn() } };
      mockCreateClient.mockReturnValue(mockClient);

      require('./config');

      expect(mockCreateClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key',
        expect.objectContaining({
          auth: {
            persistSession: false
          }
        })
      );
    });

    it('should configure client with custom headers', () => {
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });

      const mockClient = { storage: { from: jest.fn() } };
      mockCreateClient.mockReturnValue(mockClient);

      require('./config');

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          global: {
            headers: {
              'x-my-custom-header': 'agenticv-frontend'
            }
          }
        })
      );
    });

    it('should export the created client instance', () => {
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });

      const mockClient = { 
        storage: { from: jest.fn() },
        testProperty: 'test-value'
      };
      mockCreateClient.mockReturnValue(mockClient);

      const config = require('./config');

      expect(config.supabase).toBe(mockClient);
      expect(config.default).toBe(mockClient);
    });
  });

  describe('testConnection', () => {
    describe('Success cases', () => {
      it('should test connection successfully when configured', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const mockBuckets = [
          { name: 'cv-uploads' },
          { name: 'public-assets' }
        ];

        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockResolvedValue({
              data: mockBuckets,
              error: null
            })
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: true,
          buckets: ['cv-uploads', 'public-assets'],
          message: 'Connected to Supabase successfully'
        });
        expect(mockClient.storage.listBuckets).toHaveBeenCalled();
      });

      it('should handle empty bucket list', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockResolvedValue({
              data: [],
              error: null
            })
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: true,
          buckets: [],
          message: 'Connected to Supabase successfully'
        });
      });

      it('should handle null bucket data', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: true,
          buckets: [],
          message: 'Connected to Supabase successfully'
        });
      });
    });

    describe('Error cases', () => {
      it('should handle connection test when not configured', async () => {
        mockEnvironment(); // Mock mode

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: false,
          error: 'Supabase not configured',
          message: 'Failed to connect to Supabase'
        });
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Supabase connection test failed:',
          expect.any(Error)
        );
      });

      it('should handle Supabase API errors', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const apiError = new Error('Invalid API key');
        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockResolvedValue({
              data: null,
              error: apiError
            })
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: false,
          error: 'Invalid API key',
          message: 'Failed to connect to Supabase'
        });
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Supabase connection test failed:',
          apiError
        );
      });

      it('should handle network errors', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const networkError = new Error('Network timeout');
        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockRejectedValue(networkError)
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result).toEqual({
          success: false,
          error: 'Network timeout',
          message: 'Failed to connect to Supabase'
        });
      });

      it('should handle malformed response', async () => {
        mockEnvironment({
          VITE_SUPABASE_URL: 'https://test.supabase.co',
          VITE_SUPABASE_ANON_KEY: 'test-key'
        });

        const mockClient = {
          storage: {
            listBuckets: jest.fn().mockResolvedValue(null) // Malformed response
          }
        };
        mockCreateClient.mockReturnValue(mockClient);

        const config = require('./config');
        const result = await config.testConnection();

        expect(result.success).toBe(false);
        expect(result.message).toBe('Failed to connect to Supabase');
      });
    });
  });

  describe('Helper Functions', () => {
    it('should correctly identify configured state', () => {
      // Test configured state
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });
      
      let config = require('./config');
      expect(config.isSupabaseConfigured()).toBe(true);
      
      // Test unconfigured state
      jest.resetModules();
      mockEnvironment();
      
      config = require('./config');
      expect(config.isSupabaseConfigured()).toBe(false);
    });

    it('should handle edge cases in configuration detection', () => {
      const edgeCases = [
        { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: 'key' },
        { VITE_SUPABASE_URL: 'url', VITE_SUPABASE_ANON_KEY: '' },
        { VITE_SUPABASE_URL: '   ', VITE_SUPABASE_ANON_KEY: 'key' },
        { VITE_SUPABASE_URL: 'url', VITE_SUPABASE_ANON_KEY: '   ' }
      ];

      edgeCases.forEach((envVars, index) => {
        jest.resetModules();
        mockEnvironment(envVars);
        
        const config = require('./config');
        expect(config.isSupabaseConfigured()).toBe(false);
      });
    });
  });

  describe('Module Exports', () => {
    it('should export all required properties and functions', () => {
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });

      const config = require('./config');

      // Check all expected exports
      expect(config).toHaveProperty('supabase');
      expect(config).toHaveProperty('STORAGE_CONFIG');
      expect(config).toHaveProperty('isSupabaseConfigured');
      expect(config).toHaveProperty('testConnection');
      expect(config).toHaveProperty('isMockMode');
      expect(config).toHaveProperty('default');

      // Check types
      expect(typeof config.supabase).toBe('object');
      expect(typeof config.STORAGE_CONFIG).toBe('object');
      expect(typeof config.isSupabaseConfigured).toBe('function');
      expect(typeof config.testConnection).toBe('function');
      expect(typeof config.isMockMode).toBe('boolean');
    });

    it('should have consistent default export', () => {
      mockEnvironment({
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key'
      });

      const mockClient = { test: 'client' };
      mockCreateClient.mockReturnValue(mockClient);

      const config = require('./config');

      expect(config.default).toBe(config.supabase);
      expect(config.default).toBe(mockClient);
    });
  });
});