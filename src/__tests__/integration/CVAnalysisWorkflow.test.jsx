/**
 * CV Analysis Workflow Integration Tests
 * Following TDD principles from GL-TESTING-GUIDELINES.md
 * Tests the complete flow from CV upload to analysis results
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupTest, createMockFile, SupabaseMockFactory, N8NMockFactory, fixtures } from '@/test';

// Mock all external dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

// Setup mocks
const mockSupabase = SupabaseMockFactory.createSuccessMock();
const mockN8N = N8NMockFactory.createGapAnalysisMock({
  matchScore: 85,
  gaps: ['TypeScript', 'GraphQL']
});

global.fetch = jest.fn();

const { getWrapper } = setupTest();

describe('CV Analysis Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup Supabase mock
    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabase);
    
    // Setup environment
    process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
    global.importMetaEnv = { PROD: false };
  });

  describe('Complete Analysis Flow', () => {
    it('should process CV through complete analysis pipeline', async () => {
      const user = userEvent.setup();
      
      // Use realistic fixture data
      const cvFixture = fixtures.cvs[0];
      const jdFixture = fixtures.jobDescriptions[0];
      
      // Dynamically import App to ensure mocks are in place
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText(/Welcome to AgenticV Terminal/)).toBeInTheDocument();
      });
      
      // STEP 1: Upload CV
      const cvFile = createMockFile({
        name: 'sarah-johnson-cv.pdf',
        type: 'application/pdf',
        size: 2 * 1024 * 1024 // 2MB
      });
      
      // Mock successful upload
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv-uploads/sarah-johnson-cv.pdf' },
        error: null
      });
      
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      await waitFor(() => {
        expect(screen.getByText(/CV uploaded successfully/)).toBeInTheDocument();
      });
      
      // STEP 2: Input Job Description
      const jdTextarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(jdTextarea, jdFixture.job_title + ' - ' + jdFixture.required_skills.join(', '));
      
      const processJDButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processJDButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Job description processed successfully/i)).toBeInTheDocument();
      });
      
      // STEP 3: Run Analysis
      // Mock N8N analysis response
      fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({
          output: JSON.stringify({
            cv_highlighting: [
              { address: 'skills[0]', class: 'highlight-match', reason: 'JavaScript match' },
              { address: 'skills[1]', class: 'highlight-gap', reason: 'TypeScript missing' }
            ],
            jd_highlighting: [
              { address: 'required_skills[0]', class: 'highlight-match', reason: 'Candidate has React' }
            ],
            match_score: {
              overall: 85,
              skills: 80,
              experience: 90,
              education: 100,
              qualifications: 75
            }
          })
        }))
      });
      
      const analyzeButton = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Analysis complete!/i)).toBeInTheDocument();
      });
      
      // STEP 4: Verify Results Display
      expect(screen.getByText('Gap Analysis Results')).toBeInTheDocument();
      expect(screen.getByText(/Overall Match:/)).toBeInTheDocument();
      expect(screen.getByText(/85%/)).toBeInTheDocument();
      
      // Verify both CV and JD sections are displayed
      expect(screen.getByText('CV Analysis')).toBeInTheDocument();
      expect(screen.getByText('Job Description Analysis')).toBeInTheDocument();
    });

    it('should handle errors gracefully throughout the workflow', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // STEP 1: Simulate upload error
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: null,
        error: new Error('Upload failed')
      });
      
      const cvFile = createMockFile({
        name: 'test-cv.pdf',
        type: 'application/pdf'
      });
      
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      await waitFor(() => {
        expect(screen.getByText(/Upload failed/i)).toBeInTheDocument();
      });
      
      // Should show retry button
      expect(screen.getByRole('button', { name: /retry upload/i })).toBeInTheDocument();
      
      // STEP 2: Retry with success
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv-uploads/test-cv.pdf' },
        error: null
      });
      
      const retryButton = screen.getByRole('button', { name: /retry upload/i });
      await user.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText(/CV uploaded successfully/)).toBeInTheDocument();
      });
    });

    it('should allow starting new analysis after completion', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // Complete a full analysis flow (simplified)
      const cvFile = createMockFile({ name: 'cv.pdf', type: 'application/pdf' });
      
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv-uploads/cv.pdf' },
        error: null
      });
      
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      const jdTextarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(jdTextarea, 'Senior Developer position');
      
      const processJDButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processJDButton);
      
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
      
      const analyzeButton = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(analyzeButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Analysis complete!/i)).toBeInTheDocument();
      });
      
      // Click New Analysis
      const newAnalysisButton = screen.getByRole('button', { name: /New Analysis/i });
      await user.click(newAnalysisButton);
      
      // Should reset to initial state
      expect(screen.getByText('> Upload CV Document')).toBeInTheDocument();
      expect(screen.getByText('> Job Description')).toBeInTheDocument();
      expect(screen.queryByText('Gap Analysis Results')).not.toBeInTheDocument();
    });
  });

  describe('Data Persistence', () => {
    it('should maintain session ID throughout workflow', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // Upload CV
      const cvFile = createMockFile({ name: 'cv.pdf', type: 'application/pdf' });
      
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv-uploads/cv.pdf' },
        error: null
      });
      
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      // Process JD
      const jdTextarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(jdTextarea, 'Job description text');
      
      const processJDButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processJDButton);
      
      // Run analysis
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
      
      const analyzeButton = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(analyzeButton);
      
      // Verify fetch was called with sessionId
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: expect.stringContaining('sessionId')
          })
        );
      });
    });

    it('should preserve CV and JD data through analysis', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      const cvUrl = 'https://storage.example.com/cv.pdf';
      const jdText = 'Detailed job description';
      
      // Upload CV
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv-uploads/cv.pdf' },
        error: null
      });
      
      mockSupabase.storage.from().getPublicUrl.mockReturnValueOnce({
        data: { publicUrl: cvUrl }
      });
      
      const cvFile = createMockFile({ name: 'cv.pdf', type: 'application/pdf' });
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      // Input JD
      const jdTextarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(jdTextarea, jdText);
      
      const processJDButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processJDButton);
      
      // Run analysis
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
      
      const analyzeButton = screen.getByRole('button', { name: /ANALYSE/i });
      await user.click(analyzeButton);
      
      // Verify data was passed to analysis
      await waitFor(() => {
        const fetchCall = fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        
        expect(body.cvUrl).toBe(cvUrl);
        expect(body.jobDescription).toBe(jdText);
      });
    });
  });

  describe('Performance and UX', () => {
    it('should show appropriate loading states', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // Upload CV with delayed response
      let resolveUpload;
      mockSupabase.storage.from().upload.mockImplementationOnce(
        () => new Promise(resolve => { resolveUpload = resolve; })
      );
      
      const cvFile = createMockFile({ name: 'cv.pdf', type: 'application/pdf' });
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      // Should show uploading state
      expect(screen.getByText(/Uploading/i)).toBeInTheDocument();
      
      // Resolve upload
      resolveUpload({ data: { path: 'cv.pdf' }, error: null });
      
      await waitFor(() => {
        expect(screen.getByText(/CV uploaded successfully/)).toBeInTheDocument();
      });
    });

    it('should disable inputs during processing', async () => {
      const user = userEvent.setup();
      const { default: App } = await import('../../App');
      
      render(<App />);
      
      // Upload CV
      mockSupabase.storage.from().upload.mockResolvedValueOnce({
        data: { path: 'cv.pdf' },
        error: null
      });
      
      const cvFile = createMockFile({ name: 'cv.pdf', type: 'application/pdf' });
      const uploadInput = screen.getByLabelText(/drop cv here/i);
      await user.upload(uploadInput, cvFile);
      
      await waitFor(() => {
        expect(screen.getByText(/CV uploaded successfully/)).toBeInTheDocument();
      });
      
      // Process JD with delay
      const jdTextarea = screen.getByPlaceholderText(/Paste job description here/i);
      await user.type(jdTextarea, 'Job description');
      
      const processJDButton = screen.getByRole('button', { name: /PROCESS JD/i });
      await user.click(processJDButton);
      
      // Should disable textarea during processing
      expect(jdTextarea).toBeDisabled();
      
      await waitFor(() => {
        expect(screen.getByText(/Job description processed successfully/i)).toBeInTheDocument();
      });
    });
  });
});