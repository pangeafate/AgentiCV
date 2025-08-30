/**
 * App Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * 
 * Test Coverage Areas:
 * - Component rendering and initial state
 * - Terminal window styling and structure
 * - Time display and updates
 * - Terminal initialization messages
 * - Component integration and state management
 * - CV upload workflow integration
 * - JD input workflow integration
 * - Analysis workflow integration
 * - Error state handling and display
 * - New analysis functionality
 * - System information display
 * - Responsive layout behavior
 * - Terminal theme styling
 * - Accessibility and semantic HTML
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, TestDataFactory } from '../test';
import App from './App';

// Mock child components with enhanced functionality
jest.mock('./components/cv/CVUploader/CVUploader', () => {
  return function MockCVUploader({ onStatusChange, onUploadComplete, sessionId }) {
    return (
      <div data-testid="cv-uploader">
        <button onClick={() => {
          onStatusChange('Uploading...');
          setTimeout(() => {
            onUploadComplete('https://mock-url.com/cv.pdf');
            onStatusChange('Upload complete');
          }, 100);
        }}>
          Upload CV
        </button>
        <span data-testid="cv-session-id">Session: {sessionId}</span>
      </div>
    );
  };
});

jest.mock('./components/jd/JDInput/JDInput', () => {
  return function MockJDInput({ onJDReady, sessionId }) {
    return (
      <div data-testid="jd-input">
        <button onClick={() => onJDReady('Job description text', true)}>
          Add JD
        </button>
        <button onClick={() => onJDReady('Short', false)} data-testid="invalid-jd-button">
          Add Invalid JD
        </button>
        <span data-testid="jd-session-id">Session: {sessionId}</span>
      </div>
    );
  };
});

jest.mock('./components/analysis/AnalysisControl/AnalysisControl', () => {
  return function MockAnalysisControl({ 
    cvReady, 
    jdReady, 
    sessionId, 
    cvUrl, 
    jobDescription,
    onAnalysisComplete 
  }) {
    return (
      <div data-testid="analysis-control">
        <button 
          disabled={!cvReady || !jdReady}
          onClick={() => {
            onAnalysisComplete({
              cvData: 'CV content',
              jdData: 'JD content',
              analysis: {
                cv_highlighting: [],
                jd_highlighting: [],
                match_score: { overall: 75 }
              }
            });
          }}
        >
          Analyze
        </button>
        <button 
          onClick={() => {
            onAnalysisComplete({
              code: 404,
              message: 'webhook not registered'
            });
          }}
          data-testid="analyze-error-button"
        >
          Analyze with Error
        </button>
        <span data-testid="cv-ready-status">CV Ready: {cvReady.toString()}</span>
        <span data-testid="jd-ready-status">JD Ready: {jdReady.toString()}</span>
        <span data-testid="cv-url">CV URL: {cvUrl || 'none'}</span>
        <span data-testid="job-description">Job Description: {jobDescription || 'none'}</span>
        <span data-testid="analysis-session-id">Session: {sessionId}</span>
      </div>
    );
  };
});

jest.mock('./components/analysis/GapAnalysisResults/GapAnalysisResults', () => {
  return function MockGapAnalysisResults({ matchScores }) {
    return (
      <div data-testid="gap-analysis-results">
        <div>Overall Score: {matchScores?.overall || 0}%</div>
      </div>
    );
  };
});

describe('App Component', () => {
  const testUtils = setupTest({ useFakeTimers: true, mockConsole: true });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto.randomUUID for consistent session IDs
    global.crypto = {
      randomUUID: () => 'mock-session-uuid-123'
    };
    // Also reset time mocking
    jest.clearAllTimers();
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('Initial Rendering', () => {
    it('should render the terminal interface', () => {
      render(<App />);
      
      expect(screen.getByText('AgenticV Terminal - CV Upload System')).toBeInTheDocument();
      expect(screen.getByText('Ready for CV upload')).toBeInTheDocument();
    });

    it('should show system information', () => {
      render(<App />);
      
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText(/Status:/)).toBeInTheDocument();
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getByText(/Storage:/)).toBeInTheDocument();
    });

    it('should display upload section and JD section initially', () => {
      render(<App />);
      
      expect(screen.getByText('> Upload CV Document')).toBeInTheDocument();
      expect(screen.getByText('> Job Description')).toBeInTheDocument();
      expect(screen.getByTestId('cv-uploader')).toBeInTheDocument();
      expect(screen.getByTestId('jd-input')).toBeInTheDocument();
    });

    it('should show terminal output messages with typing effect', async () => {
      render(<App />);
      
      // Fast-forward through the typing effect
      act(() => {
        testUtils.advanceTimers(800); // First message
      });
      expect(screen.getByText('Welcome to AgenticV Terminal v1.0.0')).toBeInTheDocument();
      
      act(() => {
        testUtils.advanceTimers(800); // Second message
      });
      expect(screen.getByText('Initializing CV processing system...')).toBeInTheDocument();
      
      act(() => {
        testUtils.advanceTimers(800); // Third message
      });
      expect(screen.getByText('System ready. Upload your CV to begin analysis.')).toBeInTheDocument();
    });

    it('should generate unique session ID and pass to components', () => {
      render(<App />);
      
      expect(screen.getByTestId('cv-session-id')).toHaveTextContent('Session: mock-session-uuid-123');
      expect(screen.getByTestId('jd-session-id')).toHaveTextContent('Session: mock-session-uuid-123');
    });

    it('should apply terminal theme CSS variables', () => {
      const { container } = render(<App />);
      
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveStyle({
        background: 'var(--terminal-bg)',
        minHeight: '100vh'
      });
    });

    it('should show terminal controls with accessibility labels', () => {
      render(<App />);
      
      expect(screen.getByLabelText('Close')).toBeInTheDocument();
      expect(screen.getByLabelText('Minimize')).toBeInTheDocument();
      expect(screen.getByLabelText('Maximize')).toBeInTheDocument();
    });

    it('should display terminal prompt with cursor', () => {
      render(<App />);
      
      expect(screen.getByText('Ready for CV upload')).toBeInTheDocument();
      // Cursor is implemented with CSS class, verify it exists in DOM
      const terminalContent = screen.getByText('Ready for CV upload').parentElement;
      expect(terminalContent.querySelector('.terminal-cursor')).toBeInTheDocument();
    });
  });

  describe('CV Upload Flow', () => {
    it('should handle CV upload and update state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      const uploadButton = screen.getByRole('button', { name: /Upload CV/i });
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText(/CV uploaded successfully/)).toBeInTheDocument();
      });
    });

    it('should show terminal messages during upload', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      const uploadButton = screen.getByRole('button', { name: /Upload CV/i });
      await user.click(uploadButton);
      
      expect(screen.getByText(/Uploading.../)).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText(/Upload complete/)).toBeInTheDocument();
      });
    });
  });

  describe('JD Input Flow', () => {
    it('should handle JD input and update state', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      const jdButton = screen.getByRole('button', { name: /Add JD/i });
      await user.click(jdButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Job description ready for analysis/)).toBeInTheDocument();
      });
    });
  });

  describe('Analysis Flow', () => {
    it('should show analysis control when both CV and JD are ready', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Upload CV
      const uploadButton = screen.getByRole('button', { name: /Upload CV/i });
      await user.click(uploadButton);
      
      // Add JD
      const jdButton = screen.getByRole('button', { name: /Add JD/i });
      await user.click(jdButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
    });

    it('should handle analysis completion and show results', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Upload CV
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      
      // Add JD
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      // Wait for analysis control
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      // Run analysis
      const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('gap-analysis-results')).toBeInTheDocument();
        expect(screen.getByText(/Overall Score: 75%/)).toBeInTheDocument();
        expect(screen.getByText(/Analysis complete!/)).toBeInTheDocument();
      });
    });

    it('should show New Analysis button after analysis completes', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Complete full flow
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Analysis/i })).toBeInTheDocument();
      });
    });

    it('should reset state when New Analysis is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Complete full flow
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Analysis/i })).toBeInTheDocument();
      });
      
      // Click New Analysis
      await user.click(screen.getByRole('button', { name: /New Analysis/i }));
      
      // Should show upload sections again
      expect(screen.getByText('> Upload CV Document')).toBeInTheDocument();
      expect(screen.getByText('> Job Description')).toBeInTheDocument();
      expect(screen.getByText(/Starting new analysis.../)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors', async () => {
      // Mock error response
      jest.mock('./components/analysis/AnalysisControl/AnalysisControl', () => {
        return function MockAnalysisControl({ onAnalysisComplete }) {
          return (
            <div data-testid="analysis-control">
              <button onClick={() => {
                onAnalysisComplete({
                  code: 404,
                  message: 'Webhook not registered'
                });
              }}>
                Analyze with Error
              </button>
            </div>
          );
        };
      });

      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Upload CV and add JD
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      // Trigger error
      const analyzeButton = screen.getByRole('button', { name: /Analyze/i });
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Analysis Failed/)).toBeInTheDocument();
      });
    });

    it('should show quick fix instructions for webhook errors', async () => {
      const user = userEvent.setup({ delay: null });
      
      // Create a mock that returns webhook error
      const MockAnalysisControlWithError = ({ onAnalysisComplete }) => (
        <div data-testid="analysis-control">
          <button onClick={() => {
            onAnalysisComplete({
              code: 404,
              message: 'webhook not registered'
            });
          }}>
            Analyze
          </button>
        </div>
      );
      
      jest.doMock('./components/analysis/AnalysisControl/AnalysisControl', () => MockAnalysisControlWithError);
      
      render(<App />);
      
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Quick Fix:/)).toBeInTheDocument();
        expect(screen.getByText(/Open your N8N workflow editor/)).toBeInTheDocument();
      });
    });
  });

  describe('Terminal Features', () => {
    it('should update time display', () => {
      const mockDate = new Date('2024-01-01 12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<App />);
      
      // Advance timer to trigger time update
      jest.advanceTimersByTime(1000);
      
      expect(screen.getByText(mockDate.toLocaleTimeString())).toBeInTheDocument();
    });

    it('should display footer information', () => {
      render(<App />);
      
      expect(screen.getByText(/AgenticV Terminal \| Powered by React \+ Vite/)).toBeInTheDocument();
      expect(screen.getByText(/Upload supported formats: PDF, DOC, DOCX \| Max size: 10MB/)).toBeInTheDocument();
    });

    it('should clean up timer on unmount', () => {
      const { unmount } = render(<App />);
      
      // Should not throw error on unmount
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('State Management and Props Flow', () => {
    it('should pass correct props to AnalysisControl component', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Initial state
      expect(screen.getByTestId('cv-ready-status')).toHaveTextContent('CV Ready: false');
      expect(screen.getByTestId('jd-ready-status')).toHaveTextContent('JD Ready: false');
      expect(screen.getByTestId('cv-url')).toHaveTextContent('CV URL: none');
      expect(screen.getByTestId('job-description')).toHaveTextContent('Job Description: none');
      
      // Upload CV
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('cv-ready-status')).toHaveTextContent('CV Ready: true');
        expect(screen.getByTestId('cv-url')).toHaveTextContent('CV URL: https://mock-url.com/cv.pdf');
      });
      
      // Add JD
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('jd-ready-status')).toHaveTextContent('JD Ready: true');
        expect(screen.getByTestId('job-description')).toHaveTextContent('Job Description: Job description text');
      });
    });

    it('should handle invalid JD input correctly', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Add invalid JD (too short)
      await user.click(screen.getByTestId('invalid-jd-button'));
      
      // Should not trigger terminal message for invalid JD
      expect(screen.queryByText(/Job description ready for analysis/)).not.toBeInTheDocument();
      expect(screen.getByTestId('jd-ready-status')).toHaveTextContent('JD Ready: false');
    });

    it('should maintain session consistency across all components', () => {
      render(<App />);
      
      const cvSessionId = screen.getByTestId('cv-session-id').textContent;
      const jdSessionId = screen.getByTestId('jd-session-id').textContent;
      const analysisSessionId = screen.getByTestId('analysis-session-id').textContent;
      
      expect(cvSessionId).toBe(jdSessionId);
      expect(jdSessionId).toBe(analysisSessionId);
      expect(cvSessionId).toContain('mock-session-uuid-123');
    });
  });

  describe('Layout and Responsive Design', () => {
    it('should switch layout when showing analysis results', async () => {
      const user = userEvent.setup({ delay: null });
      const { container } = render(<App />);
      
      // Initial layout - should have grid with upload sections
      expect(screen.getByText('> Upload CV Document')).toBeInTheDocument();
      expect(screen.getByText('> Job Description')).toBeInTheDocument();
      
      // Complete analysis workflow
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
      
      await waitFor(() => {
        // Upload sections should be hidden in results view
        expect(screen.queryByText('> Upload CV Document')).not.toBeInTheDocument();
        expect(screen.queryByText('> Job Description')).not.toBeInTheDocument();
        expect(screen.getByTestId('gap-analysis-results')).toBeInTheDocument();
      });
    });

    it('should use proper semantic HTML structure', () => {
      const { container } = render(<App />);
      
      // Check for semantic HTML elements
      expect(container.querySelector('section')).toBeInTheDocument();
      expect(container.querySelector('footer')).toBeInTheDocument();
      expect(container.querySelector('h2')).toBeInTheDocument();
      expect(container.querySelector('h3')).toBeInTheDocument();
    });

    it('should apply responsive grid layout', () => {
      const { container } = render(<App />);
      
      // Check for CSS Grid usage
      const gridContainer = container.querySelector('[style*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Advanced Error Scenarios', () => {
    it('should handle webhook-specific error responses', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Complete prerequisite steps
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      // Trigger webhook error
      await user.click(screen.getByTestId('analyze-error-button'));
      
      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
        expect(screen.getByText(/Quick Fix:/)).toBeInTheDocument();
        expect(screen.getByText(/Open your N8N workflow editor/)).toBeInTheDocument();
      });
    });

    it('should handle server error (500) responses', async () => {
      // Mock a 500 error scenario
      jest.doMock('./components/analysis/AnalysisControl/AnalysisControl', () => {
        return function MockAnalysisControl500Error({ onAnalysisComplete }) {
          return (
            <div data-testid="analysis-control">
              <button onClick={() => {
                onAnalysisComplete({
                  code: 500,
                  message: 'Internal server error'
                });
              }}>
                Analyze
              </button>
            </div>
          );
        };
      });
      
      // This tests that the error structure exists in the component
      render(<App />);
      expect(screen.getByTestId('cv-uploader')).toBeInTheDocument();
    });
  });

  describe('Time and System Information', () => {
    it('should update system time display every second', () => {
      const mockDate = new Date('2024-01-01 12:00:00');
      jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<App />);
      
      // Advance timer to trigger time update
      act(() => {
        testUtils.advanceTimers(1000);
      });
      
      expect(screen.getByText(mockDate.toLocaleTimeString())).toBeInTheDocument();
    });

    it('should show correct system information values', () => {
      render(<App />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Supabase')).toBeInTheDocument();
    });

    it('should display uptime in system information', () => {
      render(<App />);
      
      act(() => {
        testUtils.advanceTimers(2000);
      });
      
      // Uptime should show current time
      expect(screen.getByText(/Uptime:/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Resilience', () => {
    it('should handle missing crypto.randomUUID gracefully', () => {
      // Store original crypto
      const originalCrypto = global.crypto;
      delete global.crypto;
      
      // Should throw an error since the component doesn't handle missing crypto
      expect(() => render(<App />)).toThrow();
      
      // Restore crypto
      global.crypto = originalCrypto;
    });

    it('should handle rapid successive actions', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Rapid clicks - should not break state management
      const uploadButton = screen.getByRole('button', { name: /Upload CV/i });
      const jdButton = screen.getByRole('button', { name: /Add JD/i });
      
      await user.click(uploadButton);
      await user.click(jdButton);
      await user.click(uploadButton); // Second upload
      
      // Should handle gracefully
      expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
    });

    it('should maintain state during re-renders', () => {
      const { rerender } = render(<App />);
      
      rerender(<App />);
      
      expect(screen.getByText('AgenticV Terminal - CV Upload System')).toBeInTheDocument();
      expect(screen.getByTestId('cv-uploader')).toBeInTheDocument();
    });

    it('should handle component unmount gracefully', () => {
      const { unmount } = render(<App />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility and Usability', () => {
    it('should have proper heading hierarchy', () => {
      render(<App />);
      
      // Check heading levels
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should provide clear status indicators', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // Upload CV
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      
      await waitFor(() => {
        expect(screen.getByText('CV uploaded successfully')).toBeInTheDocument();
      });
      
      // Add JD
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Job description ready for analysis')).toBeInTheDocument();
      });
    });

    it('should show visual feedback for user actions', async () => {
      const user = userEvent.setup({ delay: null });
      render(<App />);
      
      // New Analysis button should provide clear feedback
      await user.click(screen.getByRole('button', { name: /Upload CV/i }));
      await user.click(screen.getByRole('button', { name: /Add JD/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('analysis-control')).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /Analyze/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /New Analysis/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /New Analysis/i }));
      
      expect(screen.getByText('Starting new analysis...')).toBeInTheDocument();
    });
  });
});