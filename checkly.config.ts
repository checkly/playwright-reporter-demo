import { defineConfig } from 'checkly'
import { Frequency } from 'checkly/constructs'

export default defineConfig({
  projectName: 'Raccoon Records',
  logicalId: 'raccoon-records',
  repoUrl: 'https://github.com/checkly/playwright-reporter-demo',
  checks: {
    playwrightConfigPath: './playwright.config.ts',
    locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
    tags: ['raccoon-records', 'demo'],
    playwrightChecks: [
      {
        name: 'API Health',
        logicalId: 'api-health',
        pwProjects: ['checkly'],
        testCommand: 'npx playwright test api-health.spec.ts --project checkly',
        frequency: Frequency.EVERY_10M,
      },
      {
        name: 'Homepage',
        logicalId: 'homepage',
        pwProjects: ['checkly'],
        testCommand: 'npx playwright test homepage.spec.ts --project checkly',
        frequency: Frequency.EVERY_10M,
      },
      {
        name: 'Product Detail',
        logicalId: 'product-detail',
        pwProjects: ['checkly'],
        testCommand: 'npx playwright test product-detail.spec.ts --project checkly',
        frequency: Frequency.EVERY_10M,
      },
      {
        name: 'Search & Filters',
        logicalId: 'search-filters',
        pwProjects: ['checkly'],
        testCommand: 'npx playwright test search-filters.spec.ts --project checkly',
        frequency: Frequency.EVERY_10M,
      },
    ],
  },
  cli: {
    runLocation: 'eu-west-1',
    retries: 0,
  },
})
