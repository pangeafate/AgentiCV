/**
 * AnalysisControl Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, N8NMockFactory } from '@/test';
import AnalysisControl from './AnalysisControl';

// Mock fetch globally
global.fetch = jest.fn();

const { getWrapper } = setupTest();

describe('AnalysisControl Component', () => {
  const mockProps = {
    cvReady: true,
    jdReady: true,
    sessionId: 'test-session-123',
    cvUrl: 'https://mock-storage.com/cv.pdf',
    jobDescription: 'Senior Developer position...',
    onAnalysisComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set environment to development by default
    global.importMetaEnv = { PROD: false };
  });

  describe('Component Rendering', () => {
    it('should render analyze button when both CV and JD are ready', () => {
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should disable button when CV is not ready', () => {
      render(<AnalysisControl {...mockProps} cvReady={false} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      expect(button).toBeDisabled();
    });

    it('should disable button when JD is not ready', () => {
      render(<AnalysisControl {...mockProps} jdReady={false} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      expect(button).toBeDisabled();
    });

    it('should show initial ready status', () => {
      render(<AnalysisControl {...mockProps} />);
      
      expect(screen.getByText('Ready to analyze')).toBeInTheDocument();
    });
  });

  describe('Analysis Process', () => {
    it('should show analyzing status during analysis', async () => {
      const user = userEvent.setup();
      
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      expect(screen.getByText('ANALYZING...')).toBeInTheDocument();
      expect(screen.getByText('Analyzing gaps and matches...')).toBeInTheDocument();
    });

    it('should show progress bar during analysis', async () => {
      const user = userEvent.setup();
      
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      const progressBar = screen.getByText('Analyzing gaps and matches...').parentElement;
      expect(progressBar).toBeInTheDocument();
    });

    it('should handle successful analysis', async () => {
      const user = userEvent.setup();
      
      const mockResponse = {
        output: JSON.stringify({
          cv_highlighting: [{ address: 'skills[0]', class: 'highlight-match', reason: 'Match' }],
          jd_highlighting: [{ address: 'required_skills[0]', class: 'highlight-match', reason: 'Match' }],
          match_score: { overall: 85, skills: 90, experience: 80 }
        })
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(mockProps.onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            analysis: expect.objectContaining({
              cv_highlighting: expect.any(Array),
              jd_highlighting: expect.any(Array),
              match_score: expect.any(Object)
            })
          })
        );
      });
      
      expect(screen.getByText('Analysis complete!')).toBeInTheDocument();
    });

    it('should use correct API URL in production', async () => {
      const user = userEvent.setup();
      global.importMetaEnv = { 
        PROD: true,
        VITE_N8N_COMPLETE_ANALYSIS_URL: 'https://prod.n8n.com/webhook/analyze'
      };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      expect(fetch).toHaveBeenCalledWith(
        'https://prod.n8n.com/webhook/analyze',
        expect.objectContaining({
          method: 'POST',
          mode: 'cors'
        })
      );
    });

    it('should use localhost API URL in development', async () => {
      const user = userEvent.setup();
      global.importMetaEnv = { PROD: false };
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ output: '{}' }))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3002/api/n8n/analyze-complete',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const user = userEvent.setup();
      
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
      });
    });

    it('should handle CORS errors', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: false,
        type: 'opaque',
        status: 0
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/CORS error/)).toBeInTheDocument();
      });
    });

    it('should handle N8N webhook not active error', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          code: 404,
          message: 'webhook not registered'
        }))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Workflow Not Active')).toBeInTheDocument();
        expect(screen.getByText(/N8N analysis workflow needs to be activated/)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      const user = userEvent.setup();
      
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry Analysis/i })).toBeInTheDocument();
      });
    });

    it('should retry analysis when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      // First attempt fails
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Second attempt succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          output: JSON.stringify({
            cv_highlighting: [],
            jd_highlighting: [],
            match_score: { overall: 75 }
          })
        }))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry Analysis/i })).toBeInTheDocument();
      });
      
      const retryButton = screen.getByRole('button', { name: /Retry Analysis/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(mockProps.onAnalysisComplete).toHaveBeenCalled();
        expect(screen.getByText('Analysis complete!')).toBeInTheDocument();
      });
    });

    it('should show webhook activation instructions for webhook errors', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          code: 404,
          message: 'webhook not registered'
        }))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Open your N8N workflow editor/)).toBeInTheDocument();
        expect(screen.getByText(/Find the "get_cvjd" workflow/)).toBeInTheDocument();
        expect(screen.getByText(/Click the "Execute Workflow" button/)).toBeInTheDocument();
      });
    });
  });

  describe('Response Parsing', () => {
    it('should parse wrapped array responses', async () => {
      const user = userEvent.setup();
      
      const mockResponse = [{
        output: JSON.stringify({
          cv_highlighting: [],
          jd_highlighting: [],
          match_score: { overall: 80 }
        })
      }];
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(mockProps.onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            analysis: expect.objectContaining({
              match_score: expect.objectContaining({ overall: 80 })
            })
          })
        );
      });
    });

    it('should handle invalid JSON responses', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('invalid json')
      });
      
      render(<AnalysisControl {...mockProps} />);
      
      const button = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(button);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid response from N8N webhook/)).toBeInTheDocument();
      });
    });
  });
});