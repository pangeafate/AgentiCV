# AgentiCV Frontend Test Suite

This directory contains comprehensive Playwright tests for the AgentiCV frontend application. The tests cover UI functionality, terminal theme styling, CV upload features, and deployment verification across both local and production environments.

## Test Structure

### Core Test Files

- **`cv-upload.spec.js`** - Tests CV upload functionality including drag-and-drop, file validation, progress tracking, and error handling
- **`ui-theme.spec.js`** - Tests terminal theme styling, color palette, typography, animations, and responsive design
- **`deployment.spec.js`** - Tests deployment on both local development server and GitHub Pages production environment

### Support Files

- **`fixtures/test-files.js`** - Utilities for creating test files, simulating file uploads, and testing terminal styling
- **`global-setup.js`** - Global test setup to verify server availability and environment configuration

## Configuration

The test suite is configured in `/playwright.config.js` with the following key features:

- **Multiple Environments**: Tests can run against local (`http://localhost:3001`) and deployed (`https://pangeafate.github.io/AgentiCV`) environments
- **Cross-Browser Testing**: Chrome, Firefox, Safari support
- **Mobile Testing**: Responsive design testing on mobile viewports
- **Parallel Execution**: Tests run in parallel for faster feedback
- **Rich Reporting**: HTML, JSON, and JUnit reports generated

## Running Tests

### Prerequisites

1. Install Playwright:
   ```bash
   npm install
   npx playwright install
   ```

2. For local testing, start the development server:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (visible browser)
npm run test:headed

# Run only local environment tests
npm run test:local

# Run only deployed environment tests
npm run test:deployed

# Debug tests step by step
npm run test:debug

# Run specific test file
npx playwright test tests/cv-upload.spec.js

# Run tests in specific browser
npx playwright test --project=local-firefox
```

## Test Categories

### 1. CV Upload Tests (`cv-upload.spec.js`)

Tests the core CV upload functionality:

- **Upload Area Display**: Verifies upload area is visible and properly styled
- **Drag & Drop**: Tests drag-and-drop file upload functionality
- **File Validation**: Tests file type (PDF, DOC, DOCX) and size (max 10MB) validation
- **Upload Progress**: Tests progress bar and status updates during upload
- **Success States**: Tests successful upload confirmation and file information display
- **Error Handling**: Tests graceful error handling for invalid files
- **Accessibility**: Tests keyboard navigation and screen reader compatibility

### 2. Terminal Theme Tests (`ui-theme.spec.js`)

Tests the terminal-themed user interface:

- **Color Palette**: Tests terminal colors (green text, black background, etc.)
- **Typography**: Tests monospace font usage and terminal-style text rendering
- **Visual Elements**: Tests terminal window styling, cursor animation, typing effects
- **Responsive Design**: Tests mobile and tablet compatibility
- **Accessibility**: Tests high contrast mode, reduced motion preferences
- **CSS Variables**: Verifies terminal color scheme implementation
- **Animations**: Tests terminal cursor blinking, typing animations, loading states

### 3. Deployment Tests (`deployment.spec.js`)

Tests deployment and cross-environment functionality:

- **Local Environment**: Tests development server functionality
- **GitHub Pages**: Tests production deployment accessibility and performance
- **Cross-Browser**: Tests compatibility across Chrome, Firefox, Safari
- **Performance**: Tests load times, bundle size, Core Web Vitals
- **SEO**: Tests meta tags, crawlability, semantic HTML structure
- **Security**: Tests HTTPS configuration and security headers
- **Consistency**: Verifies functionality parity between environments

## Test Data and Fixtures

The `fixtures/test-files.js` module provides:

- **Test File Specifications**: Predefined file objects for testing various scenarios
- **File Creation Utilities**: Functions to create File objects for testing
- **Upload Simulation**: Functions to simulate drag-and-drop file uploads
- **Styling Verification**: Utilities to check terminal theme application
- **Error Monitoring**: Functions to capture and analyze page errors

### Available Test Files

```javascript
// Valid files
TEST_FILES.VALID_PDF      // 2MB PDF file
TEST_FILES.VALID_DOC      // 1.5MB DOC file  
TEST_FILES.VALID_DOCX     // 3MB DOCX file

// Invalid files
TEST_FILES.INVALID_TXT    // Text file (unsupported format)
TEST_FILES.INVALID_IMAGE  // Image file (unsupported format)
TEST_FILES.OVERSIZED_PDF  // 15MB PDF (exceeds size limit)
```

## Continuous Integration

The test suite is designed for CI/CD environments:

- **GitHub Actions Ready**: Configuration optimized for GitHub Actions
- **Multiple Reporters**: HTML reports for local development, JUnit for CI systems
- **Retry Logic**: Automatic retry on CI for flaky test mitigation
- **Parallel Execution**: Tests run in parallel on CI for faster feedback
- **Artifact Collection**: Screenshots, videos, and traces collected on failure

### Example CI Configuration

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Debug Mode
```bash
npm run test:debug
```
This opens Playwright Inspector for step-by-step debugging.

### Screenshots and Videos
- Screenshots are automatically captured on test failure
- Videos are recorded and saved when tests fail
- Traces are collected for detailed debugging

### Browser DevTools
```bash
npm run test:headed
```
This runs tests in headed mode where you can use browser DevTools.

## Best Practices

1. **Test Naming**: Use descriptive test names that explain the expected behavior
2. **Page Object Pattern**: Reusable page objects for common interactions
3. **Wait Strategies**: Use appropriate wait strategies for dynamic content
4. **Test Isolation**: Each test is independent and can run in any order
5. **Error Handling**: Tests include proper error handling and cleanup
6. **Cross-Environment**: Tests work across different environments and browsers

## Troubleshooting

### Common Issues

1. **Local server not running**:
   ```bash
   npm run dev
   ```

2. **Playwright not installed**:
   ```bash
   npx playwright install
   ```

3. **Port conflicts**:
   - Change port in `vite.config.js` and `playwright.config.js`

4. **Deployment site not accessible**:
   - Update the deployed URL in `playwright.config.js`
   - Check GitHub Pages deployment status

### Getting Help

- Check the [Playwright documentation](https://playwright.dev/)
- Review test logs in `test-results/` directory
- Examine screenshots and videos for failed tests
- Use `npm run test:debug` for interactive debugging

## Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Use the utilities in `fixtures/test-files.js` for file operations
3. Include both positive and negative test cases
4. Test accessibility and responsive design
5. Update this README with new test descriptions