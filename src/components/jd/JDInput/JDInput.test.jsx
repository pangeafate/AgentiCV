/**
 * JDInput Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * 
 * Test Coverage Areas:
 * - Component rendering and UI states
 * - Text input and character counting
 * - Session storage persistence
 * - Input validation (minimum character requirements)
 * - Button interactions (Sample JD, Clear)
 * - Callback integration with parent component
 * - Terminal theme styling
 * - Edge cases and accessibility
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, createMockJobDescription } from '@/test';
import JDInput from './JDInput';

describe('JDInput Component', () => {
  const defaultProps = {
    onJDReady: jest.fn(),
    sessionId: 'test-session-123'
  };

  const testUtils = setupTest({ useFakeTimers: false, mockStorage: true });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear sessionStorage
    testUtils.sessionStorage.clear();
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('Component Rendering', () => {
    it('should render job description input with correct labels', () => {
      // Arrange & Act
      render(<JDInput {...defaultProps} />);
      
      // Assert - Check header and input elements
      expect(screen.getByText('Job Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/paste the job description here/i)).toBeInTheDocument();
      
      // Assert - Check action buttons
      expect(screen.getByRole('button', { name: /sample jd/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should display character count with minimum requirement', () => {
      // Arrange & Act
      render(<JDInput {...defaultProps} />);
      
      // Assert - Check character count display
      expect(screen.getByText(/0 \/ 100 characters/i)).toBeInTheDocument();
    });

    it('should apply terminal theme styling', () => {
      // Arrange & Act
      const { container } = render(<JDInput {...defaultProps} />);
      
      // Assert - Check container styling
      const containerDiv = container.querySelector('.jd-input-container');
      expect(containerDiv).toHaveStyle({
        backgroundColor: '#0a0a0a',
        border: '1px solid #00ff00',
        fontFamily: '"JetBrains Mono", monospace'
      });
    });

    it('should have proper textarea styling and attributes', () => {
      // Arrange & Act
      render(<JDInput {...defaultProps} />);
      
      // Assert - Check textarea attributes and styling
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(textarea).toHaveAttribute('minHeight', '300px');
      expect(textarea).toHaveStyle({
        backgroundColor: '#1a1a1a',
        color: '#00ff00',
        border: '1px solid #00ff00'
      });
    });
  });

  describe('Text Input and Character Counting', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should accept text input and update character count', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const testText = 'Looking for a React developer with 5+ years of experience.';

      // Act
      await user.type(textarea, testText);

      // Assert
      expect(textarea).toHaveValue(testText);
      expect(screen.getByText(`${testText.length} / 100 characters`)).toBeInTheDocument();
    });

    it('should update character count in real-time as user types', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act - Type incrementally
      await user.type(textarea, 'Test');
      
      // Assert - Check intermediate count
      expect(screen.getByText('4 / 100 characters')).toBeInTheDocument();

      // Act - Type more
      await user.type(textarea, ' job');
      
      // Assert - Check updated count
      expect(screen.getByText('8 / 100 characters')).toBeInTheDocument();
    });

    it('should show invalid state when below minimum characters', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const shortText = 'Short JD'; // Less than 100 characters

      // Act
      await user.type(textarea, shortText);

      // Assert - Character count should be red/invalid color
      const charCount = screen.getByText(`${shortText.length} / 100 characters`);
      expect(charCount).toHaveStyle({ color: '#ff6b6b' });
      
      // Assert - No ready indicator
      expect(screen.queryByText(/✓ Ready/i)).not.toBeInTheDocument();
    });

    it('should show valid state when meeting minimum character requirement', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const validText = 'We are seeking a Senior Software Engineer to join our growing team. The ideal candidate should have strong experience in React, Node.js and modern web technologies. You will be responsible for building scalable applications and mentoring junior developers.';

      // Act
      await user.type(textarea, validText);

      // Assert - Character count should be green/valid color
      const charCount = screen.getByText(`${validText.length} / 100 characters`);
      expect(charCount).toHaveStyle({ color: '#00ff00' });
      
      // Assert - Ready indicator should appear
      expect(screen.getByText(/✓ Ready/i)).toBeInTheDocument();
    });

    it('should call onJDReady with correct validation status as user types', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act - Type short text (invalid)
      const shortText = 'Short';
      await user.type(textarea, shortText);

      // Assert - Should be called with invalid status
      expect(defaultProps.onJDReady).toHaveBeenCalledWith(shortText, false);

      // Act - Type more to make it valid
      const additionalText = ' text to make this job description long enough to meet the minimum character requirement for processing';
      await user.type(textarea, additionalText);

      // Assert - Should be called with valid status
      const fullText = shortText + additionalText;
      expect(defaultProps.onJDReady).toHaveBeenCalledWith(fullText, true);
    });
  });

  describe('Session Storage Persistence', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should save input to session storage as user types', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const testText = 'Test job description for session storage';

      // Act
      await user.type(textarea, testText);

      // Assert
      expect(testUtils.sessionStorage.setItem).toHaveBeenCalledWith(
        `jd_${defaultProps.sessionId}`,
        testText
      );
    });

    it('should restore saved input from session storage on mount', () => {
      // Arrange
      const savedText = 'Previously saved job description content that meets minimum requirements for validation';
      testUtils.sessionStorage.getItem.mockReturnValue(savedText);

      // Act
      render(<JDInput {...defaultProps} />);

      // Assert
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(textarea).toHaveValue(savedText);
      expect(screen.getByText(`${savedText.length} / 100 characters`)).toBeInTheDocument();
      
      // Assert - onJDReady should be called with restored content
      expect(defaultProps.onJDReady).toHaveBeenCalledWith(savedText, true);
    });

    it('should handle empty/null session storage gracefully', () => {
      // Arrange
      testUtils.sessionStorage.getItem.mockReturnValue(null);

      // Act & Assert - Should not throw error
      expect(() => render(<JDInput {...defaultProps} />)).not.toThrow();
      
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(textarea).toHaveValue('');
    });

    it('should use session ID in storage key', async () => {
      // Arrange
      const customSessionId = 'custom-session-456';
      render(<JDInput {...defaultProps} sessionId={customSessionId} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act
      const user = userEvent.setup({ delay: null });
      await user.type(textarea, 'Test');

      // Assert - Should use custom session ID in storage key
      expect(testUtils.sessionStorage.setItem).toHaveBeenCalledWith(
        `jd_${customSessionId}`,
        'Test'
      );
    });
  });

  describe('Sample JD Functionality', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should load sample job description when Sample JD button is clicked', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });

      // Act
      await user.click(sampleButton);

      // Assert - Check that sample text is loaded
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(textarea.value).toContain('Senior Software Engineer');
      expect(textarea.value).toContain('Python, JavaScript, and React');
      expect(textarea.value).toContain('AWS, Azure, or GCP');
      
      // Assert - Should be long enough to be valid
      expect(textarea.value.length).toBeGreaterThan(100);
      expect(screen.getByText(/✓ Ready/i)).toBeInTheDocument();
    });

    it('should save sample JD to session storage', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });

      // Act
      await user.click(sampleButton);

      // Assert
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(testUtils.sessionStorage.setItem).toHaveBeenCalledWith(
        `jd_${defaultProps.sessionId}`,
        textarea.value
      );
    });

    it('should call onJDReady when sample JD is loaded', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });

      // Act
      await user.click(sampleButton);

      // Assert
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      expect(defaultProps.onJDReady).toHaveBeenCalledWith(textarea.value, true);
    });

    it('should replace existing text with sample JD', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act - Type some text first
      await user.type(textarea, 'Some existing text');
      expect(textarea).toHaveValue('Some existing text');

      // Act - Load sample JD
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });
      await user.click(sampleButton);

      // Assert - Should replace, not append
      expect(textarea.value).not.toContain('Some existing text');
      expect(textarea.value).toContain('Senior Software Engineer');
    });
  });

  describe('Clear Functionality', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should clear text when Clear button is clicked', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const clearButton = screen.getByRole('button', { name: /clear/i });

      // Act - Type some text first
      await user.type(textarea, 'Text to be cleared');
      expect(textarea).toHaveValue('Text to be cleared');

      // Act - Click clear
      await user.click(clearButton);

      // Assert
      expect(textarea).toHaveValue('');
      expect(screen.getByText('0 / 100 characters')).toBeInTheDocument();
    });

    it('should remove item from session storage when cleared', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const clearButton = screen.getByRole('button', { name: /clear/i });

      // Act - Type text and then clear
      await user.type(textarea, 'Test text');
      await user.click(clearButton);

      // Assert
      expect(testUtils.sessionStorage.removeItem).toHaveBeenCalledWith(
        `jd_${defaultProps.sessionId}`
      );
    });

    it('should call onJDReady with empty state when cleared', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const clearButton = screen.getByRole('button', { name: /clear/i });

      // Act - Type text and then clear
      await user.type(textarea, 'Test text');
      jest.clearAllMocks(); // Clear previous calls
      
      await user.click(clearButton);

      // Assert
      expect(defaultProps.onJDReady).toHaveBeenCalledWith('', false);
    });

    it('should remove ready indicator when cleared', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      // Act - Load sample (which is valid) then clear
      await user.click(sampleButton);
      expect(screen.getByText(/✓ Ready/i)).toBeInTheDocument();

      await user.click(clearButton);

      // Assert
      expect(screen.queryByText(/✓ Ready/i)).not.toBeInTheDocument();
    });
  });

  describe('Button Styling and Accessibility', () => {
    it('should have proper button styling', () => {
      // Arrange & Act
      render(<JDInput {...defaultProps} />);

      // Assert - Check Sample JD button styling
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });
      expect(sampleButton).toHaveStyle({
        backgroundColor: 'transparent',
        color: '#00ff00',
        border: '1px solid #00ff00'
      });

      // Assert - Check Clear button styling
      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toHaveStyle({
        backgroundColor: 'transparent',
        color: '#00ff00',
        border: '1px solid #00ff00'
      });
    });

    it('should have accessible button labels', () => {
      // Arrange & Act
      render(<JDInput {...defaultProps} />);

      // Assert
      expect(screen.getByRole('button', { name: /sample jd/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should have focusable elements for keyboard navigation', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);

      // Assert - Elements should be focusable
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      expect(textarea).not.toHaveAttribute('tabindex', '-1');
      expect(sampleButton).not.toHaveAttribute('tabindex', '-1');
      expect(clearButton).not.toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should handle missing onJDReady callback gracefully', async () => {
      // Arrange - No onJDReady callback
      render(<JDInput sessionId={defaultProps.sessionId} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act & Assert - Should not throw error
      await expect(user.type(textarea, 'Test')).resolves.not.toThrow();
    });

    it('should handle very long text input', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const veryLongText = 'A'.repeat(10000); // Very long text

      // Act
      await user.clear(textarea);
      await user.type(textarea, veryLongText);

      // Assert - Should handle long text without errors
      expect(textarea).toHaveValue(veryLongText);
      expect(screen.getByText(`${veryLongText.length} / 100 characters`)).toBeInTheDocument();
    });

    it('should handle whitespace-only input correctly', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act - Type only whitespace (spaces and tabs)
      await user.type(textarea, '   \t   \n   ');

      // Assert - Should treat as invalid (character count includes whitespace)
      expect(screen.getByText('9 / 100 characters')).toBeInTheDocument();
      expect(defaultProps.onJDReady).toHaveBeenCalledWith('   \t   \n   ', false);
    });

    it('should handle rapid successive operations', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);
      const sampleButton = screen.getByRole('button', { name: /sample jd/i });
      const clearButton = screen.getByRole('button', { name: /clear/i });

      // Act - Perform rapid operations
      await user.click(sampleButton);
      await user.click(clearButton);
      await user.type(textarea, 'Quick text');
      await user.click(sampleButton);

      // Assert - Final state should be sample JD
      expect(textarea.value).toContain('Senior Software Engineer');
      expect(screen.getByText(/✓ Ready/i)).toBeInTheDocument();
    });

    it('should maintain state consistency during session ID changes', () => {
      // Arrange - Initial render with one session ID
      const { rerender } = render(<JDInput {...defaultProps} sessionId="session-1" />);

      // Act - Rerender with different session ID  
      rerender(<JDInput {...defaultProps} sessionId="session-2" />);

      // Assert - Should check different session storage key
      expect(testUtils.sessionStorage.getItem).toHaveBeenCalledWith('jd_session-2');
    });
  });

  describe('Character Count Color Coding', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should show red character count when below minimum', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act
      await user.type(textarea, 'Short text'); // Less than 100 chars

      // Assert
      const charCount = screen.getByText('10 / 100 characters');
      expect(charCount).toHaveStyle({ color: '#ff6b6b' });
    });

    it('should show green character count when at or above minimum', async () => {
      // Arrange
      render(<JDInput {...defaultProps} />);
      const textarea = screen.getByPlaceholderText(/paste the job description here/i);

      // Act
      const longText = 'This is a job description that is long enough to meet the minimum character requirement of 100 characters for validation purposes.';
      await user.type(textarea, longText);

      // Assert
      const charCount = screen.getByText(`${longText.length} / 100 characters`);
      expect(charCount).toHaveStyle({ color: '#00ff00' });
    });
  });
});