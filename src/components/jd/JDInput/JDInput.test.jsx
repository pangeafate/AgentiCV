/**
 * JDInput Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest } from '@/test';
import JDInput from './JDInput';

const { getWrapper } = setupTest();

describe('JDInput Component', () => {
  const mockProps = {
    onJDReady: jest.fn(),
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render text input mode by default', () => {
      render(<JDInput {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /\[TEXT\]/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Paste job description here/i)).toBeInTheDocument();
    });

    it('should show input mode toggle buttons', () => {
      render(<JDInput {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /\[TEXT\]/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /\[URL\]/i })).toBeInTheDocument();
    });

    it('should display character count', () => {
      render(<JDInput {...mockProps} />);
      
      expect(screen.getByText(/0 \/ 5000 characters/i)).toBeInTheDocument();
    });

    it('should show process button', () => {
      render(<JDInput {...mockProps} />);
      
      expect(screen.getByRole('button', { name: /PROCESS JD/i })).toBeInTheDocument();
    });
  });

  describe('Text Input Mode', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const testText = 'Senior Developer position requiring React and Node.js';
      
      await user.type(textarea, testText);
      
      expect(textarea).toHaveValue(testText);
    });

    it('should update character count as user types', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const testText = 'Test JD';
      
      await user.type(textarea, testText);
      
      expect(screen.getByText(`${testText.length} / 5000 characters`)).toBeInTheDocument();
    });

    it('should enforce 5000 character limit', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const longText = 'a'.repeat(5001);
      
      await user.type(textarea, longText);
      
      expect(textarea.value.length).toBeLessThanOrEqual(5000);
    });

    it('should validate minimum text length', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const shortText = 'Hi';
      
      await user.type(textarea, shortText);
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      expect(screen.getByText(/Job description too short/i)).toBeInTheDocument();
      expect(mockProps.onJDReady).not.toHaveBeenCalled();
    });

    it('should process valid text input', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const validText = 'We are looking for a Senior React Developer with 5+ years of experience in building web applications.';
      
      await user.type(textarea, validText);
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(mockProps.onJDReady).toHaveBeenCalledWith(validText, true);
      });
      
      expect(screen.getByText(/Job description processed successfully/i)).toBeInTheDocument();
    });

    it('should clear error when user starts typing again', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      
      // First, trigger an error
      await user.type(textarea, 'Hi');
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      expect(screen.getByText(/Job description too short/i)).toBeInTheDocument();
      
      // Then type more to clear error
      await user.type(textarea, ' - This is a much longer job description now');
      
      expect(screen.queryByText(/Job description too short/i)).not.toBeInTheDocument();
    });
  });

  describe('URL Input Mode', () => {
    it('should switch to URL input when URL button clicked', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const urlButton = screen.getByRole('button', { name: /\[URL\]/i });
      await user.click(urlButton);
      
      expect(screen.getByPlaceholderText(/Enter job posting URL/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Paste job description here/i)).not.toBeInTheDocument();
    });

    it('should validate URL format', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      // Switch to URL mode
      const urlButton = screen.getByRole('button', { name: /\[URL\]/i });
      await user.click(urlButton);
      
      const urlInput = screen.getByPlaceholderText(/Enter job posting URL/i);
      await user.type(urlInput, 'not-a-valid-url');
      
      const processButton = screen.getByRole('button', { name: /FETCH FROM URL/i });
      await user.click(processButton);
      
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
      expect(mockProps.onJDReady).not.toHaveBeenCalled();
    });

    it('should accept valid URLs', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      // Switch to URL mode
      const urlButton = screen.getByRole('button', { name: /\[URL\]/i });
      await user.click(urlButton);
      
      const urlInput = screen.getByPlaceholderText(/Enter job posting URL/i);
      await user.type(urlInput, 'https://example.com/job/123');
      
      // Mock successful fetch
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('Job description content from URL')
        })
      );
      
      const processButton = screen.getByRole('button', { name: /FETCH FROM URL/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Fetching job description/i)).toBeInTheDocument();
      });
    });

    it('should handle URL fetch errors', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      // Switch to URL mode
      const urlButton = screen.getByRole('button', { name: /\[URL\]/i });
      await user.click(urlButton);
      
      const urlInput = screen.getByPlaceholderText(/Enter job posting URL/i);
      await user.type(urlInput, 'https://example.com/job/404');
      
      // Mock failed fetch
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      const processButton = screen.getByRole('button', { name: /FETCH FROM URL/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch from URL/i)).toBeInTheDocument();
      });
      
      expect(mockProps.onJDReady).not.toHaveBeenCalled();
    });

    it('should switch back to text mode', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      // Switch to URL mode
      const urlButton = screen.getByRole('button', { name: /\[URL\]/i });
      await user.click(urlButton);
      
      expect(screen.getByPlaceholderText(/Enter job posting URL/i)).toBeInTheDocument();
      
      // Switch back to text mode
      const textButton = screen.getByRole('button', { name: /\[TEXT\]/i });
      await user.click(textButton);
      
      expect(screen.getByPlaceholderText(/Paste job description here/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter job posting URL/i)).not.toBeInTheDocument();
    });
  });

  describe('Processing State', () => {
    it('should show processing indicator', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(textarea, 'Valid job description with enough content');
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      
      // Mock a delayed response
      let resolvePromise;
      const delayedPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockProps.onJDReady.mockImplementation(() => delayedPromise);
      
      await user.click(processButton);
      
      expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
      expect(processButton).toBeDisabled();
    });

    it('should disable input during processing', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(textarea, 'Valid job description with enough content');
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      
      // Mock a delayed response
      mockProps.onJDReady.mockImplementation(() => new Promise(() => {}));
      
      await user.click(processButton);
      
      expect(textarea).toBeDisabled();
      expect(processButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('should show success message after processing', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const validText = 'Valid job description with enough content for processing';
      
      await user.type(textarea, validText);
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Job description processed successfully/i)).toBeInTheDocument();
      });
    });

    it('should show checkmark icon on success', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(textarea, 'Valid job description with enough content');
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText('✓')).toBeInTheDocument();
      });
    });

    it('should keep the text input disabled after success', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(textarea, 'Valid job description with enough content');
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Job description processed successfully/i)).toBeInTheDocument();
      });
      
      expect(textarea).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(textarea, '     ');
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      expect(screen.getByText(/Job description too short/i)).toBeInTheDocument();
      expect(mockProps.onJDReady).not.toHaveBeenCalled();
    });

    it('should trim input before validation', async () => {
      const user = userEvent.setup();
      render(<JDInput {...mockProps} />);
      
      const textarea = screen.getByPlaceholderText(/Paste job description here/i);
      const textWithSpaces = '   Valid job description with enough content   ';
      
      await user.type(textarea, textWithSpaces);
      
      const processButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processButton);
      
      await waitFor(() => {
        expect(mockProps.onJDReady).toHaveBeenCalledWith(
          textWithSpaces.trim(),
          true
        );
      });
    });
  });
});