import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
 // Root directory for test files
 testDir: './tests',

 // Run tests in parallel (disable for login-state-dependent flows)
 fullyParallel: false,

 // Fail the build on CI if test.only is accidentally left in source code
 forbidOnly: !!process.env.CI,

 // Retry failed tests up to 3 times. Override per-run with `--retries=N`.
 retries: 3,

 // Limit workers on CI to avoid rate-limiting from CareerFlow
 workers: process.env.CI ? 1 : 2,

 // Reporter: HTML for local, GitHub-friendly list for CI
 reporter: process.env.CI
   ? [['github'], ['html', { open: 'never' }]]
   : [['list'], ['html', { open: 'on-failure' }]],

 use: {
   // Base URL for all page.goto('/path') calls
   baseURL: process.env.BASE_URL || 'https://app.careerflow.ai',

   // Collect trace on first retry — invaluable for debugging CI failures
   trace: 'on-first-retry',

   // Screenshot only on failure
   screenshot: 'only-on-failure',

   // Video recording on retry
   video: 'on-first-retry',

   // Global timeout for each action (click, fill, etc.)
   actionTimeout: 15_000,

   // Navigation timeout
   navigationTimeout: 30_000,
 },

 // Timeout per full test (2 minutes for flows that wait for email)
 timeout: 120_000,

 // Expect assertion timeout — how long to wait for an assertion to pass
 expect: {
   timeout: 10_000,
 },
  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});