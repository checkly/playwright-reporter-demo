import { defineConfig } from 'checkly';
import { EmailAlertChannel, Frequency } from 'checkly/constructs';

const TARGET_URL = 'https://raccoon-records.vercel.app';

const emailAlert = new EmailAlertChannel('default-email-alert', {
  address: 'maria@checkly.com',
  sendFailure: true,
  sendRecovery: true,
  sendDegraded: false,
});

export default defineConfig({
  projectName: 'Raccoon Records',
  logicalId: 'raccoon-records',
  repoUrl: 'https://github.com/checkly/playwright-reporter-demo',
  checks: {
    playwrightConfigPath: './playwright.config.ts',
    locations: ['eu-west-1', 'us-east-1'],
    alertChannels: [emailAlert],
    environmentVariables: [{ key: 'ENVIRONMENT_URL', value: TARGET_URL }],

    playwrightChecks: [
      {
        name: 'API Health',
        logicalId: 'api-health',
        pwProjects: ['chromium'],
        pwTags: ['@api'],
        frequency: Frequency.EVERY_5M,
      },
      {
        name: 'Core UI — Homepage & Product Detail',
        logicalId: 'core-ui',
        pwProjects: ['chromium'],
        pwTags: ['@core'],
        frequency: Frequency.EVERY_5M,
      },
      {
        name: 'Search & Filters',
        logicalId: 'search-filters',
        pwProjects: ['chromium'],
        pwTags: ['@search'],
        frequency: Frequency.EVERY_5M,
      },
    ],
  },
  cli: {
    runLocation: 'eu-west-1',
    retries: 0,
  },
});
