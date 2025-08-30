/**
 * CORS Proxy Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import { fetchWithCORS, isProduction } from './corsProxy';
import { setupTest } from '@/test/utils/testSetup';

// Mock console methods
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Mock window.location
const mockLocation = {
  hostname: 'localhost',
  origin: 'http://localhost:3000'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('CORS Proxy', () => {
  let testUtils;
  let originalFetch;

  beforeEach(() => {
    testUtils = setupTest({ mockFetch: true });
    originalFetch = global.fetch;
    
    // Clear all mocks
    jest.clearAllMocks();
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
    
    // Reset window.location to localhost
    mockLocation.hostname = 'localhost';
    mockLocation.origin = 'http://localhost:3000';
  });

  afterEach(() => {
    testUtils.cleanup();
    global.fetch = originalFetch;
  });

  describe('isProduction', () => {
    beforeEach(() => {
      // Reset import.meta.env
      global.import = {
        meta: {
          env: {}
        }
      };
    });

    it('should return false for localhost development', () => {
      mockLocation.hostname = 'localhost';
      global.import.meta.env.PROD = false;

      const result = isProduction();

      expect(result).toBe(false);
    });

    it('should return true when PROD env is true', () => {
      mockLocation.hostname = 'localhost';
      global.import.meta.env.PROD = true;

      const result = isProduction();

      expect(result).toBe(true);
    });

    it('should return true for production hostnames', () => {
      const productionHosts = [
        'myapp.com',
        'app.example.com',
        '192.168.1.100',
        'agenticv.vercel.app'
      ];

      productionHosts.forEach(hostname => {
        mockLocation.hostname = hostname;
        global.import.meta.env.PROD = false;

        const result = isProduction();

        expect(result).toBe(true);
      });
    });

    it('should handle edge cases', () => {
      // Empty hostname
      mockLocation.hostname = '';
      expect(isProduction()).toBe(true);
      
      // Undefined hostname
      mockLocation.hostname = undefined;
      expect(isProduction()).toBe(true);
      
      // localhost variations
      mockLocation.hostname = '127.0.0.1';
      expect(isProduction()).toBe(true);
    });
  });

  describe('fetchWithCORS', () => {
    const testUrl = 'https://api.example.com/data';
    const testOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    };

    describe('Direct request success', () => {
      it('should return response when direct request succeeds', async () => {
        const mockResponse = new Response(JSON.stringify({ success: true }), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json' }
        });
        
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithCORS(testUrl, testOptions);

        expect(result).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(testUrl, {
          ...testOptions,
          mode: 'cors'
        });
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should return response for non-200 but valid HTTP status codes', async () => {
        const mockResponse = new Response('Not Found', {
          status: 404,
          statusText: 'Not Found'
        });
        Object.defineProperty(mockResponse, 'ok', { value: false });
        
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithCORS(testUrl);

        expect(result).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      it('should work with no options provided', async () => {
        const mockResponse = new Response('success');
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithCORS(testUrl);

        expect(result).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(testUrl, { mode: 'cors' });
      });

      it('should preserve custom headers in direct request', async () => {
        const mockResponse = new Response('success');
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const customOptions = {
          headers: {
            'Authorization': 'Bearer token',
            'X-Custom-Header': 'custom-value'
          }
        };

        await fetchWithCORS(testUrl, customOptions);

        expect(global.fetch).toHaveBeenCalledWith(testUrl, {
          ...customOptions,
          mode: 'cors'
        });
      });
    });

    describe('CORS proxy fallback', () => {
      const corsProxies = [
        'https://cors-anywhere.herokuapp.com/',
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?'
      ];

      beforeEach(() => {
        // Mock direct request failure
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('CORS error'))
          .mockResolvedValue(new Response('proxy success'));
      });

      it('should try CORS proxies when direct request fails', async () => {
        const result = await fetchWithCORS(testUrl, testOptions);

        expect(result.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(2); // Direct + first proxy
        
        // Check that proxy URL was used
        const proxyCall = global.fetch.mock.calls[1];
        const proxyUrl = proxyCall[0];
        expect(corsProxies.some(proxy => proxyUrl.includes(proxy))).toBe(true);
        expect(proxyUrl).toContain(encodeURIComponent(testUrl));
      });

      it('should try all proxies if first ones fail', async () => {
        // Mock all requests to fail except the last one
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Direct CORS error'))
          .mockRejectedValueOnce(new Error('Proxy 1 failed'))
          .mockRejectedValueOnce(new Error('Proxy 2 failed'))
          .mockResolvedValueOnce(new Response('success from proxy 3'));

        const result = await fetchWithCORS(testUrl);

        expect(global.fetch).toHaveBeenCalledTimes(4); // Direct + 3 proxies
        expect(result.status).toBe(200);
        
        // Verify console logging
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'Direct request failed, trying with CORS proxy:',
          'CORS error'
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'Success with CORS proxy:',
          expect.any(String)
        );
      });

      it('should add X-Requested-With header to proxy requests', async () => {
        await fetchWithCORS(testUrl, testOptions);

        const proxyCall = global.fetch.mock.calls[1];
        const proxyOptions = proxyCall[1];
        
        expect(proxyOptions.headers['X-Requested-With']).toBe('XMLHttpRequest');
        expect(proxyOptions.headers['Content-Type']).toBe('application/json');
      });

      it('should handle proxy requests without original headers', async () => {
        await fetchWithCORS(testUrl); // No options

        const proxyCall = global.fetch.mock.calls[1];
        const proxyOptions = proxyCall[1];
        
        expect(proxyOptions.headers['X-Requested-With']).toBe('XMLHttpRequest');
      });

      it('should encode URLs properly for different proxy formats', async () => {
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Direct failed'))
          .mockResolvedValueOnce(new Response('proxy success'));

        const specialUrl = 'https://api.example.com/path?param=value&other=test';
        await fetchWithCORS(specialUrl);

        const proxyCall = global.fetch.mock.calls[1];
        const proxyUrl = proxyCall[0];
        
        // URL should be properly encoded
        expect(proxyUrl).toContain(encodeURIComponent(specialUrl));
      });

      it('should log proxy attempts', async () => {
        await fetchWithCORS(testUrl);

        expect(consoleSpy.log).toHaveBeenCalledWith(
          'Direct request failed, trying with CORS proxy:',
          'CORS error'
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'Trying CORS proxy:',
          expect.stringContaining('cors-anywhere')
        );
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'Success with CORS proxy:',
          expect.stringContaining('cors-anywhere')
        );
      });

      it('should handle proxy failures gracefully', async () => {
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Direct failed'))
          .mockRejectedValueOnce(new Error('Proxy 1 failed'))
          .mockRejectedValue(new Error('All proxies failed'));

        await expect(fetchWithCORS(testUrl)).rejects.toThrow(/Unable to complete request due to CORS restrictions/);
        
        expect(consoleSpy.log).toHaveBeenCalledWith(
          'CORS proxy failed:',
          expect.any(String),
          'Proxy 1 failed'
        );
      });
    });

    describe('Error handling', () => {
      it('should throw specific error when all proxies fail', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('All failed'));

        await expect(fetchWithCORS(testUrl)).rejects.toThrow(
          /Unable to complete request due to CORS restrictions.*Please ensure the N8N webhook is configured/
        );

        // Should try direct + all 3 proxies
        expect(global.fetch).toHaveBeenCalledTimes(4);
      });

      it('should handle network timeouts', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network timeout'));

        await expect(fetchWithCORS(testUrl)).rejects.toThrow(/CORS restrictions/);
      });

      it('should handle malformed URLs', async () => {
        const malformedUrl = 'not-a-url';
        global.fetch = jest.fn().mockRejectedValue(new Error('Invalid URL'));

        await expect(fetchWithCORS(malformedUrl)).rejects.toThrow(/CORS restrictions/);
      });

      it('should handle empty responses from proxies', async () => {
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Direct failed'))
          .mockResolvedValueOnce(new Response(null, { status: 204 }));

        const result = await fetchWithCORS(testUrl);
        
        expect(result.status).toBe(204);
      });

      it('should continue to next proxy if current proxy returns error status', async () => {
        global.fetch = jest.fn()
          .mockRejectedValueOnce(new Error('Direct failed'))
          .mockResolvedValueOnce(new Response('Error', { status: 500 }))
          .mockResolvedValueOnce(new Response('Success', { status: 200 }));

        const result = await fetchWithCORS(testUrl);

        expect(result.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });
    });

    describe('Direct request edge cases', () => {
      it('should handle status 0 (network error) by trying proxies', async () => {
        const mockResponse = new Response('', { status: 0 });
        Object.defineProperty(mockResponse, 'ok', { value: false });
        
        global.fetch = jest.fn()
          .mockResolvedValueOnce(mockResponse)
          .mockResolvedValueOnce(new Response('proxy success'));

        const result = await fetchWithCORS(testUrl);

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(result.status).toBe(200);
      });

      it('should accept any non-0 status as valid direct response', async () => {
        const statusCodes = [200, 201, 400, 401, 404, 500];

        for (const status of statusCodes) {
          jest.clearAllMocks();
          const mockResponse = new Response('response', { status });
          Object.defineProperty(mockResponse, 'ok', { value: status < 400 });
          
          global.fetch = jest.fn().mockResolvedValue(mockResponse);

          const result = await fetchWithCORS(testUrl);

          expect(result.status).toBe(status);
          expect(global.fetch).toHaveBeenCalledTimes(1); // Should not try proxies
        }
      });
    });

    describe('Integration scenarios', () => {
      it('should handle webhook endpoint calls', async () => {
        const webhookUrl = 'https://n8n.example.com/webhook/analyze';
        const webhookData = { cvText: 'sample cv', jobDescription: 'sample job' };
        
        const mockResponse = new Response(JSON.stringify({ analysis: 'result' }));
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithCORS(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData)
        });

        expect(result).toBe(mockResponse);
        expect(global.fetch).toHaveBeenCalledWith(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData),
          mode: 'cors'
        });
      });

      it('should work with different content types', async () => {
        const contentTypes = [
          'application/json',
          'application/x-www-form-urlencoded',
          'multipart/form-data',
          'text/plain'
        ];

        for (const contentType of contentTypes) {
          jest.clearAllMocks();
          const mockResponse = new Response('success');
          global.fetch = jest.fn().mockResolvedValue(mockResponse);

          await fetchWithCORS(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body: 'test data'
          });

          expect(global.fetch).toHaveBeenCalledWith(testUrl, {
            method: 'POST',
            headers: { 'Content-Type': contentType },
            body: 'test data',
            mode: 'cors'
          });
        }
      });

      it('should preserve all HTTP methods', async () => {
        const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

        for (const method of methods) {
          jest.clearAllMocks();
          const mockResponse = new Response('success');
          global.fetch = jest.fn().mockResolvedValue(mockResponse);

          await fetchWithCORS(testUrl, { method });

          expect(global.fetch).toHaveBeenCalledWith(testUrl, {
            method,
            mode: 'cors'
          });
        }
      });
    });

    describe('Performance and reliability', () => {
      it('should handle concurrent requests', async () => {
        const mockResponse = new Response('success');
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const promises = Array(5).fill().map((_, i) => 
          fetchWithCORS(`${testUrl}/${i}`)
        );

        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        expect(global.fetch).toHaveBeenCalledTimes(5);
        results.forEach(result => {
          expect(result.status).toBe(200);
        });
      });

      it('should handle large payloads', async () => {
        const largePayload = 'x'.repeat(1024 * 1024); // 1MB
        const mockResponse = new Response('success');
        global.fetch = jest.fn().mockResolvedValue(mockResponse);

        const result = await fetchWithCORS(testUrl, {
          method: 'POST',
          body: largePayload
        });

        expect(result.status).toBe(200);
        expect(global.fetch).toHaveBeenCalledWith(testUrl, {
          method: 'POST',
          body: largePayload,
          mode: 'cors'
        });
      });

      it('should maintain proper error context', async () => {
        const networkError = new Error('Failed to fetch');
        networkError.code = 'NETWORK_ERROR';
        
        global.fetch = jest.fn().mockRejectedValue(networkError);

        try {
          await fetchWithCORS(testUrl);
          fail('Should have thrown an error');
        } catch (error) {
          expect(error.message).toContain('CORS restrictions');
          expect(error.message).toContain(window.location.origin);
        }
      });
    });
  });
});