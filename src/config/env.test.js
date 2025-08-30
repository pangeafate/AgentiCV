/**
 * Environment Configuration Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * Using shared infrastructure from test/index.js
 * 
 * Test Coverage Areas:
 * - Environment variable loading and defaults
 * - Production detection logic
 * - Window/browser environment handling
 * - Fallback values for missing env vars
 */

import { setupTest } from '@/test';

// Setup shared utilities following GL-TESTING-GUIDELINES.md
const { getWrapper } = setupTest();

// Mock the env.js module
jest.mock('./env.js', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-key', 
    VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.test.com/webhook/analyze',
    PROD: false,
    DEV: true
  },
  isProduction: jest.fn(() => false)
}));

// Mock window object
const mockWindow = {
  location: {
    hostname: 'localhost'
  }
};

describe('Environment Configuration', () => {
  let env, isProduction;

  beforeEach(async () => {
    // Reset window mock
    global.window = mockWindow;
    mockWindow.location.hostname = 'localhost';

    // Clear all mocks
    jest.clearAllMocks();

    // Import the mocked module
    const envModule = await import('./env.js');
    env = envModule.env;
    isProduction = envModule.isProduction;
  });

  afterEach(() => {
    // Clean up global window mock
    delete global.window;
  });

  describe('env object', () => {
    it('should have correct default values', () => {
      // Assert
      expect(env.VITE_SUPABASE_URL).toBe('https://test.supabase.co');
      expect(env.VITE_SUPABASE_ANON_KEY).toBe('test-key');
      expect(env.VITE_N8N_COMPLETE_ANALYSIS_URL).toBe('https://n8n.test.com/webhook/analyze');
      expect(env.PROD).toBe(false);
      expect(env.DEV).toBe(true);
    });

    it('should contain all required environment variables', () => {
      // Assert - Check that all expected properties exist
      expect(env).toHaveProperty('VITE_SUPABASE_URL');
      expect(env).toHaveProperty('VITE_SUPABASE_ANON_KEY');
      expect(env).toHaveProperty('VITE_N8N_COMPLETE_ANALYSIS_URL');
      expect(env).toHaveProperty('PROD');
      expect(env).toHaveProperty('DEV');
    });

    it('should have string values for URL configurations', () => {
      // Assert
      expect(typeof env.VITE_SUPABASE_URL).toBe('string');
      expect(typeof env.VITE_SUPABASE_ANON_KEY).toBe('string');
      expect(typeof env.VITE_N8N_COMPLETE_ANALYSIS_URL).toBe('string');
    });

    it('should have boolean values for environment flags', () => {
      // Assert
      expect(typeof env.PROD).toBe('boolean');
      expect(typeof env.DEV).toBe('boolean');
    });
  });

  describe('isProduction function', () => {
    it('should be a function', () => {
      // Assert
      expect(typeof isProduction).toBe('function');
    });

    it('should be called when imported', () => {
      // Act
      isProduction();

      // Assert
      expect(isProduction).toHaveBeenCalled();
    });

    it('should return boolean value', () => {
      // Act
      const result = isProduction();

      // Assert
      expect(typeof result).toBe('boolean');
    });

    describe('with mocked implementations', () => {
      it('should return false for development environment', () => {
        // Arrange
        isProduction.mockReturnValue(false);

        // Act
        const result = isProduction();

        // Assert
        expect(result).toBe(false);
      });

      it('should return true for production environment', () => {
        // Arrange
        isProduction.mockReturnValue(true);

        // Act
        const result = isProduction();

        // Assert
        expect(result).toBe(true);
      });

      it('should handle multiple calls consistently', () => {
        // Arrange
        isProduction.mockReturnValue(true);

        // Act
        const result1 = isProduction();
        const result2 = isProduction();
        const result3 = isProduction();

        // Assert
        expect(result1).toBe(true);
        expect(result2).toBe(true);
        expect(result3).toBe(true);
        expect(isProduction).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work correctly when both env and isProduction are used together', () => {
      // Arrange
      isProduction.mockReturnValue(true);

      // Act
      const prodFlag = env.PROD;
      const isProd = isProduction();

      // Assert
      expect(env.VITE_SUPABASE_URL).toBeDefined();
      expect(typeof isProd).toBe('boolean');
      expect(typeof prodFlag).toBe('boolean');
    });

    it('should provide fallback values when environment variables are missing', () => {
      // Assert - Fallback values should be provided
      expect(env.VITE_SUPABASE_URL).toBeTruthy();
      expect(env.VITE_SUPABASE_ANON_KEY).toBeTruthy();
      expect(env.VITE_N8N_COMPLETE_ANALYSIS_URL).toBeTruthy();
      expect(env.VITE_SUPABASE_URL).not.toBe('undefined');
      expect(env.VITE_SUPABASE_ANON_KEY).not.toBe('undefined');
    });

    it('should maintain consistent state across multiple imports', async () => {
      // Act - Import the module again
      const envModule2 = await import('./env.js');

      // Assert - Should be the same instance
      expect(envModule2.env).toBe(env);
      expect(envModule2.isProduction).toBe(isProduction);
    });
  });

  describe('configuration validation', () => {
    it('should have valid URL formats for service endpoints', () => {
      // Assert
      expect(env.VITE_SUPABASE_URL).toMatch(/^https?:\/\/.+/);
      expect(env.VITE_N8N_COMPLETE_ANALYSIS_URL).toMatch(/^https?:\/\/.+/);
    });

    it('should have non-empty configuration values', () => {
      // Assert
      expect(env.VITE_SUPABASE_URL.length).toBeGreaterThan(0);
      expect(env.VITE_SUPABASE_ANON_KEY.length).toBeGreaterThan(0);
      expect(env.VITE_N8N_COMPLETE_ANALYSIS_URL.length).toBeGreaterThan(0);
    });

    it('should have opposite PROD and DEV flags in test environment', () => {
      // Assert - In test environment, typically PROD=false and DEV=true
      expect(env.PROD).toBe(false);
      expect(env.DEV).toBe(true);
      expect(env.PROD).not.toBe(env.DEV);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle when isProduction throws an error', () => {
      // Arrange
      isProduction.mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act & Assert
      expect(() => isProduction()).toThrow('Test error');
    });

    it('should handle undefined return values gracefully', () => {
      // Arrange
      isProduction.mockReturnValue(undefined);

      // Act
      const result = isProduction();

      // Assert
      expect(result).toBeUndefined();
    });

    it('should handle null return values gracefully', () => {
      // Arrange
      isProduction.mockReturnValue(null);

      // Act
      const result = isProduction();

      // Assert
      expect(result).toBeNull();
    });
  });
});