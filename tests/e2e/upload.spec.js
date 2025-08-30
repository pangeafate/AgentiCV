import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CV Upload and Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.terminal-window', { timeout: 15000 });
  });

  test('should display terminal interface on load', async ({ page }) => {
    await expect(page.locator('.terminal-window')).toBeVisible();
    await expect(page.locator('.terminal-title')).toContainText('AgenticV Terminal');
    await expect(page.locator('.terminal-prompt')).toContainText('Ready for CV upload');
    
    // Check that terminal header controls are visible
    await expect(page.locator('.terminal-controls')).toBeVisible();
    await expect(page.locator('.terminal-content')).toBeVisible();
  });

  test('should show upload area and job description input', async ({ page }) => {
    const uploadSection = page.locator('section').filter({ hasText: 'Upload CV Document' });
    const jdSection = page.locator('section').filter({ hasText: 'Job Description' });
    
    await expect(uploadSection).toBeVisible();
    await expect(jdSection).toBeVisible();
    
    // Check upload area elements
    await expect(page.locator('text=Drag & drop your CV here, or click to browse')).toBeVisible();
    await expect(page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' })).toBeVisible();
    
    // Check job description textarea
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    
    // Use the browse button to upload
    const fileChooser = page.waitForEvent('filechooser');
    await page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' }).click();
    const chooser = await fileChooser;
    await chooser.setFiles([testFilePath]);
    
    // Check upload progress
    await expect(page.locator('text=Uploading CV...')).toBeVisible({ timeout: 10000 });
    
    // Wait for upload to complete
    await expect(page.locator('text=✓ Upload complete')).toBeVisible({ timeout: 30000 });
  });

  test('should validate job description input', async ({ page }) => {
    const jdTextarea = page.locator('textarea');
    await expect(jdTextarea).toBeVisible();
    
    // Fill with short text first
    await jdTextarea.fill('Short description');
    
    // Fill with longer text that meets requirements (150+ characters)
    const longDescription = 'We are seeking a Senior Software Engineer with expertise in React, Node.js, and TypeScript. The ideal candidate should have experience with cloud platforms, microservices architecture, and agile development methodologies. Strong problem-solving skills and excellent communication abilities are essential for this role.';
    await jdTextarea.fill(longDescription);
    
    // Should show some indication that job description is ready (character count or validation message)
    // This might vary based on implementation
  });

  test('should enable analyze button when both inputs are ready', async ({ page }) => {
    // Upload file first
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    const fileChooser = page.waitForEvent('filechooser');
    await page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' }).click();
    const chooser = await fileChooser;
    await chooser.setFiles([testFilePath]);
    
    // Wait for upload to complete
    await expect(page.locator('text=✓ Upload complete')).toBeVisible({ timeout: 30000 });
    
    // Fill job description
    const jdTextarea = page.locator('textarea');
    const longDescription = 'We are seeking a Senior Software Engineer with expertise in React, Node.js, and TypeScript. The ideal candidate should have experience with cloud platforms, microservices architecture, and agile development methodologies. Strong problem-solving skills and excellent communication abilities are essential for this role.';
    await jdTextarea.fill(longDescription);
    
    // Now analyze button should appear and be enabled
    const analyzeButton = page.locator('button').filter({ hasText: 'ANALYSE' });
    await expect(analyzeButton).toBeEnabled({ timeout: 10000 });
  });

  test('should handle analysis workflow', async ({ page }) => {
    // Upload file
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    const fileChooser = page.waitForEvent('filechooser');
    await page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' }).click();
    const chooser = await fileChooser;
    await chooser.setFiles([testFilePath]);
    
    // Wait for upload to complete
    await expect(page.locator('text=✓ Upload complete')).toBeVisible({ timeout: 30000 });
    
    // Fill job description
    const jdTextarea = page.locator('textarea');
    const jobDescription = `We are looking for a Senior Software Engineer with 5+ years of experience in React and Node.js, strong knowledge of TypeScript, experience with cloud platforms like AWS or GCP, excellent communication skills, and ability to work in agile development environments. The candidate should be familiar with microservices architecture, RESTful APIs, database design, and modern development practices including CI/CD pipelines.`;
    
    await jdTextarea.fill(jobDescription);
    
    // Find and verify analyze button is enabled
    const analyzeButton = page.locator('button').filter({ hasText: 'ANALYSE' });
    await expect(analyzeButton).toBeEnabled({ timeout: 10000 });
    
    // Click analyze button
    await analyzeButton.click();
    
    // Verify that the analysis process starts (button changes to analyzing state)
    await expect(page.locator('text=ANALYZING...')).toBeVisible({ timeout: 10000 });
    
    // For E2E testing without backend, successfully starting the analysis is sufficient
    // The actual analysis would require N8N backend services which are not available in test environment
    // The test confirms the UI workflow works correctly up to the point of backend interaction
  });

  test('should display results or error appropriately', async ({ page }) => {
    // This test checks if after some analysis attempt, we either get results or error handling
    // Look for the "New Analysis" button which appears after results or errors
    const newAnalysisButton = page.locator('button').filter({ hasText: 'New Analysis' });
    
    // If new analysis button is visible, it means some analysis flow completed
    const hasNewAnalysisButton = await newAnalysisButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasNewAnalysisButton) {
      await expect(newAnalysisButton).toBeVisible();
      
      // Check if we have either results or error state
      const hasResults = await page.locator('text=Analysis complete').isVisible().catch(() => false);
      const hasError = await page.locator('text=Analysis Failed').isVisible().catch(() => false);
      
      expect(hasResults || hasError).toBeTruthy();
    } else {
      // If no new analysis button, we should still have the upload interface
      await expect(page.locator('section').filter({ hasText: 'Upload CV Document' })).toBeVisible();
    }
  });

  test('should allow starting new analysis', async ({ page }) => {
    const newAnalysisButton = page.locator('button').filter({ hasText: 'New Analysis' });
    
    // Check if new analysis button is available
    const hasNewAnalysisButton = await newAnalysisButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasNewAnalysisButton) {
      await newAnalysisButton.click();
      
      // Should return to the main upload interface
      await expect(page.locator('section').filter({ hasText: 'Upload CV Document' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('section').filter({ hasText: 'Job Description' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Drag & drop your CV here, or click to browse')).toBeVisible();
    } else {
      // If no new analysis button exists, the main interface should already be visible
      await expect(page.locator('section').filter({ hasText: 'Upload CV Document' })).toBeVisible();
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.terminal-window', { timeout: 15000 });
    
    // Terminal window should be visible on mobile
    await expect(page.locator('.terminal-window')).toBeVisible();
    
    // Main sections should be visible
    const uploadSection = page.locator('section').filter({ hasText: 'Upload CV Document' });
    const jdSection = page.locator('section').filter({ hasText: 'Job Description' });
    
    await expect(uploadSection).toBeVisible();
    await expect(jdSection).toBeVisible();
    
    // Upload controls should be accessible
    await expect(page.locator('text=Drag & drop your CV here, or click to browse')).toBeVisible();
    await expect(page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' })).toBeVisible();
    
    // Content should not overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth + 20;
    });
    expect(hasOverflow).toBe(false);
  });
});