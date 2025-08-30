/**
 * PDF Extractor Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * Using shared infrastructure from test/index.js
 */

import { setupTest, createMockFile } from '@/test';
import { extractTextFromPDF, extractTextFromFile } from './pdfExtractor';

// Mock console methods using shared infrastructure
const consoleSpy = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  error: jest.spyOn(console, 'error').mockImplementation(() => {})
};

// Setup shared utilities following GL-TESTING-GUIDELINES.md
const { getWrapper } = setupTest();

describe('PDF Extractor', () => {
  beforeEach(() => {
    // Clear all mocks using shared infrastructure
    jest.clearAllMocks();
    Object.values(consoleSpy).forEach(spy => spy.mockClear());
  });

  describe('extractTextFromPDF', () => {
    const createMockPDFFile = (name = 'test.pdf', size = 1024) => {
      return createMockFile({
        name,
        type: 'application/pdf',
        size,
        content: 'PDF content'
      });
    };

    it('should return placeholder text for PDF files', async () => {
      const mockFile = createMockPDFFile('resume.pdf', 2048);

      const result = await extractTextFromPDF(mockFile);

      expect(result).toMatch(/^\[PDF File: resume\.pdf\]/);
      expect(result).toContain('[Note: PDF text extraction needs server-side processing or a PDF.js implementation]');
      expect(result).toContain('[File size: 2048 bytes]');
    });

    it('should handle files with different names', async () => {
      const testFiles = [
        'my-cv.pdf',
        'résumé.pdf',
        'CV (final).pdf',
        'document_v2.1.pdf'
      ];

      for (const fileName of testFiles) {
        const mockFile = createMockPDFFile(fileName);
        const result = await extractTextFromPDF(mockFile);

        expect(result).toContain(`[PDF File: ${fileName}]`);
        expect(result).toContain('[Note: PDF text extraction needs server-side processing');
      }
    });

    it('should handle different file sizes', async () => {
      const testSizes = [0, 1024, 1024 * 1024, 10 * 1024 * 1024];

      for (const size of testSizes) {
        const mockFile = createMockPDFFile('test.pdf', size);
        const result = await extractTextFromPDF(mockFile);

        expect(result).toContain(`[File size: ${size} bytes]`);
      }
    });

    it('should handle edge cases with file properties', async () => {
      // File with no name
      const noNameFile = new File(['content'], '', {
        type: 'application/pdf',
        size: 1024
      });

      const result = await extractTextFromPDF(noNameFile);
      expect(result).toContain('[PDF File: ]');

      // File with very long name
      const longName = 'a'.repeat(255) + '.pdf';
      const longNameFile = createMockPDFFile(longName);
      const longResult = await extractTextFromPDF(longNameFile);
      expect(longResult).toContain(`[PDF File: ${longName}]`);
    });

    it('should be consistent across multiple calls', async () => {
      const mockFile = createMockPDFFile('consistent.pdf', 1500);

      const result1 = await extractTextFromPDF(mockFile);
      const result2 = await extractTextFromPDF(mockFile);

      expect(result1).toBe(result2);
      expect(result1).toContain('[PDF File: consistent.pdf]');
      expect(result1).toContain('[File size: 1500 bytes]');
    });
  });

  describe('extractTextFromFile', () => {
    describe('Text files', () => {
      it('should extract text from plain text files', async () => {
        const textContent = 'This is a plain text resume.\nName: John Doe\nSkills: JavaScript, React';
        const textFile = createMockFile({
          name: 'resume.txt',
          type: 'text/plain',
          content: textContent
        });

        const result = await extractTextFromFile(textFile);

        expect(result).toBe(textContent);
      });

      it('should handle empty text files', async () => {
        const emptyFile = createMockFile({
          name: 'empty.txt',
          type: 'text/plain',
          content: ''
        });

        const result = await extractTextFromFile(emptyFile);

        expect(result).toBe('');
      });

      it('should handle large text files', async () => {
        const largeContent = 'Line of text\n'.repeat(10000);
        const largeFile = createMockFile({
          name: 'large.txt',
          type: 'text/plain',
          content: largeContent
        });

        const result = await extractTextFromFile(largeFile);

        expect(result).toBe(largeContent);
        expect(result.split('\n')).toHaveLength(10001); // 10000 lines + empty line at end
      });

      it('should handle text files with special characters', async () => {
        const specialContent = 'Résumé\n名前: 田中太郎\n© 2024 All rights reserved\n';
        const specialFile = createMockFile({
          name: 'special.txt',
          type: 'text/plain',
          content: specialContent
        });

        const result = await extractTextFromFile(specialFile);

        expect(result).toBe(specialContent);
        expect(result).toContain('Résumé');
        expect(result).toContain('名前: 田中太郎');
        expect(result).toContain('©');
      });
    });

    describe('PDF files', () => {
      it('should return placeholder text for PDF files', async () => {
        const pdfFile = createMockFile({
          name: 'resume.pdf',
          type: 'application/pdf',
          size: 2048,
          content: 'PDF content'
        });

        const result = await extractTextFromFile(pdfFile);

        expect(result).toMatch(/^\[PDF File: resume\.pdf\]/);
        expect(result).toContain('[Note: PDF text extraction needs server-side processing');
        expect(result).toContain('[File size: 2048 bytes]');
      });

      it('should handle PDF files with different sizes', async () => {
        const largePdfFile = createMockFile({
          name: 'large-cv.pdf',
          type: 'application/pdf',
          size: 5 * 1024 * 1024,
          content: 'Large PDF content'
        });

        const result = await extractTextFromFile(largePdfFile);

        expect(result).toContain('[PDF File: large-cv.pdf]');
        expect(result).toContain(`[File size: ${5 * 1024 * 1024} bytes]`);
      });
    });

    describe('Word documents', () => {
      it('should return placeholder text for DOC files', async () => {
        const docFile = createMockFile({
          name: 'resume.doc',
          type: 'application/msword',
          size: 3072,
          content: 'DOC content'
        });

        const result = await extractTextFromFile(docFile);

        expect(result).toMatch(/^\[Word Document: resume\.doc\]/);
        expect(result).toContain('[Note: Word document extraction needs server-side processing]');
        expect(result).toContain('[File size: 3072 bytes]');
      });

      it('should return placeholder text for DOCX files', async () => {
        const docxFile = createMockFile({
          name: 'resume.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 4096,
          content: 'DOCX content'
        });

        const result = await extractTextFromFile(docxFile);

        expect(result).toMatch(/^\[Word Document: resume\.docx\]/);
        expect(result).toContain('[Note: Word document extraction needs server-side processing]');
        expect(result).toContain('[File size: 4096 bytes]');
      });

      it('should handle Word files with different names and sizes', async () => {
        const testCases = [
          { name: 'CV.doc', type: 'application/msword', size: 1024 },
          { name: 'résumé final.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 2048 },
          { name: 'My CV (2024).doc', type: 'application/msword', size: 8192 }
        ];

        for (const testCase of testCases) {
          const file = createMockFile({
            name: testCase.name,
            type: testCase.type,
            size: testCase.size,
            content: 'content'
          });

          const result = await extractTextFromFile(file);

          expect(result).toContain(`[Word Document: ${testCase.name}]`);
          expect(result).toContain(`[File size: ${testCase.size} bytes]`);
          expect(result).toContain('[Note: Word document extraction needs server-side processing]');
        }
      });
    });

    describe('Unknown file types', () => {
      it('should attempt to read unknown files as text', async () => {
        const content = 'This might be readable as text';
        const unknownFile = new File([content], 'unknown.xyz', {
          type: 'application/unknown'
        });

        // Mock File.text() to succeed
        unknownFile.text = jest.fn().mockResolvedValue(content);

        const result = await extractTextFromFile(unknownFile);

        expect(result).toBe(content);
        expect(unknownFile.text).toHaveBeenCalled();
      });

      it('should handle errors when reading unknown files as text', async () => {
        const unknownFile = new File(['binary content'], 'binary.bin', {
          type: 'application/octet-stream'
        });

        // Mock File.text() to throw an error
        unknownFile.text = jest.fn().mockRejectedValue(new Error('Cannot read as text'));

        const result = await extractTextFromFile(unknownFile);

        expect(result).toBe('[Unable to extract text from file: binary.bin]');
        expect(unknownFile.text).toHaveBeenCalled();
      });

      it('should handle files with no type', async () => {
        const content = 'Text content without MIME type';
        const noTypeFile = new File([content], 'no-type.txt', {
          type: '' // Empty type
        });

        // Mock File.text() to succeed
        noTypeFile.text = jest.fn().mockResolvedValue(content);

        const result = await extractTextFromFile(noTypeFile);

        expect(result).toBe(content);
      });

      it('should handle image files gracefully', async () => {
        const imageFile = new File(['image data'], 'image.jpg', {
          type: 'image/jpeg',
          size: 5000
        });

        // Mock File.text() to fail (as expected for binary data)
        imageFile.text = jest.fn().mockRejectedValue(new Error('Binary data'));

        const result = await extractTextFromFile(imageFile);

        expect(result).toBe('[Unable to extract text from file: image.jpg]');
      });
    });

    describe('Edge cases and error handling', () => {
      it('should handle null file input', async () => {
        await expect(extractTextFromFile(null)).rejects.toThrow();
      });

      it('should handle undefined file input', async () => {
        await expect(extractTextFromFile(undefined)).rejects.toThrow();
      });

      it('should handle file with undefined name', async () => {
        const file = createMockFile({
          name: undefined,
          type: 'text/plain',
          content: 'content'
        });

        // This should work as File constructor handles undefined name
        const result = await extractTextFromFile(file);
        expect(typeof result).toBe('string');
      });

      it('should handle text extraction errors gracefully', async () => {
        // Suppress console errors for this test
        const originalError = console.error;
        console.error = jest.fn();
        
        const mockFile = createMockFile({
          name: 'error.txt',
          type: 'text/plain',
          content: 'content'
        });

        // Mock text() method to return rejected promise
        mockFile.text = jest.fn().mockRejectedValue(new Error('Read error'));
        
        const result = await extractTextFromFile(mockFile);

        expect(result).toBe('[Unable to extract text from file: error.txt]');
        expect(mockFile.text).toHaveBeenCalled();
        
        // Restore console.error
        console.error = originalError;
      });

      it('should handle very large files', async () => {
        // Create a file that would be too large for memory in real scenarios
        const largeSize = 100 * 1024 * 1024; // 100MB
        const largeFile = new File(['x'.repeat(1000)], 'large.txt', {
          type: 'text/plain',
          size: largeSize
        });

        // In tests, we just check that it attempts to read
        const content = 'Mocked large content';
        largeFile.text = jest.fn().mockResolvedValue(content);

        const result = await extractTextFromFile(largeFile);

        expect(result).toBe(content);
        expect(largeFile.text).toHaveBeenCalled();
      });
    });

    describe('File type detection and routing', () => {
      it('should route files to correct extraction method based on MIME type', async () => {
        const testCases = [
          {
            type: 'text/plain',
            name: 'text.txt',
            expectedRoute: 'text',
            content: 'Text content'
          },
          {
            type: 'application/pdf',
            name: 'doc.pdf',
            expectedRoute: 'pdf',
            content: 'PDF placeholder'
          },
          {
            type: 'application/msword',
            name: 'doc.doc',
            expectedRoute: 'word',
            content: 'Word placeholder'
          },
          {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            name: 'doc.docx',
            expectedRoute: 'word',
            content: 'Word placeholder'
          }
        ];

        for (const testCase of testCases) {
          const file = new File([testCase.content], testCase.name, {
            type: testCase.type,
            size: 1024
          });

          if (testCase.expectedRoute === 'text') {
            file.text = jest.fn().mockResolvedValue(testCase.content);
          }

          const result = await extractTextFromFile(file);

          switch (testCase.expectedRoute) {
            case 'text':
              expect(result).toBe(testCase.content);
              break;
            case 'pdf':
              expect(result).toContain('[PDF File:');
              break;
            case 'word':
              expect(result).toContain('[Word Document:');
              break;
          }
        }
      });

      it('should prioritize MIME type over file extension', async () => {
        // File with .txt extension but PDF MIME type
        const misleadingFile = new File(['content'], 'document.txt', {
          type: 'application/pdf',
          size: 1024
        });

        const result = await extractTextFromFile(misleadingFile);

        // Should be treated as PDF based on MIME type, not extension
        expect(result).toContain('[PDF File: document.txt]');
        expect(result).toContain('[Note: PDF text extraction needs server-side processing');
      });
    });

    describe('Performance and reliability', () => {
      it('should handle concurrent extractions', async () => {
        const files = Array(5).fill().map((_, i) => {
          const content = `Content for file ${i}`;
          const file = new File([content], `file${i}.txt`, {
            type: 'text/plain'
          });
          file.text = jest.fn().mockResolvedValue(content);
          return { file, content };
        });

        const promises = files.map(({ file }) => extractTextFromFile(file));
        const results = await Promise.all(promises);

        expect(results).toHaveLength(5);
        results.forEach((result, index) => {
          expect(result).toBe(`Content for file ${index}`);
        });
      });

      it('should maintain consistent results across multiple extractions', async () => {
        const content = 'Consistent content';
        const file = new File([content], 'consistent.txt', {
          type: 'text/plain'
        });
        file.text = jest.fn().mockResolvedValue(content);

        const results = await Promise.all([
          extractTextFromFile(file),
          extractTextFromFile(file),
          extractTextFromFile(file)
        ]);

        expect(results).toHaveLength(3);
        expect(results[0]).toBe(content);
        expect(results[1]).toBe(content);
        expect(results[2]).toBe(content);
        expect(file.text).toHaveBeenCalledTimes(3);
      });

      it('should handle rapid successive calls', async () => {
        const content = 'Rapid extraction test';
        const file = new File([content], 'rapid.txt', {
          type: 'text/plain'
        });
        file.text = jest.fn().mockResolvedValue(content);

        const startTime = Date.now();
        
        const promises = Array(10).fill().map(() => extractTextFromFile(file));
        const results = await Promise.all(promises);
        
        const endTime = Date.now();

        expect(results).toHaveLength(10);
        expect(results.every(result => result === content)).toBe(true);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });
});