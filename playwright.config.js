import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'local',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5173',
      },
    },
    {
      name: 'deployed',
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://pangeafate.github.io/AgentiCV',
      },
    },
    {
      name: 'local-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        baseURL: 'http://localhost:5173'
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
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        baseURL: 'http://localhost:5173'
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        baseURL: 'http://localhost:5173'
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  timeout: 30000,
  expect: {
    timeout: 10000
  },

  outputDir: 'test-results/',
});