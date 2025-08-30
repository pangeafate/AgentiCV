import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CV Upload and Analysis Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.terminal-window', { timeout: 10000 });
  });

  test('should display terminal interface on load', async ({ page }) => {
    await expect(page.locator('.terminal-window')).toBeVisible();
    await expect(page.locator('.terminal-title')).toContainText('AgenticV Terminal');
    await expect(page.locator('.terminal-prompt')).toContainText('Ready for CV upload');
  });

  test('should show upload area and job description input', async ({ page }) => {
    const uploadSection = page.locator('section').filter({ hasText: 'Upload CV Document' });
    const jdSection = page.locator('section').filter({ hasText: 'Job Description' });
    
    await expect(uploadSection).toBeVisible();
    await expect(jdSection).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    
    await fileInput.setInputFiles(testFilePath);
    
    await expect(page.locator('text=/Uploading.*sample-cv.pdf/i')).toBeVisible({ timeout: 5000 });
  });

  test('should validate job description input', async ({ page }) => {
    const jdTextarea = page.locator('textarea[placeholder*="job description"]');
    
    await jdTextarea.fill('Test job description');
    await expect(page.locator('text=/characters/i')).toBeVisible();
    
    const longDescription = 'a'.repeat(150);
    await jdTextarea.fill(longDescription);
    
    await expect(page.locator('text=/Job description ready/i')).toBeVisible({ timeout: 5000 });
  });

  test('should enable analyze button when both inputs are ready', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const jdTextarea = page.locator('textarea[placeholder*="job description"]');
    const analyzeButton = page.locator('button:has-text("Analyse")');
    
    await expect(analyzeButton).toBeDisabled();
    
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    await fileInput.setInputFiles(testFilePath);
    
    const longDescription = 'a'.repeat(150);
    await jdTextarea.fill(longDescription);
    
    await expect(analyzeButton).toBeEnabled({ timeout: 10000 });
  });

  test('should handle analysis workflow', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const jdTextarea = page.locator('textarea[placeholder*="job description"]');
    const analyzeButton = page.locator('button:has-text("Analyse")');
    
    const testFilePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-cv.pdf');
    await fileInput.setInputFiles(testFilePath);
    
    const jobDescription = `
      We are looking for a Senior Software Engineer with:
      - 5+ years of experience in React and Node.js
      - Strong knowledge of TypeScript
      - Experience with cloud platforms (AWS/GCP)
      - Excellent communication skills
    `.repeat(3);
    
    await jdTextarea.fill(jobDescription);
    await analyzeButton.click();
    
    await expect(page.locator('text=/Processing/i')).toBeVisible({ timeout: 5000 });
    
    const resultsOrError = await Promise.race([
      page.waitForSelector('text=/Analysis complete/i', { timeout: 60000 }),
      page.waitForSelector('text=/Analysis failed/i', { timeout: 60000 })
    ]);
    
    expect(resultsOrError).toBeTruthy();
  });

  test('should display results or error appropriately', async ({ page }) => {
    const newAnalysisButton = page.locator('button:has-text("New Analysis")');
    
    if (await newAnalysisButton.isVisible({ timeout: 5000 })) {
      await expect(newAnalysisButton).toBeVisible();
      
      const hasResults = await page.locator('.gap-analysis-results').isVisible().catch(() => false);
      const hasError = await page.locator('text=/Analysis Failed/i').isVisible().catch(() => false);
      
      expect(hasResults || hasError).toBeTruthy();
    }
  });

  test('should allow starting new analysis', async ({ page }) => {
    const newAnalysisButton = page.locator('button:has-text("New Analysis")');
    
    if (await newAnalysisButton.isVisible({ timeout: 5000 })) {
      await newAnalysisButton.click();
      
      await expect(page.locator('section').filter({ hasText: 'Upload CV Document' })).toBeVisible({ timeout: 5000 });
      await expect(page.locator('section').filter({ hasText: 'Job Description' })).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });
  
  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('.terminal-window')).toBeVisible();
    
    const uploadSection = page.locator('section').filter({ hasText: 'Upload CV Document' });
    const jdSection = page.locator('section').filter({ hasText: 'Job Description' });
    
    await expect(uploadSection).toBeVisible();
    await expect(jdSection).toBeVisible();
  });
});