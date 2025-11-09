import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for React hooks testing
 * Runs tests against Storybook on localhost:6006
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run Storybook server before running tests
  // Commented out for manual testing - start Storybook separately with: npm run storybook
  // webServer: {
  //   command: 'npm run storybook',
  //   url: 'http://localhost:6006',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});
