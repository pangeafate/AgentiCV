/**
 * App Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest } from '@/test';
import App from './App';

// Mock child components
jest.mock('./components/cv/CVUploader/CVUploader', () => {
  return function MockCVUploader({ onStatusChange, onUploadComplete }) {
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
      </div>
    );
  };
});

jest.mock('./components/jd/JDInput/JDInput', () => {
  return function MockJDInput({ onJDReady }) {
    return (
      <div data-testid="jd-input">
        <button onClick={() => onJDReady('Job description text', true)}>
          Add JD
        </button>
      </div>
    );
  };
});

jest.mock('./components/analysis/AnalysisControl/AnalysisControl', () => {
  return function MockAnalysisControl({ onAnalysisComplete }) {
    return (
      <div data-testid="analysis-control">
        <button onClick={() => {
          onAnalysisComplete({
            cvData: 'CV content',
            jdData: 'JD content',
            analysis: {
              cv_highlighting: [],
              jd_highlighting: [],
              match_score: { overall: 75 }
            }
          });
        }}>
          Analyze
        </button>
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

const { getWrapper } = setupTest();

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('should render the terminal interface', () => {
      render(<App />);
      
      expect(screen.getByText('AgenticV Terminal - CV Upload System')).toBeInTheDocument();
      expect(screen.getByText(/Welcome to AgenticV Terminal/)).toBeInTheDocument();
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

    it('should show terminal output messages', async () => {
      render(<App />);
      
      // Fast-forward through the typing effect
      jest.advanceTimersByTime(3200); // 4 messages * 800ms
      
      await waitFor(() => {
        expect(screen.getByText('Welcome to AgenticV Terminal v1.0.0')).toBeInTheDocument();
        expect(screen.getByText('System ready. Upload your CV to begin analysis.')).toBeInTheDocument();
      });
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
  });
});