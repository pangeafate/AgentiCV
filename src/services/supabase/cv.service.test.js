/**
 * CV Service Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 */

import {
  uploadCV,
  deleteCV,
  listCVFiles,
  getCVMetadata,
  downloadCV,
  STORAGE_CONFIG
} from './cv.service';
import { SupabaseMockFactory } from '../../test/mocks/supabase';
import { setupTest } from '../../test/utils/testSetup';

// Mock the entire config module to control isSupabaseConfigured
jest.mock('./config', () => ({
  supabase: {
    storage: {
      from: jest.fn()
    }
  },
  STORAGE_CONFIG: {
    bucketName: 'cv-uploads',
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx']
  },
  isSupabaseConfigured: jest.fn(() => true)
}));

// Mock console methods
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
};

describe('CV Service', () => {
  let mockSupabase;
  let testUtils;
  let mockConfig;

  beforeEach(() => {
    testUtils = setupTest({ useFakeTimers: true, mockFetch: false });
    mockConfig = require('./config');
    jest.clearAllMocks();
    
    // Reset console spies
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
    
    // Set up default Supabase mock
    mockSupabase = SupabaseMockFactory.createSuccessMock();
    mockConfig.supabase = mockSupabase;
    mockConfig.isSupabaseConfigured.mockReturnValue(true);
  });

  afterEach(() => {
    testUtils.cleanup();
  });

  describe('File Validation', () => {
    describe('Valid files', () => {
      it('should accept valid PDF files under 10MB', () => {
        const validFile = new File(['content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 5 * 1024 * 1024 // 5MB
        });

        expect(() => require('./cv.service').validateFile?.(validFile)).not.toThrow();
      });

      it('should accept valid DOC files', () => {
        const validFile = new File(['content'], 'resume.doc', {
          type: 'application/msword',
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(validFile)).not.toThrow();
      });

      it('should accept valid DOCX files', () => {
        const validFile = new File(['content'], 'resume.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(validFile)).not.toThrow();
      });

      it('should handle files at the size limit', () => {
        const maxSizeFile = new File(['content'], 'resume.pdf', {
          type: 'application/pdf',
          size: STORAGE_CONFIG.maxFileSize
        });

        expect(() => require('./cv.service').validateFile?.(maxSizeFile)).not.toThrow();
      });
    });

    describe('Invalid files', () => {
      it('should reject files over 10MB with detailed error', () => {
        const largeFile = new File(['content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 11 * 1024 * 1024 // 11MB
        });

        expect(() => require('./cv.service').validateFile?.(largeFile))
          .toThrow(/File size too large.*Maximum allowed: 10\.0MB.*got: 11\.00MB/);
      });

      it('should reject invalid MIME types', () => {
        const invalidFile = new File(['content'], 'image.jpg', {
          type: 'image/jpeg',
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(invalidFile))
          .toThrow('Invalid file type. Supported formats: PDF, DOC, DOCX');
      });

      it('should reject invalid file extensions', () => {
        const invalidFile = new File(['content'], 'resume.jpg', {
          type: 'application/pdf', // MIME type is valid but extension is not
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(invalidFile))
          .toThrow(/Invalid file extension.*Supported extensions:.*\.pdf.*\.doc.*\.docx/);
      });

      it('should handle files with no extension', () => {
        const noExtFile = new File(['content'], 'resume', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(noExtFile))
          .toThrow(/Invalid file extension/);
      });

      it('should handle case sensitivity in extensions', () => {
        const upperCaseFile = new File(['content'], 'resume.PDF', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        expect(() => require('./cv.service').validateFile?.(upperCaseFile)).not.toThrow();
      });
    });
  });

  describe('uploadCV', () => {
    describe('Success cases', () => {
      it('should upload a valid CV file successfully', async () => {
        const file = new File(['cv content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024,
          lastModified: 1640995200000 // 2022-01-01
        });

        const result = await uploadCV(file);

        expect(result).toMatchObject({
          success: true,
          path: 'mock/path/file.pdf',
          url: 'https://mock-storage.supabase.co/storage/v1/object/public/cv-uploads/file.pdf',
          filename: expect.stringMatching(/.*resume.*\.pdf$/),
          message: 'File uploaded successfully',
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            bucket: 'cv-uploads'
          }
        });

        expect(mockSupabase.storage.from).toHaveBeenCalledWith('cv-uploads');
        expect(mockSupabase.storage.from().upload).toHaveBeenCalledWith(
          expect.stringMatching(/.*resume.*\.pdf$/),
          file,
          expect.objectContaining({
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })
        );
      });

      it('should generate unique filenames with timestamp and random suffix', async () => {
        const file = new File(['cv content'], 'my-resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        const result1 = await uploadCV(file);
        const result2 = await uploadCV(file);

        // Both uploads should generate different filenames
        expect(result1.filename).not.toEqual(result2.filename);
        
        // Both should contain the original name and have timestamp format
        expect(result1.filename).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*my-resume.*\.pdf$/);
        expect(result2.filename).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}.*my-resume.*\.pdf$/);
      });

      it('should handle files with special characters in name', async () => {
        const file = new File(['cv content'], 'résumé (final) v2.1.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        const result = await uploadCV(file);
        
        expect(result.success).toBe(true);
        expect(result.filename).toContain('résumé (final) v2');
        expect(result.filename).toEndWith('.pdf');
      });
    });

    describe('Mock mode', () => {
      beforeEach(() => {
        mockConfig.isSupabaseConfigured.mockReturnValue(false);
      });

      it('should work in mock mode when Supabase is not configured', async () => {
        const file = new File(['cv content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024,
          lastModified: 1640995200000
        });

        const result = await uploadCV(file);

        expect(result).toMatchObject({
          success: true,
          path: expect.stringMatching(/^mock\/cv-uploads\//),
          url: expect.stringContaining('https://mock-storage.supabase.co'),
          message: 'File uploaded successfully (mock mode)',
          metadata: {
            size: file.size,
            type: file.type,
            lastModified: file.lastModified
          }
        });

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          'Supabase not configured, returning mock success response'
        );
      });

      it('should simulate upload delay in mock mode', async () => {
        const file = new File(['cv content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        const startTime = Date.now();
        testUtils.runAllTimers(); // Fast forward through setTimeout
        await uploadCV(file);
        testUtils.runAllTimers();
        
        // Verify setTimeout was called (mock implementation)
        expect(setTimeout).toHaveBeenCalled();
      });
    });

    describe('Error cases', () => {
      it('should handle Supabase upload errors', async () => {
        mockSupabase.storage.from().upload.mockResolvedValue({
          data: null,
          error: new Error('Storage quota exceeded')
        });

        const file = new File(['cv content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        await expect(uploadCV(file)).rejects.toThrow('Upload failed: Storage quota exceeded');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Supabase upload error:',
          expect.any(Error)
        );
      });

      it('should handle file validation errors', async () => {
        const invalidFile = new File(['content'], 'too-large.pdf', {
          type: 'application/pdf',
          size: 15 * 1024 * 1024 // 15MB
        });

        await expect(uploadCV(invalidFile)).rejects.toThrow(/File size too large/);
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'CV upload error:',
          expect.any(Error)
        );
      });

      it('should handle network errors during upload', async () => {
        mockSupabase.storage.from().upload.mockRejectedValue(new Error('Network error'));

        const file = new File(['cv content'], 'resume.pdf', {
          type: 'application/pdf',
          size: 1024 * 1024
        });

        await expect(uploadCV(file)).rejects.toThrow('Network error');
      });
    });
  });

  describe('deleteCV', () => {
    describe('Success cases', () => {
      it('should delete a CV file successfully', async () => {
        const filePath = 'test-file.pdf';
        
        const result = await deleteCV(filePath);

        expect(result).toEqual({
          success: true,
          message: 'File deleted successfully',
          deletedFiles: ['mock/path/file.pdf']
        });

        expect(mockSupabase.storage.from).toHaveBeenCalledWith('cv-uploads');
        expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith([filePath]);
      });

      it('should handle multiple file deletion', async () => {
        const filePaths = ['file1.pdf', 'file2.pdf'];
        
        for (const filePath of filePaths) {
          const result = await deleteCV(filePath);
          expect(result.success).toBe(true);
        }

        expect(mockSupabase.storage.from().remove).toHaveBeenCalledTimes(2);
      });
    });

    describe('Mock mode', () => {
      beforeEach(() => {
        mockConfig.isSupabaseConfigured.mockReturnValue(false);
      });

      it('should work in mock mode when Supabase is not configured', async () => {
        const result = await deleteCV('test-file.pdf');

        expect(result).toEqual({
          success: true,
          message: 'File deleted successfully (mock mode)'
        });

        expect(consoleSpy.warn).toHaveBeenCalledWith(
          'Supabase not configured, returning mock success response'
        );
      });
    });

    describe('Error cases', () => {
      it('should handle Supabase deletion errors', async () => {
        mockSupabase.storage.from().remove.mockResolvedValue({
          data: null,
          error: new Error('File not found')
        });

        await expect(deleteCV('non-existent.pdf')).rejects.toThrow('Delete failed: File not found');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'CV deletion error:',
          expect.any(Error)
        );
      });

      it('should handle network errors during deletion', async () => {
        mockSupabase.storage.from().remove.mockRejectedValue(new Error('Network timeout'));

        await expect(deleteCV('test.pdf')).rejects.toThrow('Network timeout');
      });

      it('should handle empty file path', async () => {
        await expect(deleteCV('')).resolves.toBeDefined();
        expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith(['']);
      });
    });
  });

  describe('listCVFiles', () => {
    describe('Success cases', () => {
      it('should list uploaded CV files with default prefix', async () => {
        const mockFiles = [
          { name: 'cv1.pdf', created_at: '2024-01-02T10:00:00Z', size: 1024 },
          { name: 'cv2.pdf', created_at: '2024-01-01T10:00:00Z', size: 2048 }
        ];
        
        mockSupabase.storage.from().list.mockResolvedValue({
          data: mockFiles,
          error: null
        });

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

      it('should list files with custom prefix', async () => {
        const customPrefix = 'user123/';
        const mockFiles = [{ name: 'user-cv.pdf', created_at: '2024-01-01' }];
        
        mockSupabase.storage.from().list.mockResolvedValue({
          data: mockFiles,
          error: null
        });

        const result = await listCVFiles(customPrefix);

        expect(result).toEqual(mockFiles);
        expect(mockSupabase.storage.from().list).toHaveBeenCalledWith(
          customPrefix,
          expect.any(Object)
        );
      });

      it('should handle empty file list', async () => {
        mockSupabase.storage.from().list.mockResolvedValue({
          data: [],
          error: null
        });

        const result = await listCVFiles();

        expect(result).toEqual([]);
      });

      it('should handle null data response', async () => {
        mockSupabase.storage.from().list.mockResolvedValue({
          data: null,
          error: null
        });

        const result = await listCVFiles();

        expect(result).toEqual([]);
      });
    });

    describe('Mock mode', () => {
      beforeEach(() => {
        mockConfig.isSupabaseConfigured.mockReturnValue(false);
      });

      it('should return empty array in mock mode', async () => {
        const result = await listCVFiles();

        expect(result).toEqual([]);
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          'Supabase not configured, returning empty list'
        );
      });
    });

    describe('Error cases', () => {
      it('should handle list errors', async () => {
        mockSupabase.storage.from().list.mockResolvedValue({
          data: null,
          error: new Error('Permission denied')
        });

        await expect(listCVFiles()).rejects.toThrow('List files failed: Permission denied');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'List CV files error:',
          expect.any(Error)
        );
      });

      it('should handle network errors', async () => {
        mockSupabase.storage.from().list.mockRejectedValue(new Error('Network error'));

        await expect(listCVFiles()).rejects.toThrow('Network error');
      });
    });
  });

  describe('getCVMetadata', () => {
    describe('Success cases', () => {
      it('should get CV metadata successfully', async () => {
        const mockMetadata = {
          name: 'test-cv.pdf',
          size: 1024,
          type: 'application/pdf',
          created_at: '2024-01-01T10:00:00Z'
        };
        
        mockSupabase.storage.from().list.mockResolvedValue({
          data: [mockMetadata],
          error: null
        });

        const result = await getCVMetadata('cv-uploads/test-cv.pdf');

        expect(result).toEqual(mockMetadata);
        expect(mockSupabase.storage.from().list).toHaveBeenCalledWith(
          '',
          { search: 'test-cv.pdf' }
        );
      });

      it('should return null if file not found', async () => {
        mockSupabase.storage.from().list.mockResolvedValue({
          data: [],
          error: null
        });

        const result = await getCVMetadata('non-existent.pdf');

        expect(result).toBeNull();
      });
    });

    describe('Mock mode', () => {
      beforeEach(() => {
        mockConfig.isSupabaseConfigured.mockReturnValue(false);
      });

      it('should return mock metadata in mock mode', async () => {
        const result = await getCVMetadata('test-cv.pdf');

        expect(result).toMatchObject({
          name: 'test-cv.pdf',
          size: 1024 * 1024,
          type: 'application/pdf',
          lastModified: expect.any(Number)
        });
        
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          'Supabase not configured, returning mock metadata'
        );
      });
    });

    describe('Error cases', () => {
      it('should handle metadata fetch errors', async () => {
        mockSupabase.storage.from().list.mockResolvedValue({
          data: null,
          error: new Error('Access denied')
        });

        await expect(getCVMetadata('test.pdf')).rejects.toThrow('Get metadata failed: Access denied');
      });
    });
  });

  describe('downloadCV', () => {
    describe('Success cases', () => {
      it('should download CV file successfully', async () => {
        const mockBlob = new Blob(['file content'], { type: 'application/pdf' });
        
        mockSupabase.storage.from().download.mockResolvedValue({
          data: mockBlob,
          error: null
        });

        const result = await downloadCV('test-cv.pdf');

        expect(result).toBe(mockBlob);
        expect(mockSupabase.storage.from().download).toHaveBeenCalledWith('test-cv.pdf');
      });
    });

    describe('Mock mode', () => {
      beforeEach(() => {
        mockConfig.isSupabaseConfigured.mockReturnValue(false);
      });

      it('should throw error in mock mode', async () => {
        await expect(downloadCV('test.pdf')).rejects.toThrow(
          'Supabase not configured - cannot download files in mock mode'
        );
      });
    });

    describe('Error cases', () => {
      it('should handle download errors', async () => {
        mockSupabase.storage.from().download.mockResolvedValue({
          data: null,
          error: new Error('File not found')
        });

        await expect(downloadCV('non-existent.pdf')).rejects.toThrow('Download failed: File not found');
        expect(consoleSpy.error).toHaveBeenCalledWith(
          'Download CV error:',
          expect.any(Error)
        );
      });

      it('should handle network errors during download', async () => {
        mockSupabase.storage.from().download.mockRejectedValue(new Error('Connection timeout'));

        await expect(downloadCV('test.pdf')).rejects.toThrow('Connection timeout');
      });
    });
  });

  describe('STORAGE_CONFIG', () => {
    it('should export storage configuration', () => {
      expect(STORAGE_CONFIG).toBeDefined();
      expect(STORAGE_CONFIG).toMatchObject({
        bucketName: 'cv-uploads',
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: expect.arrayContaining([
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]),
        allowedExtensions: expect.arrayContaining(['.pdf', '.doc', '.docx'])
      });
    });
  });
});