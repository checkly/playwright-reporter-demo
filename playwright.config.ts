import { defineConfig, devices } from '@playwright/test';
import { createChecklyReporter } from '@checkly/playwright-reporter';

/**
 * Checkly Playwright Reporter — Example Configuration
 *
 * This config showcases all reporter options alongside Playwright's
 * webServer option to auto-start the demo app before running tests.
 *
 * @see https://www.checklyhq.com/docs/detect/testing/playwright-reporter
 */
export default defineConfig({
  testDir: './',

  /* Fail the build on CI if test.only was left in source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only — retried tests show as "flaky" in Checkly */
  retries: process.env.CI ? 2 : 0,

  /* Parallel execution */
  workers: process.env.CI ? '50%' : undefined,

  /* ── Reporters ─────────────────────────────────────────────── */
  reporter: [
    // ✨ Checkly Reporter — uploads results to Checkly Test Sessions
    createChecklyReporter({
      // Dynamic session name — searchable in the Checkly dashboard
      sessionName: process.env.CI
        ? `CI — ${process.env.GITHUB_REF_NAME ?? 'main'} @ ${(process.env.GITHUB_SHA ?? '').slice(0, 7)}`
        : `Local — ${new Date().toISOString().slice(0, 16)}`,

      // Auto-scrub env vars matching SECRET, KEY, TOKEN, PASSWORD, etc.
      scrubbing: {
        autoDetect: true,
        envVars: ['DATABASE_URL', 'SESSION_SECRET'],
      },

      // Real-time terminal progress
      showProgress: true,

      // Per-project summary table at the end of the run
      showSummaryTable: true,

      // Set to true to see individual test steps in terminal
      printSteps: false,

      // Debug mode for troubleshooting uploads
      verbose: !!process.env.CHECKLY_REPORTER_VERBOSE,
    }),

    // HTML report for local browsing (npx playwright show-report)
    ['html', { open: 'never' }],
  ],

  /* ── Shared test settings ──────────────────────────────────── */
  use: {
    /* Base URL — tests use relative paths like page.goto('/') */
    baseURL: 'http://localhost:3000',

    /* ---- Asset capture settings ----
     * These control what the Checkly Reporter can upload.
     * No traces = no console/network data in Checkly. */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    /* Browser settings */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  /* ── Projects (multi-browser testing) ──────────────────────── */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* ── Auto-start the demo app ───────────────────────────────── */
  webServer: {
    command: 'node server.js',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
