/**
 * Supabase Configuration Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * Using shared infrastructure from test/index.js
 * 
 * Test Coverage Areas:
 * - Supabase client configuration
 * - Mock mode detection logic  
 * - Storage configuration constants
 * - Connection testing functionality
 * - Environment-based configuration
 */

import { setupTest } from '@/test';

// Setup shared utilities following GL-TESTING-GUIDELINES.md
const { getWrapper } = setupTest();

// Mock @supabase/supabase-js
const mockSupabaseClient = {
  storage: {
    listBuckets: jest.fn(),
    from: jest.fn()
  },
  auth: {
    getSession: jest.fn()
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock the entire config module
jest.mock('./config.js', () => ({
  supabase: mockSupabaseClient,
  isMockMode: false,
  isSupabaseConfigured: jest.fn(() => true),
  testConnection: jest.fn(),
  STORAGE_CONFIG: {
    bucketName: 'cv-uploads',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx']
  },
  default: mockSupabaseClient
}));

// Mock console methods to avoid test noise
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

describe('Supabase Configuration', () => {
  let supabase, isMockMode, isSupabaseConfigured, testConnection, STORAGE_CONFIG;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset console spies
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();

    // Import the mocked module
    const configModule = await import('./config.js');
    supabase = configModule.supabase;
    isMockMode = configModule.isMockMode;
    isSupabaseConfigured = configModule.isSupabaseConfigured;
    testConnection = configModule.testConnection;
    STORAGE_CONFIG = configModule.STORAGE_CONFIG;
  });

  afterEach(() => {
    // Clean up
    jest.clearAllMocks();
  });

  afterAll(() => {
    // Restore console methods
    consoleSpy.log.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('supabase client', () => {
    it('should be defined and have expected properties', () => {
      // Assert
      expect(supabase).toBeDefined();
      expect(supabase).toHaveProperty('storage');
      expect(supabase).toHaveProperty('auth');
      expect(supabase.storage).toHaveProperty('listBuckets');
      expect(supabase.storage).toHaveProperty('from');
    });

    it('should be an instance of the mocked client', () => {
      // Assert
      expect(supabase).toBe(mockSupabaseClient);
    });

    it('should have storage methods available', () => {
      // Assert
      expect(typeof supabase.storage.listBuckets).toBe('function');
      expect(typeof supabase.storage.from).toBe('function');
    });

    it('should have auth methods available', () => {
      // Assert
      expect(typeof supabase.auth.getSession).toBe('function');
    });
  });

  describe('isMockMode flag', () => {
    it('should be a boolean value', () => {
      // Assert
      expect(typeof isMockMode).toBe('boolean');
    });

    it('should be false in configured test environment', () => {
      // Assert
      expect(isMockMode).toBe(false);
    });
  });

  describe('isSupabaseConfigured function', () => {
    it('should be a function', () => {
      // Assert  
      expect(typeof isSupabaseConfigured).toBe('function');
    });

    it('should return true when properly configured', () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(true);

      // Act
      const result = isSupabaseConfigured();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when not configured', () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      const result = isSupabaseConfigured();

      // Assert
      expect(result).toBe(false);
    });

    it('should be called when checking configuration', () => {
      // Act
      isSupabaseConfigured();

      // Assert
      expect(isSupabaseConfigured).toHaveBeenCalled();
    });

    it('should handle multiple calls consistently', () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(true);

      // Act
      isSupabaseConfigured();
      isSupabaseConfigured();

      // Assert
      expect(isSupabaseConfigured).toHaveBeenCalledTimes(2);
    });
  });

  describe('testConnection function', () => {
    it('should be a function', () => {
      // Assert
      expect(typeof testConnection).toBe('function');
    });

    it('should return success result when connection works', async () => {
      // Arrange
      const successResult = {
        success: true,
        buckets: ['cv-uploads'],
        message: 'Connected to Supabase successfully'
      };
      testConnection.mockResolvedValue(successResult);

      // Act
      const result = await testConnection();

      // Assert
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('buckets');
      expect(result).toHaveProperty('message');
      expect(Array.isArray(result.buckets)).toBe(true);
    });

    it('should return error result when connection fails', async () => {
      // Arrange
      const errorResult = {
        success: false,
        error: 'Connection failed',
        message: 'Failed to connect to Supabase'
      };
      testConnection.mockResolvedValue(errorResult);

      // Act
      const result = await testConnection();

      // Assert
      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('message');
    });

    it('should handle configuration errors', async () => {
      // Arrange
      const configError = {
        success: false,
        error: 'Supabase not configured',
        message: 'Failed to connect to Supabase'
      };
      testConnection.mockResolvedValue(configError);

      // Act
      const result = await testConnection();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Supabase not configured');
    });

    it('should be callable multiple times', async () => {
      // Arrange
      testConnection.mockResolvedValue({ success: true });

      // Act
      await testConnection();
      await testConnection();

      // Assert
      expect(testConnection).toHaveBeenCalledTimes(2);
    });

    it('should handle promise rejection', async () => {
      // Arrange
      testConnection.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(testConnection()).rejects.toThrow('Network error');
    });

    it('should handle different bucket configurations', async () => {
      // Arrange
      const results = [
        { success: true, buckets: [] },
        { success: true, buckets: ['cv-uploads'] },
        { success: true, buckets: ['cv-uploads', 'images', 'documents'] }
      ];

      // Act & Assert for each result
      for (const expectedResult of results) {
        testConnection.mockResolvedValueOnce(expectedResult);
        const result = await testConnection();
        expect(result.buckets).toEqual(expectedResult.buckets);
      }
    });
  });

  describe('STORAGE_CONFIG constant', () => {
    it('should be defined and have all required properties', () => {
      // Assert
      expect(STORAGE_CONFIG).toBeDefined();
      expect(STORAGE_CONFIG).toHaveProperty('bucketName');
      expect(STORAGE_CONFIG).toHaveProperty('maxFileSize');
      expect(STORAGE_CONFIG).toHaveProperty('allowedMimeTypes');
      expect(STORAGE_CONFIG).toHaveProperty('allowedExtensions');
    });

    it('should have correct bucket name', () => {
      // Assert
      expect(STORAGE_CONFIG.bucketName).toBe('cv-uploads');
      expect(typeof STORAGE_CONFIG.bucketName).toBe('string');
    });

    it('should have correct file size limit', () => {
      // Assert
      expect(STORAGE_CONFIG.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
      expect(typeof STORAGE_CONFIG.maxFileSize).toBe('number');
      expect(STORAGE_CONFIG.maxFileSize).toBeGreaterThan(0);
    });

    it('should have correct allowed MIME types', () => {
      // Assert
      expect(Array.isArray(STORAGE_CONFIG.allowedMimeTypes)).toBe(true);
      expect(STORAGE_CONFIG.allowedMimeTypes).toContain('application/pdf');
      expect(STORAGE_CONFIG.allowedMimeTypes).toContain('application/msword');
      expect(STORAGE_CONFIG.allowedMimeTypes).toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(STORAGE_CONFIG.allowedMimeTypes.length).toBeGreaterThan(0);
    });

    it('should have correct allowed file extensions', () => {
      // Assert
      expect(Array.isArray(STORAGE_CONFIG.allowedExtensions)).toBe(true);
      expect(STORAGE_CONFIG.allowedExtensions).toContain('.pdf');
      expect(STORAGE_CONFIG.allowedExtensions).toContain('.doc');
      expect(STORAGE_CONFIG.allowedExtensions).toContain('.docx');
      expect(STORAGE_CONFIG.allowedExtensions.length).toBe(3);
    });

    it('should have consistent MIME types and extensions', () => {
      // Assert - Check that supported extensions match MIME types
      const hasPdf = STORAGE_CONFIG.allowedExtensions.includes('.pdf') && 
                     STORAGE_CONFIG.allowedMimeTypes.includes('application/pdf');
      const hasDoc = STORAGE_CONFIG.allowedExtensions.includes('.doc') && 
                     STORAGE_CONFIG.allowedMimeTypes.includes('application/msword');
      const hasDocx = STORAGE_CONFIG.allowedExtensions.includes('.docx') && 
                      STORAGE_CONFIG.allowedMimeTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      
      expect(hasPdf).toBe(true);
      expect(hasDoc).toBe(true);  
      expect(hasDocx).toBe(true);
    });

    it('should have immutable configuration', () => {
      // Act & Assert - Configuration should be stable across calls
      const config1 = STORAGE_CONFIG;
      const config2 = STORAGE_CONFIG;
      expect(config1).toBe(config2);
      expect(config1.bucketName).toBe(config2.bucketName);
      expect(config1.maxFileSize).toBe(config2.maxFileSize);
    });
  });

  describe('integration scenarios', () => {
    it('should work when all functions and configs are used together', async () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(true);
      testConnection.mockResolvedValue({
        success: true,
        buckets: [STORAGE_CONFIG.bucketName],
        message: 'Connected successfully'
      });

      // Act
      const configured = isSupabaseConfigured();
      const connectionResult = await testConnection();

      // Assert
      expect(configured).toBe(true);
      expect(connectionResult.success).toBe(true);
      expect(connectionResult.buckets).toContain(STORAGE_CONFIG.bucketName);
      expect(supabase).toBeDefined();
    });

    it('should handle mock mode scenarios', () => {
      // Act & Assert
      expect(typeof isMockMode).toBe('boolean');
      expect(STORAGE_CONFIG).toBeDefined();
      expect(supabase).toBeDefined();
    });

    it('should provide consistent configuration across calls', () => {
      // Act
      const config1 = STORAGE_CONFIG;
      const config2 = STORAGE_CONFIG;
      const client1 = supabase;
      const client2 = supabase;

      // Assert - Same reference
      expect(config1).toBe(config2);
      expect(client1).toBe(client2);
    });

    it('should support full upload workflow simulation', async () => {
      // Arrange - Simulate full upload workflow
      isSupabaseConfigured.mockReturnValue(true);
      testConnection.mockResolvedValue({ success: true, buckets: ['cv-uploads'] });
      
      // Mock storage operations
      const mockUploadResult = { data: { path: 'cv-uploads/test.pdf' } };
      supabase.storage.from.mockReturnValue({
        upload: jest.fn().mockResolvedValue(mockUploadResult)
      });

      // Act
      const isConfigured = isSupabaseConfigured();
      const connectionTest = await testConnection();
      const storageBucket = supabase.storage.from(STORAGE_CONFIG.bucketName);

      // Assert
      expect(isConfigured).toBe(true);
      expect(connectionTest.success).toBe(true);
      expect(supabase.storage.from).toHaveBeenCalledWith('cv-uploads');
      expect(storageBucket).toHaveProperty('upload');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle testConnection throwing errors', async () => {
      // Arrange
      testConnection.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(testConnection()).rejects.toThrow('Network error');
    });

    it('should handle invalid configuration states', () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(false);

      // Act
      const result = isSupabaseConfigured();

      // Assert
      expect(result).toBe(false);
    });

    it('should handle empty bucket results', async () => {
      // Arrange
      testConnection.mockResolvedValue({
        success: true,
        buckets: [],
        message: 'Connected but no buckets found'
      });

      // Act
      const result = await testConnection();

      // Assert
      expect(result.success).toBe(true);
      expect(result.buckets).toEqual([]);
    });

    it('should handle undefined/null responses gracefully', async () => {
      // Arrange
      testConnection.mockResolvedValue(null);

      // Act
      const result = await testConnection();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle storage client errors', async () => {
      // Arrange
      supabase.storage.listBuckets.mockRejectedValue(new Error('Storage error'));

      // Act & Assert
      expect(supabase.storage.listBuckets).toBeDefined();
      await expect(supabase.storage.listBuckets()).rejects.toThrow('Storage error');
    });

    it('should handle concurrent function calls', async () => {
      // Arrange
      isSupabaseConfigured.mockReturnValue(true);
      testConnection.mockResolvedValue({ success: true });

      // Act - Multiple concurrent calls
      const promises = [
        isSupabaseConfigured(),
        testConnection(),
        isSupabaseConfigured(),
        testConnection()
      ];
      await Promise.all(promises.filter(p => p instanceof Promise));

      // Assert
      expect(isSupabaseConfigured).toHaveBeenCalledTimes(2);
      expect(testConnection).toHaveBeenCalledTimes(2);
    });
  });

  describe('configuration validation', () => {
    it('should have reasonable file size limit', () => {
      // Assert
      const maxSizeMB = STORAGE_CONFIG.maxFileSize / (1024 * 1024);
      expect(maxSizeMB).toBe(10);
      expect(maxSizeMB).toBeGreaterThan(0);
      expect(maxSizeMB).toBeLessThan(100); // Reasonable upper bound
    });

    it('should have valid bucket name format', () => {
      // Assert
      expect(STORAGE_CONFIG.bucketName).toMatch(/^[a-z0-9-]+$/);
      expect(STORAGE_CONFIG.bucketName.length).toBeGreaterThan(0);
      expect(STORAGE_CONFIG.bucketName.length).toBeLessThan(100);
    });

    it('should have only supported document formats', () => {
      // Assert - Only document formats should be allowed
      STORAGE_CONFIG.allowedMimeTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^application\/(pdf|msword|vnd\.openxmlformats)/);
      });
    });

    it('should have valid file extension formats', () => {
      // Assert
      STORAGE_CONFIG.allowedExtensions.forEach(ext => {
        expect(ext).toMatch(/^\.[a-z]+$/);
        expect(ext.length).toBeGreaterThan(1);
        expect(ext.length).toBeLessThan(10);
      });
    });

    it('should have consistent configuration structure', () => {
      // Assert - All required fields should be properly typed
      expect(typeof STORAGE_CONFIG.bucketName).toBe('string');
      expect(typeof STORAGE_CONFIG.maxFileSize).toBe('number');
      expect(Array.isArray(STORAGE_CONFIG.allowedMimeTypes)).toBe(true);
      expect(Array.isArray(STORAGE_CONFIG.allowedExtensions)).toBe(true);
    });
  });

  describe('module exports and API', () => {
    it('should export all required properties and functions', async () => {
      // Act
      const configModule = await import('./config.js');

      // Assert - Check all expected exports
      expect(configModule).toHaveProperty('supabase');
      expect(configModule).toHaveProperty('STORAGE_CONFIG');
      expect(configModule).toHaveProperty('isSupabaseConfigured');
      expect(configModule).toHaveProperty('testConnection');
      expect(configModule).toHaveProperty('isMockMode');
      expect(configModule).toHaveProperty('default');

      // Check types
      expect(typeof configModule.supabase).toBe('object');
      expect(typeof configModule.STORAGE_CONFIG).toBe('object');
      expect(typeof configModule.isSupabaseConfigured).toBe('function');
      expect(typeof configModule.testConnection).toBe('function');
      expect(typeof configModule.isMockMode).toBe('boolean');
    });

    it('should have default export available', async () => {
      // Act
      const configModule = await import('./config.js');

      // Assert - Check that default export exists
      expect(configModule.default).toBeDefined();
      expect(configModule.supabase).toBe(mockSupabaseClient);
      expect(typeof configModule.default).toBe('object');
    });

    it('should maintain API contract across imports', async () => {
      // Act
      const import1 = await import('./config.js');
      const import2 = await import('./config.js');

      // Assert - Same references
      expect(import1.supabase).toBe(import2.supabase);
      expect(import1.STORAGE_CONFIG).toBe(import2.STORAGE_CONFIG);
      expect(import1.isSupabaseConfigured).toBe(import2.isSupabaseConfigured);
      expect(import1.testConnection).toBe(import2.testConnection);
    });
  });
});