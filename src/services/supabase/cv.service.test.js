/**
 * CV Service Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import { uploadCV, deleteCV, listCVFiles, validateFile } from './cv.service';
import { SupabaseMockFactory } from '@/test';

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('CV Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
    
    // Set up default Supabase mock
    const mockSupabase = SupabaseMockFactory.createSuccessMock();
    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);
  });

  describe('validateFile', () => {
    it('should accept valid PDF files under 10MB', () => {
      const validFile = new File(['content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 5 * 1024 * 1024 // 5MB
      });

      expect(() => validateFile(validFile)).not.toThrow();
    });

    it('should accept valid DOC files', () => {
      const validFile = new File(['content'], 'resume.doc', {
        type: 'application/msword',
        size: 1024 * 1024
      });

      expect(() => validateFile(validFile)).not.toThrow();
    });

    it('should accept valid DOCX files', () => {
      const validFile = new File(['content'], 'resume.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1024 * 1024
      });

      expect(() => validateFile(validFile)).not.toThrow();
    });

    it('should accept valid TXT files', () => {
      const validFile = new File(['content'], 'resume.txt', {
        type: 'text/plain',
        size: 1024 * 1024
      });

      expect(() => validateFile(validFile)).not.toThrow();
    });

    it('should reject files over 10MB', () => {
      const largeFile = new File(['content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 11 * 1024 * 1024 // 11MB
      });

      expect(() => validateFile(largeFile)).toThrow('File size exceeds 10MB limit');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['content'], 'image.jpg', {
        type: 'image/jpeg',
        size: 1024 * 1024
      });

      expect(() => validateFile(invalidFile)).toThrow('Invalid file type');
    });

    it('should reject files without a file object', () => {
      expect(() => validateFile(null)).toThrow('No file provided');
      expect(() => validateFile(undefined)).toThrow('No file provided');
      expect(() => validateFile({})).toThrow('No file provided');
    });
  });

  describe('uploadCV', () => {
    it('should upload a valid CV file successfully', async () => {
      const mockSupabase = SupabaseMockFactory.createSuccessMock();
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      const file = new File(['cv content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 1024 * 1024
      });

      const result = await uploadCV(file);

      expect(result).toEqual({
        success: true,
        path: 'mock/path/file.pdf',
        url: 'https://mock-storage.supabase.co/storage/v1/object/public/cv-uploads/file.pdf',
        filename: expect.stringContaining('.pdf'),
        message: 'File uploaded successfully',
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: expect.any(Number),
          bucket: 'cv-uploads'
        }
      });

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('cv-uploads');
    });

    it('should handle upload errors gracefully', async () => {
      const mockSupabase = SupabaseMockFactory.createErrorMock('Upload failed');
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      const file = new File(['cv content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 1024 * 1024
      });

      await expect(uploadCV(file)).rejects.toThrow('Upload failed');
    });

    it('should generate unique filenames for uploads', async () => {
      const mockSupabase = SupabaseMockFactory.createSuccessMock();
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      const file = new File(['cv content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 1024 * 1024
      });

      await uploadCV(file);

      const uploadCall = mockSupabase.storage.from().upload.mock.calls[0];
      const uploadedFileName = uploadCall[0];
      
      // Should contain timestamp and original filename
      expect(uploadedFileName).toMatch(/\d{4}-\d{2}-\d{2}/); // Date format
      expect(uploadedFileName).toContain('resume');
      expect(uploadedFileName).toEndWith('.pdf');
    });

    it('should work in mock mode when Supabase is not configured', async () => {
      // Remove env variables to trigger mock mode
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const file = new File(['cv content'], 'resume.pdf', {
        type: 'application/pdf',
        size: 1024 * 1024
      });

      const result = await uploadCV(file);

      expect(result).toEqual({
        success: true,
        path: expect.stringContaining('mock/cv-uploads/'),
        url: expect.stringContaining('https://mock-storage.supabase.co'),
        message: 'File uploaded successfully (mock mode)',
        metadata: {
          size: file.size,
          type: file.type,
          lastModified: expect.any(Number)
        }
      });
    });
  });

  describe('deleteCV', () => {
    it('should delete a CV file successfully', async () => {
      const mockSupabase = SupabaseMockFactory.createSuccessMock();
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      const result = await deleteCV('cv-uploads/test-file.pdf');

      expect(result).toEqual({
        success: true,
        message: 'File deleted successfully',
        deletedFiles: ['mock/path/file.pdf']
      });

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('cv-uploads');
      expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith(['cv-uploads/test-file.pdf']);
    });

    it('should handle deletion errors', async () => {
      const mockSupabase = SupabaseMockFactory.createErrorMock('Delete failed');
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await expect(deleteCV('cv-uploads/test-file.pdf')).rejects.toThrow('Delete failed');
    });

    it('should work in mock mode when Supabase is not configured', async () => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const result = await deleteCV('cv-uploads/test-file.pdf');

      expect(result).toEqual({
        success: true,
        message: 'File deleted successfully (mock mode)'
      });
    });
  });

  describe('listCVFiles', () => {
    it('should list uploaded CV files', async () => {
      const mockFiles = [
        { name: 'cv1.pdf', created_at: '2024-01-01' },
        { name: 'cv2.pdf', created_at: '2024-01-02' }
      ];
      
      const mockSupabase = SupabaseMockFactory.createSuccessMock(mockFiles);
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      const result = await listCVFiles();

      expect(result).toEqual(mockFiles);
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('cv-uploads');
      expect(mockSupabase.storage.from().list).toHaveBeenCalledWith(
        'cv-uploads/',
        expect.objectContaining({
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })
      );
    });

    it('should handle list errors', async () => {
      const mockSupabase = SupabaseMockFactory.createErrorMock('List failed');
      require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);

      await expect(listCVFiles()).rejects.toThrow('List failed');
    });

    it('should return empty array in mock mode', async () => {
      delete process.env.VITE_SUPABASE_URL;
      delete process.env.VITE_SUPABASE_ANON_KEY;

      const result = await listCVFiles();

      expect(result).toEqual([]);
    });
  });
});