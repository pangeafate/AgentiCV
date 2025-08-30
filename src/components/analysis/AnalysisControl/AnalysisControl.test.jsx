/**
 * AnalysisControl Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
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

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, TestDataFactory } from '../../../../test';
import AnalysisControl from './AnalysisControl';

// Mock import.meta.env
const mockEnv = {
  PROD: false,
  DEV: true,
  VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://mock-n8n.com/webhook/analyze'
};

describe('AnalysisControl Component', () => {
  const defaultProps = {
    cvReady: true,
    jdReady: true,
    sessionId: 'test-session-123',
    cvUrl: 'https://storage.supabase.co/test-cv.pdf',
    jobDescription: 'Senior React Developer position with 5+ years experience.',
    onAnalysisComplete: jest.fn()
  };

  const testUtils = setupTest({ useFakeTimers: false, mockFetch: true });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock import.meta.env
    Object.defineProperty(globalThis, 'import', {
      value: { meta: { env: mockEnv } },
      configurable: true
    });
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('Component Rendering', () => {
    it('should render analyze button with correct styling', () => {
      // Arrange & Act
      render(<AnalysisControl {...defaultProps} />);
      
      // Assert - Check button presence and styling
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      expect(analyzeButton).toBeInTheDocument();
      expect(analyzeButton).toHaveStyle({
        backgroundColor: '#00ff00',
        color: '#000',
        fontFamily: '"JetBrains Mono", monospace'
      });
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

    it('should perform complete analysis workflow', async () => {
      // Arrange
      const mockAnalysisResult = {
        output: JSON.stringify({
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
          cvData: 'CV content processed',
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
        expect(screen.getByText(/analysis complete/i)).toBeInTheDocument();
      });
    });

    it('should handle array response format from N8N', async () => {
      // Arrange - N8N sometimes returns array format
      const mockArrayResponse = [{
        output: JSON.stringify({
          cv_highlighting: [],
          jd_highlighting: [],
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
          cv_highlighting: [],
          jd_highlighting: [],
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

    it('should use development API URL in development mode', async () => {
      // Arrange
      mockEnv.PROD = false;
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should call development proxy
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

    it('should use production API URL in production mode', async () => {
      // Arrange
      mockEnv.PROD = true;
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should call production webhook
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          mockEnv.VITE_N8N_COMPLETE_ANALYSIS_URL,
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
        expect(screen.getByText(/workflow not active/i)).toBeInTheDocument();
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

    it('should handle CORS errors in production', async () => {
      // Arrange
      mockEnv.PROD = true;
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
        expect(screen.getByText(/cors error/i)).toBeInTheDocument();
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
        expect(screen.getByText(/error: network connection failed/i)).toBeInTheDocument();
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
          text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
        });

      render(<AnalysisControl {...defaultProps} />);

      // Act - First attempt fails
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/error: first attempt failed/i)).toBeInTheDocument();
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
        status: 500
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error:/)).toBeInTheDocument();
      });
    });
  });

  describe('Status Messages and Progress', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should show correct status colors for different states', async () => {
      // Arrange - Test success color
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
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
        status: 500
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert
      await waitFor(() => {
        const errorStatus = screen.getByText(/error:/);
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

    it('should handle malformed analysis response', async () => {
      // Arrange - Response missing expected structure
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ unexpected: 'format' }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should handle gracefully
      await waitFor(() => {
        expect(screen.getByText(/unable to parse response data/i)).toBeInTheDocument();
      });
    });

    it('should use fallback N8N URL when env variable is missing', async () => {
      // Arrange
      mockEnv.PROD = true;
      mockEnv.VITE_N8N_COMPLETE_ANALYSIS_URL = undefined;
      global.fetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      render(<AnalysisControl {...defaultProps} />);

      // Act
      const user = userEvent.setup({ delay: null });
      const analyzeButton = screen.getByRole('button', { name: /analyse/i });
      await user.click(analyzeButton);

      // Assert - Should use fallback URL
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'https://n8n.lakestrom.com/webhook/get_cvjd',
          expect.any(Object)
        );
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
        expect(screen.getByText(/open your n8n workflow editor/i)).toBeInTheDocument();
        expect(screen.getByText(/find the "get_cvjd" workflow/i)).toBeInTheDocument();
        expect(screen.getByText(/click the "execute workflow" button/i)).toBeInTheDocument();
        expect(screen.getByText(/return here and retry the analysis/i)).toBeInTheDocument();
      });
    });
  });
});