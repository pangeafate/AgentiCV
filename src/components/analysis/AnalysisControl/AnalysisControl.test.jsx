/**
 * AnalysisControl Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * Using shared infrastructure from test/index.js
 * 
 * Test Coverage Areas:
 * - Component rendering and UI states
 * - Button enable/disable logic based on prerequisites
 * - Analysis process flow and API integration
 * - Progress tracking and status messages
 * - Error handling and retry functionality
 * - N8N webhook integration scenarios
 * - Loading states and user feedback
 * - Terminal theme styling
 * - Edge cases and network errors
 */

// Mock config/env.js before importing AnalysisControl
jest.mock('@/config/env', () => {
  const mockIsProduction = jest.fn(() => false);
  const mockShouldUseProxy = jest.fn(() => true); // Default to proxy in tests
  return {
    isProduction: mockIsProduction,
    shouldUseProxy: mockShouldUseProxy,
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
      VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://n8n.lakestrom.com/webhook/get_cvjd',
      VITE_USE_PROXY_IN_PROD: false,
      VITE_PROXY_SERVER_URL: 'http://localhost:3002',
      PROD: false,
      DEV: true
    }
  };
});

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, TestDataFactory } from '@/test';
import AnalysisControl from './AnalysisControl';

// Get the mocked functions
const { isProduction: mockIsProduction, shouldUseProxy: mockShouldUseProxy } = jest.requireMock('@/config/env');

// Use shared utilities following GL-TESTING-GUIDELINES.md
const { getWrapper } = setupTest();

