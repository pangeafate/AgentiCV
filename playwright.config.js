import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'local',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3001'
      },
    },
    {
      name: 'deployed',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://pangeafate.github.io/AgentiCV'
      },
    },
    {
      name: 'local-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:3001'
      },
    },
    {
      name: 'deployed-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'https://pangeafate.github.io/AgentiCV'
      },
    },
    {
      name: 'local-safari',
      use: { 
        ...devices['Desktop Safari'],
        baseURL: 'http://localhost:3001'
      },
    },
    {
      name: 'deployed-safari',
      use: { 
        ...devices['Desktop Safari'],
        baseURL: 'https://pangeafate.github.io/AgentiCV'
      },
    },
    /* Test against mobile viewports. */
    {
      name: 'local-mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:3001'
      },
    },
    {
      name: 'deployed-mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'https://pangeafate.github.io/AgentiCV'
      },
    },
    {
      name: 'local-mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        baseURL: 'http://localhost:3001'
      },
    },
    {
      name: 'deployed-mobile-safari',
      use: { 
        ...devices['iPhone 12'],
        baseURL: 'https://pangeafate.github.io/AgentiCV'
      },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'npm run dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test'
      }
    }
  ],

  /* Global test settings */
  timeout: 30000,
  expect: {
    timeout: 10000
  },

  /* Output directories */
  outputDir: 'test-results/',
  
  /* Global setup and teardown */
  globalSetup: './tests/global-setup.js',
});