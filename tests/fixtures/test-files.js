// Test file utilities for Playwright tests
export const TEST_FILES = {
  // Valid files
  VALID_PDF: {
    name: 'test-cv.pdf',
    type: 'application/pdf',
    size: 2 * 1024 * 1024, // 2MB
    content: '%PDF-1.4 fake pdf content for testing'
  },
  
  VALID_DOC: {
    name: 'test-cv.doc',
    type: 'application/msword',
    size: 1.5 * 1024 * 1024, // 1.5MB
    content: 'fake doc content for testing'
  },
  
  VALID_DOCX: {
    name: 'test-cv.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 3 * 1024 * 1024, // 3MB
    content: 'fake docx content for testing'
  },
  
  // Invalid files
  INVALID_TXT: {
    name: 'resume.txt',
    type: 'text/plain',
    size: 1 * 1024 * 1024, // 1MB
    content: 'This is a text file resume'
  },
  
  INVALID_IMAGE: {
    name: 'photo.jpg',
    type: 'image/jpeg',
    size: 2 * 1024 * 1024, // 2MB
    content: 'fake image content'
  },
  
  OVERSIZED_PDF: {
    name: 'huge-cv.pdf',
    type: 'application/pdf',
    size: 15 * 1024 * 1024, // 15MB (over 10MB limit)
    content: 'fake oversized pdf content'
  }
};

/**
 * Creates a File object for testing
 * @param {Object} fileSpec - File specification from TEST_FILES
 * @returns {Promise<File>} - File object for testing
 */
export async function createTestFile(fileSpec) {
  const blob = new Blob([fileSpec.content], { type: fileSpec.type });
  
  // Create a File object with the specified properties
  const file = new File([blob], fileSpec.name, {
    type: fileSpec.type,
    lastModified: Date.now()
  });
  
  // Override the size property to match our test specification
  Object.defineProperty(file, 'size', {
    value: fileSpec.size,
    writable: false
  });
  
  return file;
}

/**
 * Simulates drag and drop file upload
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector for drop target
 * @param {Object} fileSpec - File specification from TEST_FILES
 */
export async function simulateFileDrop(page, selector, fileSpec) {
  const file = await createTestFile(fileSpec);
  
  await page.locator(selector).evaluate((element, fileData) => {
    const dt = new DataTransfer();
    const file = new File([fileData.content], fileData.name, { 
      type: fileData.type 
    });
    
    // Override size property
    Object.defineProperty(file, 'size', {
      value: fileData.size,
      writable: false
    });
    
    dt.items.add(file);
    
    const dropEvent = new DragEvent('drop', {
      bubbles: true,
      cancelable: true,
      dataTransfer: dt
    });
    
    element.dispatchEvent(dropEvent);
  }, fileSpec);
}

/**
 * Waits for upload progress to complete
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForUploadComplete(page, timeout = 10000) {
  // Wait for upload progress to appear
  await page.waitForSelector('text=Uploading CV...', { timeout: 5000 }).catch(() => {
    // Upload might be too fast to catch
  });
  
  // Wait for upload to complete
  await page.waitForSelector('text=✓ Upload complete', { timeout });
}

/**
 * Checks if an element has terminal theme styling
 * @param {ElementHandle} element - Element to check
 * @returns {Promise<boolean>} - Whether element has terminal styling
 */
export async function hasTerminalStyling(element) {
  return await element.evaluate((el) => {
    const styles = getComputedStyle(el);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    const fontFamily = styles.fontFamily;
    
    const hasGreenText = color.includes('rgb(0, 255, 0)') || color.includes('#00ff00');
    const hasDarkBg = backgroundColor.includes('rgb(10, 10, 10)') || 
                      backgroundColor.includes('rgb(0, 0, 0)') ||
                      backgroundColor.includes('#0a0a0a');
    const hasMonoFont = fontFamily.toLowerCase().includes('mono');
    
    return hasGreenText || hasDarkBg || hasMonoFont;
  });
}

/**
 * Gets the computed CSS custom properties
 * @param {Page} page - Playwright page object
 * @returns {Promise<Object>} - CSS custom properties
 */
export async function getTerminalCSSVariables(page) {
  return await page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    
    return {
      terminalBg: styles.getPropertyValue('--terminal-bg').trim(),
      terminalBgSecondary: styles.getPropertyValue('--terminal-bg-secondary').trim(),
      terminalGreen: styles.getPropertyValue('--terminal-green').trim(),
      terminalGreenDim: styles.getPropertyValue('--terminal-green-dim').trim(),
      terminalAmber: styles.getPropertyValue('--terminal-amber').trim(),
      terminalRed: styles.getPropertyValue('--terminal-red').trim(),
      terminalBlue: styles.getPropertyValue('--terminal-blue').trim(),
      terminalPurple: styles.getPropertyValue('--terminal-purple').trim(),
      terminalGray: styles.getPropertyValue('--terminal-gray').trim(),
      terminalWhite: styles.getPropertyValue('--terminal-white').trim(),
      terminalBorder: styles.getPropertyValue('--terminal-border').trim(),
      fontMono: styles.getPropertyValue('--font-mono').trim()
    };
  });
}

/**
 * Checks if page has any JavaScript errors
 * @param {Page} page - Playwright page object
 * @returns {Promise<string[]>} - Array of error messages
 */
export async function getPageErrors(page) {
  const errors = [];
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  return errors;
}