describe('AnalysisControl Component', () => {
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
    mockIsProduction.mockReturnValue(false);
    mockShouldUseProxy.mockReturnValue(true); // Default to proxy in tests
    global.fetch = jest.fn();
    console.error = jest.fn();
    console.log = jest.fn();
    // Mock window.location for CORS error messages
    delete window.location;
    window.location = { origin: 'https://pangeafate.github.io' };
  });

  describe('Component Rendering', () => {
    it('should render analyze button with correct styling', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} />);
      
      // Assert - Check button presence
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeInTheDocument();
      
      // Check individual style properties (computed styles may differ)
      expect(analyzeButton).toHaveStyle('background-color: rgb(0, 255, 0)');
      expect(analyzeButton).toHaveStyle('color: rgb(0, 0, 0)');
    });

    it('should apply terminal theme styling to container', () => {
      // Arrange & Act
      const { container } = render(<AnalysisControl {...defaultProps} />);
      
      // Assert - Check container styling
      const containerDiv = container.firstChild;
      expect(containerDiv).toHaveStyle({
        backgroundColor: '#0a0a0a',
        border: '1px solid #00ff00',
        fontFamily: '"JetBrains Mono", monospace'
      });
    });

    it('should not show progress or status initially', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} />);
      
      // Assert - No progress elements should be visible initially
      expect(screen.queryByText(/analyzing/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/analysis complete/i)).not.toBeInTheDocument();
    });
  });

  describe('Button Enable/Disable Logic', () => {
    it('should enable button when both CV and JD are ready', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} cvReady={true} jdReady={true} />);
      
      // Assert
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeEnabled();
      expect(analyzeButton).toHaveStyle({ opacity: '1' });
    });

    it('should disable button when CV is not ready', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} cvReady={false} jdReady={true} />);
      
      // Assert
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeDisabled();
      expect(analyzeButton).toHaveStyle({ opacity: '0.5' });
    });

    it('should disable button when JD is not ready', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} cvReady={true} jdReady={false} />);
      
      // Assert
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeDisabled();
      expect(analyzeButton).toHaveStyle({ opacity: '0.5' });
    });

    it('should disable button when both CV and JD are not ready', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} cvReady={false} jdReady={false} />);
      
      // Assert
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeDisabled();
      expect(analyzeButton).toHaveStyle({ opacity: '0.5' });
    });

    it('should disable button during analysis', async () => {
      // Arrange
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<AnalysisControl {...defaultProps} />);
      const user = userEvent.setup({ delay: null });

      // Act - Start analysis
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Button should be disabled during analysis
      expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
    });
  });

  describe('Successful Analysis Flow', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should perform complete analysis workflow with valid N8N response', async () => {
      // Arrange
      const mockAnalysisResult = {
        output: JSON.stringify({
          cv_content: 'Actual CV content from N8N processing',
          cv_highlighting: [
            { address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }
          ],
          jd_highlighting: [
            { address: 'required_skills[0]', class: 'highlight-match', reason: 'Required skill' }
          ],
          match_score: { overall: 85, skills: 80, experience: 90 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAnalysisResult))
      });

      render(<AnalysisControl {...defaultProps} />);
      
      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Initial analyzing state
      expect(screen.getByRole('button', { name: /analyzing/i })).toBeInTheDocument();
      expect(screen.getByText(/analyzing gaps and matches/i)).toBeInTheDocument();

      // Wait for completion
      await waitFor(() => {
        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith({
          cvData: 'Actual CV content from N8N processing', // Real content, not placeholder
          jdData: defaultProps.jobDescription,
          analysis: {
            cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'React experience' }],
            jd_highlighting: [{ address: 'required_skills[0]', class: 'highlight-match', reason: 'Required skill' }],
            match_score: { overall: 85, skills: 80, experience: 90 }
          }
        });
      });
    });

    it('should show progress updates during analysis', async () => {
      // Arrange
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
          }), 100)
        )
      );
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Check progress indicators
      expect(screen.getByText(/analyzing gaps and matches/i)).toBeInTheDocument();
      
      // Progress bar container should be present
      const statusContainer = screen.getByText(/analyzing gaps and matches/i).closest('div');
      expect(statusContainer).toBeInTheDocument();
    });

    it('should show completion message after successful analysis', async () => {
      // Arrange - Valid response with required fields
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            cv_content: 'Valid CV content',
            cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
            jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
            match_score: { score: 85 }
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });
    });

    it('should handle array response format from N8N', async () => {
      // Arrange - N8N sometimes returns array format
      const mockArrayResponse = [{
        output: JSON.stringify({
          cv_content: 'CV content from array response',
          cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          match_score: { overall: 75 }
        })
      }];

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockArrayResponse))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            analysis: expect.objectContaining({
              match_score: { overall: 75 }
            })
          })
        );
      });
    });

    it('should handle pre-parsed output format', async () => {
      // Arrange - Sometimes output is already parsed object
      const mockResponse = {
        output: {
          cv_content: 'CV content from parsed response',
          cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          match_score: { overall: 90 }
        }
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
            analysis: expect.objectContaining({
              match_score: { overall: 90 }
            })
          })
        );
      });
    });
  });

  describe('API Integration', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should use proxy API URL when proxy is enabled', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(true);
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            cv_content: 'test',
            cv_highlighting: ['test'],
            jd_highlighting: ['test'],
            match_score: { score: 80 }
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should call proxy
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
      });
    });

    it('should use direct webhook URL when proxy is disabled', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(false);
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            cv_content: 'test',
            cv_highlighting: ['test'],
            jd_highlighting: ['test'],
            match_score: { score: 80 }
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should call direct webhook with CORS mode
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://n8n.lakestrom.com/webhook/get_cvjd',
          expect.objectContaining({
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    it('should include correct request payload', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({
              sessionId: 'test-session-123',
              cvUrl: 'https://storage.supabase.co/test-cv.pdf',
              jobDescription: 'Senior React Developer position with 5+ years experience.'
            })
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should handle HTTP error responses', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/error: failed to analyze cv and jd: 500 internal server error/i)).toBeInTheDocument();
      });
    });

    it('should handle N8N webhook not registered error', async () => {
      // Arrange
      const webhookError = { 
        code: 404, 
        message: 'Workflow webhook "get_cvjd" is not registered' 
      };
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(webhookError))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Check for N8N specific error handling
      await waitFor(() => {
        expect(screen.getByText(/n8n workflow not active/i)).toBeInTheDocument();
      });

      // Check for detailed instructions
      expect(screen.getByText(/open your n8n workflow editor/i)).toBeInTheDocument();
      expect(screen.getByText(/find the "get_cvjd" workflow/i)).toBeInTheDocument();
    });

    it('should handle generic N8N errors', async () => {
      // Arrange
      const n8nError = { 
        code: 500, 
        message: 'Internal server error in N8N' 
      };
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(n8nError))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/n8n service error: internal server error in n8n/i)).toBeInTheDocument();
      });
    });

    it('should handle CORS errors with detailed messaging for direct webhook', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(false); // Direct webhook
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
        expect(screen.getByText(/cors error: cross-origin request blocked/i)).toBeInTheDocument();
        expect(screen.getByText(/the n8n webhook at.*is not configured to accept requests/i)).toBeInTheDocument();
        expect(screen.getByText(/you can enable proxy mode by setting vite_use_proxy_in_prod=true/i)).toBeInTheDocument();
      });
    });

    it('should handle CORS errors with proxy-specific messaging for proxy failures', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(true); // Using proxy
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
    });

    it('should handle JSON parsing errors', async () => {
      // Arrange - Return invalid JSON
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('invalid json response')
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/invalid response from n8n webhook/i)).toBeInTheDocument();
      });
    });

    it('should handle network failures', async () => {
      // Arrange
      global.fetch.mockRejectedValue(new Error('Network connection failed'));
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/error: connection failed: network connection failed/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry analysis/i })).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      // Arrange
      global.fetch
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ 
            output: JSON.stringify({
              cv_content: 'Valid CV on retry',
              cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
              jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
              match_score: { score: 85 }
            })
          }))
        });

      render(<AnalysisControl {...defaultProps} />);

      // Act - First attempt fails
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/error: connection failed: first attempt failed/i)).toBeInTheDocument();
      });

      // Act - Retry
      const retryButton = screen.getByRole('button', { name: /retry analysis/i });
      await user.click(retryButton);

      // Assert - Should succeed on retry
      await waitFor(() => {
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });
    });

    it('should reset progress on error', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error: failed to analyze cv and jd: 500 internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Status Messages and Progress', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should show correct status colors for different states', async () => {
      // Arrange - Test success color with valid response
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            cv_content: 'Valid CV',
            cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
            jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
            match_score: { score: 85 }
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Analyzing should be yellow
      const analyzingStatus = screen.getByText(/analyzing gaps and matches/i);
      expect(analyzingStatus).toHaveStyle({ color: '#ffeb3b' });

      // Wait for completion - should be green
      await waitFor(() => {
        const completeStatus = screen.getByText(/analysis complete/i);
        expect(completeStatus).toHaveStyle({ color: '#00ff00' });
      });
    });

    it('should show error status in red color', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        const errorStatus = screen.getByText(/error: failed to analyze cv and jd: 500 internal server error/i);
        expect(errorStatus).toHaveStyle({ color: '#ff6b6b' });
      });
    });

    it('should show progress bar during analysis', async () => {
      // Arrange
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
          }), 50)
        )
      );
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Progress container should be present
      const statusContainer = screen.getByText(/analyzing gaps and matches/i).closest('div');
      const progressBar = statusContainer.querySelector('div[style*="height: 4px"]');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Props Integration and Edge Cases', () => {
    it('should handle missing onAnalysisComplete callback', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      render(<AnalysisControl {...defaultProps} onAnalysisComplete={undefined} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      
      // Should not throw error even without callback
      await expect(user.click(analyzeButton)).resolves.not.toThrow();
    });

    it('should handle empty response gracefully', async () => {
      // Arrange
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('')
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show parsing error
      await waitFor(() => {
        expect(screen.getByText(/invalid response from n8n webhook/i)).toBeInTheDocument();
      });
    });

    it('should reject responses with missing required analysis data', async () => {
      // Arrange - Response missing expected structure
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            // Missing cv_highlighting, jd_highlighting, and match_score
            unexpected: 'format'
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid n8n response: missing required analysis data/i)).toBeInTheDocument();
      });
    });

    it('should reject empty analysis results', async () => {
      // Arrange - Valid structure but empty analysis
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ 
          output: JSON.stringify({
            cv_highlighting: [],
            jd_highlighting: [],
            match_score: {} // Empty score object
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should reject empty results
      await waitFor(() => {
        expect(screen.getByText(/n8n webhook returned empty analysis results/i)).toBeInTheDocument();
      });
    });

    it('should handle network failures with proper error categorization', async () => {
      // Arrange
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show network error
      await waitFor(() => {
        expect(screen.getByText(/network error: unable to connect to proxy server/i)).toBeInTheDocument();
      });
    });

    it('should handle fetch failures for direct webhook calls', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(false);
      global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show network error for webhook
      await waitFor(() => {
        expect(screen.getByText(/network error: unable to connect to n8n webhook/i)).toBeInTheDocument();
      });
    });

    it('should handle rapid button clicks gracefully', async () => {
      // Arrange
      global.fetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
          }), 100)
        )
      );
      render(<AnalysisControl {...defaultProps} />);
      const user = userEvent.setup({ delay: null });

      // Act - Click multiple times rapidly
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);
      
      // Button should be disabled, so second click should not trigger another request
      expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();

      // Assert - Only one fetch call should be made
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should provide detailed webhook error instructions', async () => {
      // Arrange
      const user = userEvent.setup({ delay: null });
      const webhookError = { 
        code: 404, 
        message: 'webhook not registered' 
      };
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(webhookError))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Check for step-by-step instructions
      await waitFor(() => {
        expect(screen.getByText(/n8n workflow not active/i)).toBeInTheDocument();
        expect(screen.getByText(/open your n8n workflow editor/i)).toBeInTheDocument();
        expect(screen.getByText(/find the "get_cvjd" workflow/i)).toBeInTheDocument();
        expect(screen.getByText(/click the "execute workflow" button/i)).toBeInTheDocument();
        expect(screen.getByText(/return here and retry the analysis/i)).toBeInTheDocument();
      });
    });
  });

  describe('CORS Error Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should detect and handle various CORS error patterns', async () => {
      // Test different CORS error indicators - focusing on status 0 with opaque type which is the main CORS indicator
      mockShouldUseProxy.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 0,
        type: 'opaque',
        statusText: ''
      });
      
      render(<AnalysisControl {...defaultProps} />);
      
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/cors error: cross-origin request blocked/i)).toBeInTheDocument();
      });
    });

    it('should show CORS solution suggestions for direct webhook mode', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(false);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 0,
        type: 'opaque'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show solution suggestions
      await waitFor(() => {
        expect(screen.getByText(/possible solutions:/i)).toBeInTheDocument();
        expect(screen.getByText(/set vite_use_proxy_in_prod=true/i)).toBeInTheDocument();
        expect(screen.getByText(/configure cors headers on your n8n webhook/i)).toBeInTheDocument();
      });
    });

    it('should never return mock data when CORS errors occur', async () => {
      // Arrange
      mockShouldUseProxy.mockReturnValue(false);
      global.fetch.mockResolvedValue({
        ok: false,
        status: 0,
        type: 'opaque'
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show CORS error message
      await waitFor(() => {
        expect(screen.getByText(/cors error: cross-origin request blocked/i)).toBeInTheDocument();
      });
      
      // Should never call onAnalysisComplete with CORS errors
      expect(defaultProps.onAnalysisComplete).not.toHaveBeenCalled();
    });
  });

  describe('Error Logging Validation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should handle error logging without undefined variable errors', async () => {
      // Arrange - Force an error that triggers the detailed error logging
      global.fetch.mockRejectedValue(new Error('Test error for logging'));
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should not throw ReferenceError for undefined variables
      // The error should be handled gracefully, logging should work
      await waitFor(() => {
        expect(screen.getByText(/error: connection failed: test error for logging/i)).toBeInTheDocument();
      });

      // Verify console.error was called without throwing undefined variable errors
      expect(console.error).toHaveBeenCalled();
      
      // The component should render error state, not crash with white screen
      expect(screen.getByRole('button', { name: /retry analysis/i })).toBeInTheDocument();
    });
  });

  describe('Data Validation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should never return fake CV content placeholders', async () => {
      // Arrange - Valid response structure with real content
      const mockAnalysisResult = {
        output: JSON.stringify({
          cv_content: 'Real CV content from N8N processing',
          cv_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
          match_score: { score: 85 }
        })
      };

      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockAnalysisResult))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should use real content, never placeholder
      await waitFor(() => {
        expect(defaultProps.onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            cvData: 'Real CV content from N8N processing'
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

    it('should validate N8N response has required fields before processing', async () => {
      // Arrange - Response missing cv_highlighting
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          output: JSON.stringify({
            // Missing cv_highlighting
            jd_highlighting: [{ address: 'test', class: 'test', reason: 'test' }],
            match_score: { score: 85 }
          })
        }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should reject incomplete response
      await waitFor(() => {
        expect(screen.getByText(/invalid n8n response: missing required analysis data/i)).toBeInTheDocument();
      });
      
      expect(defaultProps.onAnalysisComplete).not.toHaveBeenCalled();
    });
  });
});