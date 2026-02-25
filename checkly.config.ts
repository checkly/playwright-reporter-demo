import { defineConfig } from 'checkly'
import { Frequency } from 'checkly/constructs'

export default defineConfig({
  projectName: 'Raccoon Records',
  logicalId: 'raccoon-records',
  repoUrl: 'https://github.com/checkly/playwright-reporter-demo',
  checks: {
    activated: false,
    muted: false,
    runtimeId: '2025.04',
    frequency: Frequency.EVERY_10M,
    locations: ['us-east-1', 'eu-west-1'],
    tags: ['raccoon-records', 'demo'],
    checkMatch: '**/__checks__/**/*.check.ts',
    ignoreDirectoriesMatch: ['node_modules/**', 'dist/**'],
    playwrightConfig: {},
    browserChecks: {
      testMatch: '**/__checks__/**/*.spec.ts',
    },
  },
  cli: {
    runLocation: 'eu-west-1',
    retries: 0,
  },
})
