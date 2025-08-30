/**
 * CVUploader Component Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, createMockFile, SupabaseMockFactory } from '@/test';
import CVUploader from './CVUploader';

// Mock the cv.service module
jest.mock('../../../services/supabase/cv.service', () => ({
  uploadCV: jest.fn(),
  validateFile: jest.fn()
}));

const { uploadCV, validateFile } = require('../../../services/supabase/cv.service');

// Setup shared utilities
const { getWrapper } = setupTest();

describe('CVUploader Component', () => {
  const mockProps = {
    onStatusChange: jest.fn(),
    onUploadComplete: jest.fn(),
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render upload dropzone with correct text', () => {
      render(<CVUploader {...mockProps} />);
      
      expect(screen.getByText(/Drop CV here or click to browse/i)).toBeInTheDocument();
      expect(screen.getByText(/Supported formats:/i)).toBeInTheDocument();
      expect(screen.getByText(/PDF, DOC, DOCX, TXT/i)).toBeInTheDocument();
    });

    it('should display file size limit', () => {
      render(<CVUploader {...mockProps} />);
      
      expect(screen.getByText(/Max size: 10MB/i)).toBeInTheDocument();
    });
  });

  describe('File Validation', () => {
    it('should accept valid file types', async () => {
      const user = userEvent.setup();
      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf',
        size: 1024 * 1024 // 1MB
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      expect(mockProps.onStatusChange).toHaveBeenCalledWith(
        expect.stringContaining('Validating')
      );
    });

    it('should reject files over 10MB', async () => {
      const user = userEvent.setup();
      render(<CVUploader {...mockProps} />);
      
      const largeFile = createMockFile({
        name: 'huge-resume.pdf',
        type: 'application/pdf',
        size: 11 * 1024 * 1024 // 11MB
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, largeFile);

      await waitFor(() => {
        expect(screen.getByText(/File size exceeds 10MB limit/i)).toBeInTheDocument();
      });
    });

    it('should reject invalid file types', async () => {
      const user = userEvent.setup();
      render(<CVUploader {...mockProps} />);
      
      const invalidFile = createMockFile({
        name: 'image.jpg',
        type: 'image/jpeg',
        size: 1024 * 1024
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, invalidFile);

      await waitFor(() => {
        expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Process', () => {
    it('should show upload progress', async () => {
      const user = userEvent.setup();
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/cv.pdf',
        path: 'cv-uploads/cv.pdf'
      });

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
      });
    });

    it('should call onUploadComplete on successful upload', async () => {
      const user = userEvent.setup();
      const mockUrl = 'https://mock-storage.supabase.co/cv.pdf';
      
      uploadCV.mockResolvedValue({
        success: true,
        url: mockUrl,
        path: 'cv-uploads/cv.pdf'
      });

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(mockProps.onUploadComplete).toHaveBeenCalledWith(mockUrl);
      });
    });

    it('should handle upload errors gracefully', async () => {
      const user = userEvent.setup();
      uploadCV.mockRejectedValue(new Error('Network error'));

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(screen.getByText(/Upload failed: Network error/i)).toBeInTheDocument();
      });
      
      expect(mockProps.onUploadComplete).not.toHaveBeenCalled();
    });
  });

  describe('Retry Functionality', () => {
    it('should show retry button on upload failure', async () => {
      const user = userEvent.setup();
      uploadCV.mockRejectedValue(new Error('Upload failed'));

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry upload/i })).toBeInTheDocument();
      });
    });

    it('should retry upload when retry button is clicked', async () => {
      const user = userEvent.setup();
      
      // First attempt fails
      uploadCV.mockRejectedValueOnce(new Error('Network error'));
      
      // Second attempt succeeds
      uploadCV.mockResolvedValueOnce({
        success: true,
        url: 'https://mock-storage.supabase.co/cv.pdf',
        path: 'cv-uploads/cv.pdf'
      });

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry upload/i });
      await user.click(retryButton);

      // Should succeed this time
      await waitFor(() => {
        expect(mockProps.onUploadComplete).toHaveBeenCalled();
      });
    });
  });

  describe('User Feedback', () => {
    it('should call onStatusChange with appropriate messages', async () => {
      const user = userEvent.setup();
      uploadCV.mockResolvedValue({
        success: true,
        url: 'https://mock-storage.supabase.co/cv.pdf',
        path: 'cv-uploads/cv.pdf'
      });

      render(<CVUploader {...mockProps} />);
      
      const validFile = createMockFile({
        name: 'resume.pdf',
        type: 'application/pdf'
      });

      const input = screen.getByLabelText(/drop cv here/i);
      await user.upload(input, validFile);

      await waitFor(() => {
        expect(mockProps.onStatusChange).toHaveBeenCalledWith(
          expect.stringContaining('Validating')
        );
        expect(mockProps.onStatusChange).toHaveBeenCalledWith(
          expect.stringContaining('Uploading')
        );
        expect(mockProps.onStatusChange).toHaveBeenCalledWith(
          expect.stringContaining('Upload complete')
        );
      });
    });
  });
});