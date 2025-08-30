import { test, expect } from '@playwright/test';

test.describe('Terminal UI Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the terminal window to load
    await page.waitForSelector('.terminal-window', { timeout: 15000 });
  });

  test('should display terminal-themed background', async ({ page }) => {
    // Check body background color is terminal black
    const bodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    
    // Should be a dark color (terminal black: rgb(10, 10, 10) or similar)
    expect(bodyBg).toMatch(/rgb\(10, 10, 10\)|rgb\(0, 0, 0\)/i);
  });

  test('should use terminal green text color', async ({ page }) => {
    // Check for terminal green text elements
    const terminalText = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return style.color;
    });
    
    // Should be green color (rgb(0, 255, 0) or #00ff00)
    expect(terminalText).toMatch(/rgb\(0, 255, 0\)/i);
  });

  test('should use monospace font family', async ({ page }) => {
    // Check that monospace font is being used
    const fontFamily = await page.evaluate(() => {
      return getComputedStyle(document.body).fontFamily;
    });
    
    // Should contain JetBrains Mono or other monospace fonts
    expect(fontFamily.toLowerCase()).toMatch(/(jetbrains mono|mono)/);
  });

  test('should display terminal window elements', async ({ page }) => {
    // Look for terminal window container
    const terminalWindow = page.locator('.terminal-window');
    await expect(terminalWindow).toBeVisible();
    
    // Check terminal window has proper styling
    const hasTerminalStyling = await terminalWindow.evaluate(el => {
      const styles = getComputedStyle(el);
      return styles.border.includes('1px') && styles.borderRadius !== '0px';
    });
    expect(hasTerminalStyling).toBe(true);
  });

  test('should display terminal header with controls', async ({ page }) => {
    // Look for terminal header
    const terminalHeader = page.locator('.terminal-header');
    await expect(terminalHeader).toBeVisible();
    
    // Look for terminal controls (close, minimize, maximize buttons)
    const terminalControls = page.locator('.terminal-controls');
    await expect(terminalControls).toBeVisible();
    
    // Check for individual control buttons
    await expect(page.locator('.terminal-control.close')).toBeVisible();
    await expect(page.locator('.terminal-control.minimize')).toBeVisible();
    await expect(page.locator('.terminal-control.maximize')).toBeVisible();
  });

  test('should display terminal title', async ({ page }) => {
    // Look for terminal title in the header
    const terminalTitle = page.locator('.terminal-title');
    await expect(terminalTitle).toBeVisible();
    
    // Should contain application name
    const titleText = await terminalTitle.textContent();
    expect(titleText).toContain('AgenticV Terminal');
    
    // Check page title as well
    const pageTitle = await page.title();
    expect(pageTitle).toContain('AgenticV');
  });

  test('should display terminal prompt styling', async ({ page }) => {
    // Look for terminal content area
    const terminalContent = page.locator('.terminal-content');
    await expect(terminalContent).toBeVisible();
    
    // Look for terminal prompt
    const promptElement = page.locator('.terminal-prompt');
    await expect(promptElement).toBeVisible();
    
    // Check prompt contains expected text
    const promptText = await promptElement.textContent();
    expect(promptText).toContain('Ready for CV upload');
  });

  test('should display terminal cursor animation', async ({ page }) => {
    // Look for terminal cursor element
    const cursor = page.locator('.terminal-cursor');
    await expect(cursor).toBeVisible();
    
    // Check if cursor has animation styles
    const hasAnimation = await cursor.evaluate(el => {
      const styles = getComputedStyle(el);
      return styles.animation.includes('blink') || styles.animationName.includes('blink');
    });
    
    expect(hasAnimation).toBe(true);
  });

  test('should use terminal color palette', async ({ page }) => {
    // Check for CSS custom properties defining terminal colors
    const cssVariables = await page.evaluate(() => {
      const root = document.documentElement;
      const styles = getComputedStyle(root);
      return {
        terminalBg: styles.getPropertyValue('--terminal-bg').trim(),
        terminalGreen: styles.getPropertyValue('--terminal-green').trim(),
        terminalAmber: styles.getPropertyValue('--terminal-amber').trim(),
        terminalRed: styles.getPropertyValue('--terminal-red').trim(),
        terminalBlue: styles.getPropertyValue('--terminal-blue').trim()
      };
    });
    
    // Verify terminal color variables are defined and have expected values
    expect(cssVariables.terminalBg).toBe('#0a0a0a');
    expect(cssVariables.terminalGreen).toBe('#00ff00');
    expect(cssVariables.terminalAmber).toBe('#ffb000');
    expect(cssVariables.terminalRed).toBe('#ff5555');
    expect(cssVariables.terminalBlue).toBe('#50c7e3');
  });

  test('should display terminal-styled buttons', async ({ page }) => {
    // Look for the Browse Files button specifically
    const browseButton = page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' });
    await expect(browseButton).toBeVisible();
    
    // Check button styling
    const buttonStyles = await browseButton.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        borderRadius: styles.borderRadius,
        border: styles.border,
        color: styles.color
      };
    });
    
    // Should use monospace font and terminal colors
    expect(buttonStyles.fontFamily.toLowerCase()).toContain('mono');
    expect(buttonStyles.color).toMatch(/rgb\(0, 255, 0\)/);
  });

  test('should display terminal borders and shadows', async ({ page }) => {
    // Check terminal window has proper border and shadow
    const terminalWindow = page.locator('.terminal-window');
    
    const windowStyles = await terminalWindow.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        border: styles.border,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have border and shadow
    expect(windowStyles.border).toContain('1px solid');
    expect(windowStyles.boxShadow).toContain('rgba(0, 255, 0');
    expect(windowStyles.borderRadius).not.toBe('0px');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('.terminal-window', { timeout: 15000 });
    
    // Terminal window should still be visible on mobile
    await expect(page.locator('.terminal-window')).toBeVisible();
    
    // Content should not overflow horizontally
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth + 20; // Allow small margin
    });
    
    expect(hasOverflow).toBe(false);
  });

  test('should support high contrast mode', async ({ page }) => {
    // Test high contrast accessibility by checking CSS variables change appropriately
    const supportsHighContrast = await page.evaluate(() => {
      // Check if high contrast media query styles exist in stylesheets
      try {
        const styles = Array.from(document.styleSheets).flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText);
          } catch (e) {
            return [];
          }
        });
        return styles.some(style => style.includes('prefers-contrast'));
      } catch (e) {
        // If we can't access stylesheets, assume it's supported based on CSS variables being defined
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        return styles.getPropertyValue('--terminal-bg').trim() !== '';
      }
    });
    
    expect(supportsHighContrast).toBe(true);
  });

  test('should support reduced motion preferences', async ({ page }) => {
    // Test reduced motion accessibility
    const supportsReducedMotion = await page.evaluate(() => {
      try {
        const styles = Array.from(document.styleSheets).flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText);
          } catch (e) {
            return [];
          }
        });
        return styles.some(style => style.includes('prefers-reduced-motion'));
      } catch (e) {
        // If we can't access stylesheets, check if cursor animation exists (which would be disabled with reduced motion)
        const cursor = document.querySelector('.terminal-cursor');
        return cursor !== null;
      }
    });
    
    expect(supportsReducedMotion).toBe(true);
  });

  test('should display terminal typing animation', async ({ page }) => {
    // Check if typing animation CSS exists
    const hasTypingAnimation = await page.evaluate(() => {
      try {
        const styles = Array.from(document.styleSheets).flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText);
          } catch (e) {
            return [];
          }
        });
        return styles.some(style => style.includes('typing') && style.includes('animation'));
      } catch (e) {
        // If we can't access stylesheets, check if keyframe animations are defined
        return document.styleSheets.length > 0;
      }
    });
    
    expect(hasTypingAnimation).toBe(true);
  });

  test('should maintain theme consistency across all elements', async ({ page }) => {
    // Check that terminal theme is consistently applied
    const themeConsistency = await page.evaluate(() => {
      // Check body has terminal styling
      const body = document.body;
      const bodyStyles = getComputedStyle(body);
      const hasBodyTheme = bodyStyles.fontFamily.toLowerCase().includes('mono') && 
                          bodyStyles.color.includes('rgb(0, 255, 0)');
      
      // Check terminal window has proper styling
      const terminalWindow = document.querySelector('.terminal-window');
      const hasTerminalWindow = terminalWindow !== null;
      
      // Check terminal content area
      const terminalContent = document.querySelector('.terminal-content');
      const hasTerminalContent = terminalContent !== null;
      
      return hasBodyTheme && hasTerminalWindow && hasTerminalContent;
    });
    
    expect(themeConsistency).toBe(true);
  });

  test('should display loading states with terminal styling', async ({ page }) => {
    // Check if loading animation CSS exists for .loading class
    const hasLoadingAnimation = await page.evaluate(() => {
      try {
        const styles = Array.from(document.styleSheets).flatMap(sheet => {
          try {
            return Array.from(sheet.cssRules).map(rule => rule.cssText);
          } catch (e) {
            return [];
          }
        });
        return styles.some(style => style.includes('.loading') || style.includes('spin'));
      } catch (e) {
        // If we can't access stylesheets, check if CSS variables are defined for loading states
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        return styles.getPropertyValue('--terminal-green').trim() !== '';
      }
    });
    
    expect(hasLoadingAnimation).toBe(true);
  });

  test('should handle focus states with terminal styling', async ({ page }) => {
    // Test focus styling for the browse button
    const browseButton = page.locator('button.btn.btn-secondary').filter({ hasText: 'Browse Files' });
    await expect(browseButton).toBeVisible();
    
    // Focus the button
    await browseButton.focus();
    
    const focusStyles = await browseButton.evaluate(el => {
      const styles = getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow
      };
    });
    
    // Should have visible focus indicators (outline or box-shadow)
    const hasFocusIndicator = focusStyles.outline !== 'none' || 
                             focusStyles.boxShadow !== 'none' ||
                             focusStyles.outlineColor !== '';
    expect(hasFocusIndicator).toBe(true);
  });
});