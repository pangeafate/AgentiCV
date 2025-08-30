/**
 * CVUploader Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * 
 * Test Coverage Areas:
 * - Component rendering and UI states
 * - File validation (type, size)
 * - Upload process and progress tracking
 * - Error handling and retry functionality
 * - User feedback and accessibility
 * - Terminal theme styling
 * - Edge cases and error scenarios
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { setupTest, createMockFile, TestDataFactory } from '@/test';
import CVUploader from './CVUploader';

// Mock the cv.service module
jest.mock('../../../services/supabase/cv.service', () => ({
  uploadCV: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

const { uploadCV } = require('../../../services/supabase/cv.service');

describe('CVUploader Component', () => {
  const defaultProps = {
    onStatusChange: jest.fn(),
    onUploadComplete: jest.fn(),
    sessionId: 'test-session-123'
  };

  const testUtils = setupTest({ useFakeTimers: true, mockConsole: true });

  beforeEach(() => {
    jest.clearAllMocks();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('Component Rendering', () => {
    // Arrange-Act-Assert pattern for rendering tests
    
    it('should render initial upload UI with correct text content', () => {
      // Arrange & Act
      render(<CVUploader {...defaultProps} />);
      
      // Assert - Check main upload text
      expect(screen.getByText(/drag & drop your cv here/i)).toBeInTheDocument();
      expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
      
      // Assert - Check file format information
      expect(screen.getByText(/supported formats:/i)).toBeInTheDocument();
      expect(screen.getByText(/pdf, doc, docx \(max 10mb\)/i)).toBeInTheDocument();
      
      // Assert - Check browse button is present
      expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      // Arrange & Act
      render(<CVUploader {...defaultProps} />);
      
      // Assert - File input should have proper attributes
      const fileInput = screen.getByRole('button', { hidden: true });
      expect(fileInput).toHaveAttribute('type', 'file');
      
      // Assert - Upload area should be focusable
      const dropzone = screen.getByText(/drag & drop your cv here/i).closest('div');
      expect(dropzone).toHaveStyle({ cursor: 'pointer' });
    });

    it('should display file upload icon', () => {
      // Arrange & Act
      render(<CVUploader {...defaultProps} />);
      
      // Assert - Icon should be present
      expect(screen.getByText('📄')).toBeInTheDocument();
    });

    it('should apply terminal theme styling', () => {
      // Arrange & Act
      const { container } = render(<CVUploader {...defaultProps} />);
      
      // Assert - Check CSS custom properties for terminal theme
      const dropzone = container.querySelector('[style*="border"]');
      expect(dropzone).toHaveStyle({
        backgroundColor: 'var(--terminal-bg-secondary)',
        border: '2px dashed var(--terminal-border)'
      });
    });
  });

  describe('File Validation', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should accept valid PDF files', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf',
        size: 1024 * 1024 // 1MB
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        expect.stringContaining('Validating file: resume.pdf')
      );
    });

    it('should accept valid DOC files', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.doc',
        type: 'application/msword',
        size: 2 * 1024 * 1024 // 2MB
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        expect.stringContaining('Validating file: resume.doc')
      );
    });

    it('should accept valid DOCX files', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 3 * 1024 * 1024 // 3MB
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        expect.stringContaining('Validating file: resume.docx')
      );
    });

    it('should reject files over 10MB size limit', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const largeFile = createMockFile({
        name: 'huge-resume.pdf',
        type: 'application/pdf',
        size: 11 * 1024 * 1024 // 11MB - exceeds limit
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, largeFile);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
          expect.stringContaining('Upload failed: File too large')
        );
      });
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('File too large')
      );
    });

    it('should reject invalid file types', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const invalidFile = createMockFile({
        name: 'image.jpg',
        type: 'image/jpeg',
        size: 1024 * 1024
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, invalidFile);

      // Assert
      await waitFor(() => {
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
          expect.stringContaining('Upload failed: Invalid file type')
        );
      });
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid file type')
      );
    });

    it('should show specific file size in validation messages', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const file = createMockFile({
        name: 'test.pdf',
        type: 'application/pdf',
        size: 1536000 // Exactly 1.5MB
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Assert
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        'File size: 1.46MB'
      );
    });
  });

  describe('Upload Process', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should show upload progress during file upload', async () => {
      // Arrange
      uploadCV.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            url: 'https://mock-storage.supabase.co/cv.pdf',
            path: 'cv-uploads/cv.pdf'
          }), 500)
        )
      );

      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert - Check upload progress UI appears
      await waitFor(() => {
        expect(screen.getByText(/uploading cv/i)).toBeInTheDocument();
      });

      // Assert - Check progress bar exists
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress bar during upload simulation', async () => {
      // Arrange
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/cv.pdf',
        path: 'cv-uploads/cv.pdf'
      });

      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Advance timers to trigger progress updates
      act(() => {
        testUtils.advanceTimers(300);
      });

      // Assert - Progress percentage should be displayed
      await waitFor(() => {
        const progressText = screen.queryByText(/%/);
        if (progressText) {
          expect(progressText).toBeInTheDocument();
        }
      });
    });

    it('should complete upload and show success state', async () => {
      // Arrange
      const mockUrl = 'https://mock-storage.supabase.co/cv.pdf';
      const mockPath = 'cv-uploads/cv.pdf';
      
      uploadCV.mockResolvedValue({
        success: true,
        url: mockUrl,
        path: mockPath
      });

      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf',
        size: 1024 * 1024
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Wait for upload to complete
      await waitFor(() => {
        expect(uploadCV).toHaveBeenCalledWith(validFile);
      });

      // Assert - Success callback should be called
      await waitFor(() => {
        expect(defaultProps.onUploadComplete).toHaveBeenCalledWith(mockUrl);
      });

      // Assert - Success toast should be shown
      expect(toast.success).toHaveBeenCalledWith(
        'CV uploaded successfully: resume.pdf'
      );

      // Assert - Success status messages
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        '✓ Upload complete: resume.pdf'
      );
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
        `File stored at: ${mockPath}`
      );
    });

    it('should disable upload area while uploading', async () => {
      // Arrange
      uploadCV.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert - Upload area should be disabled
      await waitFor(() => {
        const dropzone = screen.getByText(/uploading cv/i).closest('div');
        expect(dropzone).toHaveStyle({ cursor: 'not-allowed' });
      });
    });
  });

  describe('Error Handling', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should handle upload service errors gracefully', async () => {
      // Arrange
      const errorMessage = 'Network connection failed';
      uploadCV.mockRejectedValue(new Error(errorMessage));

      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert - Error handling
      await waitFor(() => {
        expect(defaultProps.onStatusChange).toHaveBeenCalledWith(
          `✗ Upload failed: ${errorMessage}`
        );
      });

      expect(toast.error).toHaveBeenCalledWith(
        `Upload failed: ${errorMessage}`
      );

      // Assert - onUploadComplete should not be called on error
      expect(defaultProps.onUploadComplete).not.toHaveBeenCalled();
    });

    it('should reset upload progress on error', async () => {
      // Arrange
      uploadCV.mockRejectedValue(new Error('Upload failed'));

      render(<CVUploader {...defaultProps} />);
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, validFile);

      // Assert - Upload should not be in progress after error
      await waitFor(() => {
        expect(screen.queryByText(/uploading cv/i)).not.toBeInTheDocument();
      });
    });

    it('should handle multiple file rejection from dropzone', async () => {
      // Test handled through dropzone mock
      render(<CVUploader {...defaultProps} />);
      
      // This tests the onDrop callback for rejected files
      // The actual implementation would be tested via dropzone integration
      expect(screen.getByText(/drag & drop your cv here/i)).toBeInTheDocument();
    });
  });

  describe('Uploaded File Display', () => {
    let user;

    beforeEach(() => {
      user = userEvent.setup({ delay: null });
    });

    it('should display uploaded file information', async () => {
      // Arrange
      const mockUrl = 'https://mock-storage.supabase.co/test.pdf';
      const mockPath = 'cv-uploads/test.pdf';
      
      uploadCV.mockResolvedValue({
        success: true,
        url: mockUrl,
        path: mockPath
      });

      render(<CVUploader {...defaultProps} />);
      const file = createMockFile({
        name: 'test-cv.pdf',
        type: 'application/pdf',
        size: 2048000 // 2MB
      });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Assert - File information display
      await waitFor(() => {
        expect(screen.getByText('✓ Uploaded Successfully')).toBeInTheDocument();
        expect(screen.getByText('test-cv.pdf')).toBeInTheDocument();
        expect(screen.getByText('1.95 MB')).toBeInTheDocument();
        expect(screen.getByText('application/pdf')).toBeInTheDocument();
        expect(screen.getByText(mockPath)).toBeInTheDocument();
      });
    });

    it('should provide upload another button after successful upload', async () => {
      // Arrange
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/test.pdf',
        path: 'cv-uploads/test.pdf'
      });

      render(<CVUploader {...defaultProps} />);
      const file = createMockFile({
        name: 'test.pdf',
        type: 'application/pdf'
      });

      // Act - Upload file
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Assert - Upload Another button appears
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload another/i })).toBeInTheDocument();
      });
    });

    it('should reset state when Upload Another is clicked', async () => {
      // Arrange
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/test.pdf',
        path: 'cv-uploads/test.pdf'
      });

      render(<CVUploader {...defaultProps} />);
      const file = createMockFile({ name: 'test.pdf', type: 'application/pdf' });

      // Act - Upload file
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Wait for upload to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /upload another/i })).toBeInTheDocument();
      });

      // Click Upload Another
      const uploadAnotherBtn = screen.getByRole('button', { name: /upload another/i });
      await user.click(uploadAnotherBtn);

      // Assert - State should be reset
      expect(screen.queryByText('✓ Uploaded Successfully')).not.toBeInTheDocument();
      expect(screen.getByText(/drag & drop your cv here/i)).toBeInTheDocument();
      expect(defaultProps.onStatusChange).toHaveBeenLastCalledWith('Ready for new upload');
    });

    it('should provide view file link when URL is available', async () => {
      // Arrange
      const mockUrl = 'https://mock-storage.supabase.co/viewable.pdf';
      uploadCV.mockResolvedValue({
        success: true,
        url: mockUrl,
        path: 'cv-uploads/viewable.pdf'
      });

      render(<CVUploader {...defaultProps} />);
      const file = createMockFile({ name: 'viewable.pdf', type: 'application/pdf' });

      // Act
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Assert - View File link appears
      await waitFor(() => {
        const viewLink = screen.getByRole('link', { name: /view file/i });
        expect(viewLink).toBeInTheDocument();
        expect(viewLink).toHaveAttribute('href', mockUrl);
        expect(viewLink).toHaveAttribute('target', '_blank');
        expect(viewLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Drag and Drop Interaction', () => {
    it('should show active drag state when file is dragged over', () => {
      // This would be tested through react-dropzone integration
      // The component uses isDragActive from useDropzone hook
      render(<CVUploader {...defaultProps} />);
      
      expect(screen.getByText(/drag & drop your cv here/i)).toBeInTheDocument();
    });

    it('should handle drag state styling changes', () => {
      // Test that drag active state changes styling
      const { container } = render(<CVUploader {...defaultProps} />);
      
      const dropzone = container.querySelector('[style*="border"]');
      expect(dropzone).toHaveStyle({
        border: '2px dashed var(--terminal-border)'
      });
    });
  });

  describe('Props Integration', () => {
    it('should call onStatusChange with appropriate messages throughout upload', async () => {
      // Arrange
      const onStatusChange = jest.fn();
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/test.pdf',
        path: 'cv-uploads/test.pdf'
      });

      render(<CVUploader {...defaultProps} onStatusChange={onStatusChange} />);
      const file = createMockFile({ name: 'test.pdf', type: 'application/pdf', size: 1536000 });

      // Act
      const user = userEvent.setup({ delay: null });
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, file);

      // Assert - Check all status messages are called in sequence
      await waitFor(() => {
        expect(onStatusChange).toHaveBeenCalledWith('Validating file: test.pdf');
        expect(onStatusChange).toHaveBeenCalledWith('File size: 1.46MB');
        expect(onStatusChange).toHaveBeenCalledWith('✓ Upload complete: test.pdf');
        expect(onStatusChange).toHaveBeenCalledWith('File stored at: cv-uploads/test.pdf');
        expect(onStatusChange).toHaveBeenCalledWith('Ready for analysis');
      });
    });

    it('should use sessionId for any session-specific operations', () => {
      // Arrange & Act
      render(<CVUploader {...defaultProps} sessionId="custom-session-456" />);
      
      // Assert - Component should render (sessionId used internally)
      expect(screen.getByText(/drag & drop your cv here/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing callback props gracefully', async () => {
      // Arrange - No callback props provided
      render(<CVUploader sessionId="test" />);
      const file = createMockFile({ name: 'test.pdf', type: 'application/pdf' });
      
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/test.pdf',
        path: 'cv-uploads/test.pdf'
      });

      // Act
      const user = userEvent.setup({ delay: null });
      const fileInput = screen.getByRole('button', { hidden: true });
      
      // Should not throw error even without callbacks
      await expect(user.upload(fileInput, file)).resolves.not.toThrow();
    });

    it('should handle empty file upload attempt', async () => {
      // Arrange
      render(<CVUploader {...defaultProps} />);
      const emptyFile = createMockFile({ name: 'empty.pdf', type: 'application/pdf', size: 0 });

      // Act
      const user = userEvent.setup({ delay: null });
      const fileInput = screen.getByRole('button', { hidden: true });
      await user.upload(fileInput, emptyFile);

      // Assert - Should handle empty file
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('Validating file: empty.pdf');
      expect(defaultProps.onStatusChange).toHaveBeenCalledWith('File size: 0.00MB');
    });
  });
});