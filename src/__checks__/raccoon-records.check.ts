import { PlaywrightCheck } from 'checkly/constructs'

new PlaywrightCheck('raccoon-records-suite', {
  name: 'Raccoon Records',
  playwrightConfigPath: '../../playwright.config.ts',
  pwProjects: ['checkly'],
})
