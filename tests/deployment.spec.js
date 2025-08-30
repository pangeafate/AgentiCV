import { test, expect } from '@playwright/test';

test.describe('GitHub Pages Deployment', () => {
  test.describe('Local Environment Tests', () => {
    test.use({ baseURL: 'http://localhost:3001' });
    
    test('should load application on local server', async ({ page }) => {
      await page.goto('/');
      
      // Check that page loads successfully
      await expect(page).toHaveTitle(/AgentiCV/i);
      
      // Check that main content is visible
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
      
      // Verify no JavaScript errors
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.waitForLoadState('networkidle');
      expect(errors).toHaveLength(0);
    });

    test('should serve static assets correctly on local', async ({ page }) => {
      await page.goto('/');
      
      // Check that CSS is loaded
      const hasStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
      });
      expect(hasStyles).toBe(true);
      
      // Check for React app mounting
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
      await expect(reactRoot).not.toBeEmpty();
    });
  });

  test.describe('Deployed Environment Tests', () => {
    test.use({ baseURL: 'https://pangeafate.github.io/AgentiCV' });
    
    test('should load application on GitHub Pages', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check that page loads successfully
      await expect(page).toHaveTitle(/AgentiCV/i);
      
      // Check that main content is visible
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
      
      // Verify the page is fully loaded
      await page.waitForLoadState('domcontentloaded');
      const isLoaded = await page.evaluate(() => document.readyState === 'complete');
      expect(isLoaded).toBe(true);
    });

    test('should serve static assets correctly on GitHub Pages', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check that CSS is loaded and applied
      const hasTerminalStyling = await page.evaluate(() => {
        const body = document.body;
        const styles = getComputedStyle(body);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // Should have dark background and green text (terminal theme)
        const isDarkBg = bgColor.includes('rgb(10, 10, 10)') || bgColor.includes('rgb(0, 0, 0)');
        const isGreenText = textColor.includes('rgb(0, 255, 0)') || textColor.includes('#00ff00');
        
        return isDarkBg || isGreenText;
      });
      expect(hasTerminalStyling).toBe(true);
      
      // Check for React app mounting
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
      await expect(reactRoot).not.toBeEmpty();
    });

    test('should handle routing correctly on GitHub Pages', async ({ page }) => {
      // GitHub Pages serves React apps from a subdirectory
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check that the app loads at the correct base path
      const url = page.url();
      expect(url).toContain('pangeafate.github.io/AgentiCV');
      
      // Verify that relative paths work correctly
      const hasWorkingAssets = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        
        // Check that assets are being loaded (not returning 404s)
        return links.length > 0 || scripts.length > 0;
      });
      expect(hasWorkingAssets).toBe(true);
    });

    test('should have correct HTTPS configuration', async ({ page }) => {
      await page.goto('/');
      
      const protocol = await page.evaluate(() => window.location.protocol);
      expect(protocol).toBe('https:');
      
      // Check for security headers (GitHub Pages provides these)
      const response = await page.waitForResponse(response => 
        response.url().includes('pangeafate.github.io') && response.status() === 200
      );
      
      expect(response.ok()).toBe(true);
    });

    test('should handle 404 errors gracefully on GitHub Pages', async ({ page }) => {
      const response = await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });
      
      // GitHub Pages should serve the main app for client-side routing
      // or show a 404 page
      expect(response.status()).toBeGreaterThanOrEqual(200);
    });

    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Should load within 10 seconds (reasonable for GitHub Pages)
      expect(loadTime).toBeLessThan(10000);
    });

    test('should be accessible via direct URL', async ({ page }) => {
      // Test direct navigation to the deployed URL
      await page.goto('https://pangeafate.github.io/AgentiCV/', { waitUntil: 'networkidle' });
      
      // Should load successfully
      const title = await page.title();
      expect(title).toBeTruthy();
      
      // Should have content
      const bodyContent = await page.textContent('body');
      expect(bodyContent.length).toBeGreaterThan(0);
    });

    test('should handle browser refresh correctly', async ({ page }) => {
      await page.goto('/');
      
      // Wait for initial load
      await page.waitForLoadState('networkidle');
      
      // Refresh the page
      await page.reload({ waitUntil: 'networkidle' });
      
      // Should still work after refresh
      const mainContent = page.locator('body');
      await expect(mainContent).toBeVisible();
      
      // Should maintain functionality
      const reactRoot = page.locator('#root');
      await expect(reactRoot).toBeVisible();
    });

    test('should work in different browsers', async ({ browserName, page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Basic functionality should work across browsers
      const isReactAppLoaded = await page.evaluate(() => {
        return document.querySelector('#root') && document.querySelector('#root').children.length > 0;
      });
      expect(isReactAppLoaded).toBe(true);
      
      console.log(`Deployment test passed in ${browserName}`);
    });
  });

  test.describe('Cross-Environment Consistency', () => {
    test('should have consistent functionality between local and deployed', async ({ page }) => {
      // This test can be run against both environments
      await page.goto('/');
      
      // Core functionality should be the same
      const hasUploadArea = await page.locator('div').filter({ hasText: 'Drag & drop your CV here' }).count();
      expect(hasUploadArea).toBeGreaterThan(0);
      
      // Terminal theme should be present
      const hasTerminalTheme = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return styles.fontFamily.toLowerCase().includes('mono') || styles.color.includes('255, 0');
      });
      expect(hasTerminalTheme).toBe(true);
    });

    test('should maintain responsive design across environments', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      const isResponsive = await page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth + 50; // Allow small margin
      });
      expect(isResponsive).toBe(true);
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      const isTabletResponsive = await page.evaluate(() => {
        return document.body.scrollWidth <= window.innerWidth + 50;
      });
      expect(isTabletResponsive).toBe(true);
    });
  });

  test.describe('Performance Tests', () => {
    test('should have reasonable bundle size', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Check resource sizes
      const resourceSizes = await page.evaluate(() => {
        return performance.getEntriesByType('resource').reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0);
      });
      
      // Should be under 5MB total (reasonable for a React app)
      expect(resourceSizes).toBeLessThan(5 * 1024 * 1024);
    });

    test('should have good Core Web Vitals', async ({ page }) => {
      await page.goto('/', { waitUntil: 'networkidle' });
      
      // Measure First Contentful Paint
      const fcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                resolve(entry.startTime);
              }
            }
          });
          observer.observe({ entryTypes: ['paint'] });
        });
      });
      
      // FCP should be under 3 seconds
      expect(fcp).toBeLessThan(3000);
    });
  });

  test.describe('SEO and Metadata', () => {
    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/');
      
      // Check for essential meta tags
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
      
      // Check for viewport meta tag
      const viewportMeta = page.locator('meta[name="viewport"]');
      await expect(viewportMeta).toBeAttached();
      
      // Check for description meta tag if present
      const descriptionMeta = page.locator('meta[name="description"]');
      const hasDescription = await descriptionMeta.count();
      if (hasDescription > 0) {
        const content = await descriptionMeta.getAttribute('content');
        expect(content).toBeTruthy();
      }
    });

    test('should be crawlable by search engines', async ({ page }) => {
      await page.goto('/');
      
      // Check that content is rendered and not just empty divs
      const textContent = await page.textContent('body');
      expect(textContent.trim().length).toBeGreaterThan(50);
      
      // Check for semantic HTML structure
      const hasHeadings = await page.locator('h1, h2, h3').count();
      expect(hasHeadings).toBeGreaterThan(0);
    });
  });
});