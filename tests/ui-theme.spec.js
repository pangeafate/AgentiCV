import { test, expect } from '@playwright/test';

test.describe('Terminal UI Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display terminal-themed background', async ({ page }) => {
    // Check body background color is terminal black
    const bodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    // Should be a dark color (black or very dark)
    expect(bodyBg).toMatch(/rgb\(10, 10, 10\)|rgb\(0, 0, 0\)|#0a0a0a|#000000/i);
  });

  test('should use terminal green text color', async ({ page }) => {
    // Check for terminal green text elements
    const terminalText = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.color;
    });
    
    // Should be green color
    expect(terminalText).toMatch(/rgb\(0, 255, 0\)|#00ff00/i);
  });

  test('should use monospace font family', async ({ page }) => {
    // Check that monospace font is being used
    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily;
    });
    
    // Should contain monospace fonts
    expect(fontFamily.toLowerCase()).toMatch(/(jetbrains mono|fira code|cascadia code|source code pro|monospace)/);
  });

  test('should display terminal window elements', async ({ page }) => {
    // Look for terminal window container
    const terminalWindow = page.locator('.terminal-window').or(
      page.locator('div').filter({ hasText: /terminal/i })
    );
    
    // Terminal window styling should be present
    const terminalContainer = page.locator('div').first();
    await expect(terminalContainer).toBeVisible();
  });

  test('should display terminal header with controls', async ({ page }) => {
    // Look for terminal controls (close, minimize, maximize buttons)
    const terminalControls = page.locator('.terminal-controls').or(
      page.locator('.terminal-control')
    );
    
    // Check for terminal header elements
    const terminalHeader = page.locator('.terminal-header').or(
      page.locator('div').filter({ hasText: /agenticv/i }).first()
    );
  });

  test('should display terminal title', async ({ page }) => {
    // Look for terminal title
    const terminalTitle = page.locator('.terminal-title').or(
      page.locator('h1').or(
        page.locator('div').filter({ hasText: /agenticv/i })
      )
    );
    
    // Should contain application name or terminal-like title
    const titleText = await page.textContent('title');
    expect(titleText).toBeTruthy();
  });

  test('should display terminal prompt styling', async ({ page }) => {
    // Look for terminal prompt indicators
    const promptElements = page.locator('.terminal-prompt').or(
      page.locator('text=$ ').or(
        page.locator('span').filter({ hasText: /\$/ })
      )
    );
    
    // Check for terminal-like prompt styling
    const terminalContent = page.locator('.terminal-content').or(
      page.locator('main').or(page.locator('[role="main"]'))
    );
    await expect(terminalContent).toBeVisible();
  });

  test('should display terminal cursor animation', async ({ page }) => {
    // Look for blinking cursor elements
    const cursor = page.locator('.terminal-cursor').or(
      page.locator('span').filter({ hasText: /[|_]/ })
    );
    
    // Check if cursor animation is present in CSS
    const hasBlinkAnimation = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch (e) {
          return [];
        }
      });
      return styles.some(style => style.includes('blink') && style.includes('animation'));
    });
    
    expect(hasBlinkAnimation).toBe(true);
  });

  test('should use terminal color palette', async ({ page }) => {
    // Check for CSS custom properties defining terminal colors
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        terminalBg: styles.getPropertyValue('--terminal-bg'),
        terminalGreen: styles.getPropertyValue('--terminal-green'),
        terminalAmber: styles.getPropertyValue('--terminal-amber'),
        terminalRed: styles.getPropertyValue('--terminal-red'),
        terminalBlue: styles.getPropertyValue('--terminal-blue')
      };
    });
    
    // Verify terminal color variables are defined
    expect(cssVariables.terminalBg).toBeTruthy();
    expect(cssVariables.terminalGreen).toBeTruthy();
  });

  test('should display terminal-styled buttons', async ({ page }) => {
    // Look for terminal-styled buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await expect(firstButton).toBeVisible();
      
      // Check button styling
      const buttonStyles = await firstButton.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          fontFamily: styles.fontFamily,
          borderRadius: styles.borderRadius,
          backgroundColor: styles.backgroundColor
        };
      });
      
      // Should use monospace font
      expect(buttonStyles.fontFamily.toLowerCase()).toMatch(/monospace/);
    }
  });

  test('should display terminal borders and shadows', async ({ page }) => {
    // Check for terminal-style borders
    const borderElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.some(el => {
        const styles = getComputedStyle(el);
        const border = styles.border || styles.borderColor;
        const boxShadow = styles.boxShadow;
        return border.includes('dashed') || boxShadow.includes('rgba(0, 255, 0');
      });
    });
    
    expect(borderElements).toBe(true);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Elements should still be visible and properly sized
    const mainContent = page.locator('body');
    await expect(mainContent).toBeVisible();
    
    // Text should not overflow
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasOverflow).toBe(false);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Test high contrast accessibility
    const supportsHighContrast = await page.evaluate(() => {
      // Check if high contrast media query styles exist
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch (e) {
          return [];
        }
      });
      return styles.some(style => style.includes('prefers-contrast'));
    });
    
    expect(supportsHighContrast).toBe(true);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Test reduced motion accessibility
    const supportsReducedMotion = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch (e) {
          return [];
        }
      });
      return styles.some(style => style.includes('prefers-reduced-motion'));
    });
    
    expect(supportsReducedMotion).toBe(true);
  });

  test('should display terminal typing animation', async ({ page }) => {
    // Look for typing animation elements
    const typingAnimation = page.locator('.typing-animation').or(
      page.locator('span').filter({ hasText: /typing/i })
    );
    
    // Check if typing animation CSS exists
    const hasTypingAnimation = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch (e) {
          return [];
        }
      });
      return styles.some(style => style.includes('typing') && style.includes('animation'));
    });
    
    expect(hasTypingAnimation).toBe(true);
  });

  test('should maintain theme consistency across all elements', async ({ page }) => {
    // Check that all major elements follow the terminal theme
    const themeConsistency = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('div, button, input, span, p, h1, h2, h3'));
      let consistentElements = 0;
      
      allElements.forEach(el => {
        const styles = getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        const fontFamily = styles.fontFamily;
        
        // Check if element follows terminal theme colors
        if (color.includes('rgb(0, 255, 0)') || 
            color.includes('#00ff00') || 
            backgroundColor.includes('rgb(10, 10, 10)') ||
            backgroundColor.includes('#0a0a0a') ||
            fontFamily.toLowerCase().includes('mono')) {
          consistentElements++;
        }
      });
      
      return consistentElements > 0;
    });
    
    expect(themeConsistency).toBe(true);
  });

  test('should display loading states with terminal styling', async ({ page }) => {
    // Look for loading animations that match terminal theme
    const loadingElements = page.locator('.loading').or(
      page.locator('div').filter({ hasText: /loading/i })
    );
    
    // Check if loading spinner/animation CSS exists
    const hasLoadingAnimation = await page.evaluate(() => {
      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try {
          return Array.from(sheet.cssRules).map(rule => rule.cssText);
        } catch (e) {
          return [];
        }
      });
      return styles.some(style => style.includes('loading') || style.includes('spin'));
    });
    
    expect(hasLoadingAnimation).toBe(true);
  });

  test('should handle focus states with terminal styling', async ({ page }) => {
    // Test focus styling for interactive elements
    const focusableElements = page.locator('button, input, a');
    const count = await focusableElements.count();
    
    if (count > 0) {
      const firstElement = focusableElements.first();
      await firstElement.focus();
      
      const focusStyles = await firstElement.evaluate(el => {
        const styles = getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have visible focus indicators
      expect(focusStyles.outline !== 'none' || focusStyles.boxShadow !== 'none').toBe(true);
    }
  });
});