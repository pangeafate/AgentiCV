import { test, expect } from '@playwright/test';

test.describe('Application Deployment Tests', () => {
  test.describe('Local Environment Tests', () => {
    test('should load application on local server', async ({ page }) => {
      await page.goto('/');
      
      // Check that page loads successfully
      await expect(page).toHaveTitle(/AgenticV/i);
      
      // Check that terminal window is visible
      await expect(page.locator('.terminal-window')).toBeVisible({ timeout: 15000 });
      
      // Check that main content is visible
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
      
      // Verify no JavaScript errors during initial load
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    });

    test('should serve static assets correctly on local', async ({ page }) => {
      await page.goto('/');
      
      // Wait for app to load
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check that terminal theme CSS is loaded
      const hasTerminalStyling = await page.evaluate(() => {
        const body = document.body;
        const styles = getComputedStyle(body);
        const bgColor = styles.backgroundColor;
        const fontFamily = styles.fontFamily;
        
        // Should have dark background and monospace font
        const isDarkBg = bgColor.includes('rgb(10, 10, 10)') || bgColor.includes('rgb(0, 0, 0)');
        const hasMonoFont = fontFamily.toLowerCase().includes('mono');
        
        return isDarkBg && hasMonoFont;
      });
      expect(hasTerminalStyling).toBe(true);
      
      // Check for React app mounting
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
      await expect(reactRoot).not.toBeEmpty();
    });
  });

  test.describe('Production Build Tests', () => {
    test('should have production build characteristics', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check that page loads successfully
      await expect(page).toHaveTitle(/AgenticV/i);
      
      // Check that main content is visible
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
      
      // Verify the page is fully loaded
      await page.waitForLoadState('domcontentloaded');
      const isLoaded = await page.evaluate(() => document.readyState === 'complete');
      expect(isLoaded).toBe(true);
    });

    test('should have correct terminal styling in production', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check that CSS is loaded and applied
      const hasTerminalStyling = await page.evaluate(() => {
        const body = document.body;
        const styles = getComputedStyle(body);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        const fontFamily = styles.fontFamily;
        
        // Should have dark background, green text, and monospace font (terminal theme)
        const isDarkBg = bgColor.includes('rgb(10, 10, 10)') || bgColor.includes('rgb(0, 0, 0)');
        const isGreenText = textColor.includes('rgb(0, 255, 0)') || textColor.includes('#00ff00');
        const hasMonoFont = fontFamily.toLowerCase().includes('mono');
        
        return isDarkBg && isGreenText && hasMonoFont;
      });
      expect(hasTerminalStyling).toBe(true);
      
      // Check for React app mounting
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
      await expect(reactRoot).not.toBeEmpty();
    });

    test('should handle asset loading correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Verify that assets are loaded correctly
      const hasWorkingAssets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        
        // Check that assets are being loaded
        return links.length > 0 || scripts.length > 0;
      });
      expect(hasWorkingAssets).toBe(true);
      
      // Check that fonts are loaded
      const hasFonts = await page.evaluate(() => {
        const fontLinks = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'));
        return fontLinks.length > 0;
      });
      expect(hasFonts).toBe(true);
    });

    test('should handle network requests correctly', async ({ page }) => {
      const responses = [];
      page.on('response', response => responses.push(response));
      
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check that most responses are successful
      const successfulResponses = responses.filter(r => r.status() < 400);
      const totalResponses = responses.length;
      
      // At least 80% of requests should be successful
      expect(successfulResponses.length / totalResponses).toBeGreaterThan(0.8);
    });

    test('should handle non-existent routes gracefully', async ({ page }) => {
      // Try to navigate to a non-existent route
      const response = await page.goto('/nonexistent-page');
      
      // For SPA, this should still load the main app or show appropriate error
      // Status could be 200 (SPA handles routing) or 404 (server handles)
      expect(response.status()).toBeLessThan(500);
    });

    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Should load within 15 seconds (reasonable for local development)
      expect(loadTime).toBeLessThan(15000);
    });

    test('should be accessible via direct URL', async ({ page }) => {
      // Test direct navigation
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Should load successfully
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title).toContain('AgenticV');
      
      // Should have content
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(100);
    });

    test('should handle browser refresh correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Wait for initial load
      await page.waitForLoadState('networkidle');
      
      // Refresh the page
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should still work after refresh
      await expect(page.locator('.terminal-window')).toBeVisible({ timeout: 15000 });
      
      // Should maintain functionality
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
      await expect(reactRoot).not.toBeEmpty();
    });

    test('should work in different browsers', async ({ browserName, page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Basic functionality should work across browsers
      const isReactAppLoaded = await page.evaluate(() => {
        return document.querySelector('#root') && document.querySelector('#root').children.length > 0;
      });
      expect(isReactAppLoaded).toBe(true);
      
      // Check terminal window is visible
      await expect(page.locator('.terminal-window')).toBeVisible();
      
      console.log(`Deployment test passed in ${browserName}`);
    });
  });

  test.describe('Core Functionality Tests', () => {
    test('should have consistent core functionality', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Core functionality should work
      await expect(page.locator('text=Drag & drop your CV here, or click to browse')).toBeVisible();
      
      // Terminal theme should be present
      const hasTerminalTheme = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return styles.fontFamily.toLowerCase().includes('mono') && styles.color.includes('255');
      });
      expect(hasTerminalTheme).toBe(true);
      
      // Main sections should be visible
      await expect(page.locator('section').filter({ hasText: 'Upload CV Document' })).toBeVisible();
      await expect(page.locator('section').filter({ hasText: 'Job Description' })).toBeVisible();
    });

    test('should maintain responsive design', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Terminal window should be visible on mobile
      await expect(page.locator('.terminal-window')).toBeVisible();
      
      // Content should not overflow horizontally
      const isResponsive = await page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth + 50; // Allow small margin
      });
      expect(isResponsive).toBe(true);
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      const isTabletResponsive = await page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth + 50;
      });
      expect(isTabletResponsive).toBe(true);
    });
  });

  test.describe('Performance Tests', () => {
    test('should have reasonable bundle size', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      // Check resource sizes
      const resourceSizes = await page.evaluate(() => {
        return performance.getEntriesByType('resource').reduce((total, resource) => {
          return total + (resource.transferSize || resource.encodedBodySize || 0);
        }, 0);
      });
      
      // Should be under 10MB total (reasonable for a React app with fonts and assets)
      expect(resourceSizes).toBeLessThan(10 * 1024 * 1024);
    });

    test('should have acceptable loading performance', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      const loadTime = Date.now() - startTime;
      
      // Initial load should be reasonable
      expect(loadTime).toBeLessThan(15000);
      
      // Check that DOM is interactive
      const readyState = await page.evaluate(() => document.readyState);
      expect(readyState).toBe('complete');
    });
  });

  test.describe('SEO and Metadata', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check for essential meta tags
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      expect(title).toContain('AgenticV');
      
      // Check for viewport meta tag
      const viewportMeta = page.locator('meta[name="viewport"]');
      await expect(viewportMeta).toBeAttached();
      
      // Check for charset meta tag
      const charsetMeta = page.locator('meta[charset]');
      await expect(charsetMeta).toBeAttached();
    });

    test('should be crawlable by search engines', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.terminal-window', { timeout: 15000 });
      
      // Check that content is rendered and not just empty divs
      const textContent = await page.textContent('body');
      expect(textContent.trim().length).toBeGreaterThan(100);
      expect(textContent).toContain('AgenticV Terminal');
      expect(textContent).toContain('Upload CV Document');
      
      // Check for semantic HTML structure
      const hasHeadings = await page.locator('h1, h2, h3').count();
      expect(hasHeadings).toBeGreaterThan(0);
      
      // Check for proper document structure (should have multiple sections)
      const sectionCount = await page.locator('section').count();
      expect(sectionCount).toBeGreaterThan(0);
    });
  });
});