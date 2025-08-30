/**
 * AnalysisControl Integration Tests
 * 
 * These tests verify the complete webhook integration flow,
 * testing both development (proxy) and production (direct) scenarios
 * to ensure CORS error handling works correctly in both environments.
 */

// Mock config/env.js before importing AnalysisControl
jest.mock('@/config/env', () => {
  const mockIsProduction = jest.fn(() => false);
  const mockShouldUseProxy = jest.fn(() => true);
  return {
    isProduction: mockIsProduction,
    shouldUseProxy: mockShouldUseProxy,
    env: {
      VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.lakestrom.com/webhook/get_cvjd',
      VITE_USE_PROXY_IN_PROD: false,
      VITE_PROXY_SERVER_URL: 'http://localhost:3002'
    }
  };
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AnalysisControl from './AnalysisControl';

const { shouldUseProxy: mockShouldUseProxy } = jest.requireMock('@/config/env');

describe('AnalysisControl Integration Tests', () => {
  const defaultProps = {
    cvReady: true,
    jdReady: true,
    sessionId: 'test-session-123',
    cvUrl: 'https://storage.supabase.co/test-cv.pdf',
    jobDescription: 'Senior React Developer position with 5+ years experience.',
    onAnalysisComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
    // Mock window.location for CORS error messages
    delete window.location;
    window.location = { origin: 'https://pangeafate.github.io' };
  });

  describe('Development Environment (Proxy Mode)', () => {
    beforeEach(() => {
      mockShouldUseProxy.mockReturnValue(true);
    });

    it('should successfully complete analysis via proxy server', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const mockResponse = {
        output: JSON.stringify({
          cv_content: 'Real CV content from N8N via proxy',
          cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }],
          jd_highlighting: [{ address: 'requirements[0]', class: 'highlight-match', reason: 'Required skill' }],
          match_score: { overall: 85, skills: 80, experience: 90 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3002/api/n8n/analyze-complete',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: defaultProps.sessionId,
              cvUrl: defaultProps.cvUrl,
              jobDescription: defaultProps.jobDescription
            })
          })
        );

        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith({
          cvData: 'Real CV content from N8N via proxy',
          jdData: defaultProps.jobDescription,
          analysis: {
            cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }],
            jd_highlighting: [{ address: 'requirements[0]', class: 'highlight-match', reason: 'Required skill' }],
            match_score: { overall: 85, skills: 80, experience: 90 }
          }
        });
      });

      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    });

    it('should handle proxy server being unreachable', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 0,
        type: 'error'
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/cors error: unable to reach the proxy server/i)).toBeInTheDocument();
        expect(screen.getByText(/please ensure the proxy server is running/i)).toBeInTheDocument();
      });

      // Should never call onAnalysisComplete with errors
      expect(defaultProps.onAnalysisComplete).not.toHaveBeenCalled();
    });
  });

  describe('Production Environment (Direct Webhook)', () => {
    beforeEach(() => {
      mockShouldUseProxy.mockReturnValue(false);
    });

    it('should successfully complete analysis via direct webhook', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const mockResponse = {
        output: JSON.stringify({
          cv_content: 'Real CV content from direct N8N webhook',
          cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }],
          jd_highlighting: [{ address: 'requirements[0]', class: 'highlight-match', reason: 'Required skill' }],
          match_score: { overall: 90, skills: 85, experience: 95 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://n8n.lakestrom.com/webhook/get_cvjd',
          expect.objectContaining({
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' }
          })
        );

        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith({
          cvData: 'Real CV content from direct N8N webhook',
          jdData: defaultProps.jobDescription,
          analysis: {
            cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }],
            jd_highlighting: [{ address: 'requirements[0]', class: 'highlight-match', reason: 'Required skill' }],
            match_score: { overall: 90, skills: 85, experience: 95 }
          }
        });
      });

      expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
    });

    it('should handle CORS blocking from GitHub Pages and show solutions', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      global.fetch.mockResolvedValue({
        ok: false,
        status: 0,
        type: 'opaque'
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        // Should detect CORS error
        expect(screen.getByText(/cors error: cross-origin request blocked/i)).toBeInTheDocument();
        
        // Should mention GitHub Pages issue
        expect(screen.getByText(/this is common when running from github pages/i)).toBeInTheDocument();
        
        // Should provide solutions
        expect(screen.getByText(/possible solutions:/i)).toBeInTheDocument();
        expect(screen.getByText(/set vite_use_proxy_in_prod=true/i)).toBeInTheDocument();
        expect(screen.getByText(/configure cors headers on your n8n webhook/i)).toBeInTheDocument();
        
        // Should show domain info in error message
        expect(screen.getByText(/is not configured to accept requests from this domain/)).toBeInTheDocument();
      });

      // Should never provide fake data on CORS errors
      expect(defaultProps.onAnalysisComplete).not.toHaveBeenCalled();
    });

    it('should never return placeholder data even on successful webhook response', async () => {
      // Arrange - This test ensures we never return the old 'CV content processed' placeholder
      const user = userEvent.setup({ delay: null });
      const mockResponse = {
        output: JSON.stringify({
          cv_content: 'Actual processed CV content from N8N',
          cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          match_score: { score: 75 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            cvData: 'Actual processed CV content from N8N'
          })
        );
      });

      // Ensure it's NOT called with placeholder text
      expect(defaultProps.onAnalysisComplete).not.toHaveBeenCalledWith(
        expect.objectContaining({
          cvData: 'CV content processed'
        })
      );
    });
  });

  describe('Cross-Environment Configuration', () => {
    it('should respect VITE_USE_PROXY_IN_PROD setting for production proxy mode', async () => {
      // Arrange - Test that even in production, we can force proxy usage
      const user = userEvent.setup({ delay: null });
      
      // Mock environment where production wants to use proxy
      mockShouldUseProxy.mockReturnValue(true); // Forces proxy even in prod

      const mockResponse = {
        output: JSON.stringify({
          cv_content: 'CV processed via production proxy',
          cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          match_score: { score: 80 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should use proxy URL even though we might be in production
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:3002/api/n8n/analyze-complete',
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });
});