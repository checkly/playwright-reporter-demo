# Checkly Playwright Check Suite Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Checkly CLI to the project and create a PlaywrightCheck suite that runs 6 spec files (all except visual-regression) as deactivated Checkly monitoring checks — chromium only, every 10 min, from eu-west-1 + us-east-1.

**Architecture:** A single `PlaywrightCheck` construct points at the existing `playwright.config.ts`, filtered to a new `checkly` project that extends chromium but excludes `visual-regression.spec.ts`. The base URL is driven by `ENVIRONMENT_URL` so checks can target the deployed app while local tests stay on localhost:3000.

**Tech Stack:** Checkly CLI (`checkly`), `checkly/constructs`, Playwright, TypeScript

---

### Task 1: Install the Checkly CLI package

**Files:**
- Modify: `package.json`

**Step 1: Install checkly as a dev dependency**

Run: `npm install --save-dev checkly`

**Step 2: Verify installation**

Run: `npx checkly --version`
Expected: Version 6.x.x or higher printed to stdout

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add checkly CLI as dev dependency"
```

---

### Task 2: Add a `checkly` Playwright project

**Files:**
- Modify: `playwright.config.ts`

The `PlaywrightCheck` construct references a Playwright project by name. We add a `checkly` project that extends `chromium` but excludes `visual-regression.spec.ts`. This keeps the 3 existing projects untouched.

**Step 1: Add the `checkly` project to `playwright.config.ts`**

Add this as a 4th entry in the `projects` array (after `mobile-chrome`):

```typescript
    {
      name: 'checkly',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['visual-regression.spec.ts'],
    },
```

**Step 2: Verify the new project picks up the right tests**

Run: `npx playwright test --project=checkly --list`
Expected: Lists tests from all 6 spec files (homepage, search-filters, product-detail, cart, api-health, checkout) but NOT visual-regression. Should show 37 tests.

**Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "feat: add checkly Playwright project excluding visual regression"
```

---

### Task 3: Create `checkly.config.ts`

**Files:**
- Create: `checkly.config.ts`

**Step 1: Create the Checkly project config**

Create `checkly.config.ts` at the project root:

```typescript
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
```

**Step 2: Verify the config is valid**

Run: `npx checkly test --list`
Expected: No errors parsing the config (may show 0 checks since no check files exist yet — that's fine).

**Step 3: Commit**

```bash
git add checkly.config.ts
git commit -m "feat: add checkly.config.ts with project defaults"
```

---

### Task 4: Create the PlaywrightCheck construct

**Files:**
- Create: `src/__checks__/raccoon-records.check.ts`

**Step 1: Create the checks directory**

Run: `mkdir -p src/__checks__`

**Step 2: Create the PlaywrightCheck construct file**

Create `src/__checks__/raccoon-records.check.ts`:

```typescript
import { PlaywrightCheck } from 'checkly/constructs'

new PlaywrightCheck('raccoon-records-suite', {
  name: 'Raccoon Records',
  playwrightConfigPath: '../../playwright.config.ts',
  pwProjects: ['checkly'],
})
```

The check inherits `activated: false`, `frequency: EVERY_10M`, `locations: ['us-east-1', 'eu-west-1']`, and `tags` from `checkly.config.ts`.

**Step 3: Verify the check is picked up**

Run: `npx checkly test --list`
Expected: Shows the "Raccoon Records" PlaywrightCheck suite with the 6 spec files.

**Step 4: Commit**

```bash
git add src/__checks__/raccoon-records.check.ts
git commit -m "feat: add PlaywrightCheck suite for Raccoon Records"
```

---

### Task 5: Add npm scripts for Checkly CLI

**Files:**
- Modify: `package.json`

**Step 1: Add checkly scripts to package.json**

Add these scripts:

```json
"checkly": "npx checkly test",
"checkly:deploy": "npx checkly deploy",
"checkly:destroy": "npx checkly destroy"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add checkly npm scripts"
```

---

### Task 6: Deploy checks to Checkly account

**Step 1: Verify environment variables are set**

Run: `echo "API_KEY=${CHECKLY_API_KEY:+set}" "ACCOUNT=${CHECKLY_ACCOUNT_ID:+set}"`
Expected: `API_KEY=set ACCOUNT=set` — both must be present.

**Step 2: Dry-run test**

Run: `npx checkly test --verbose`
Expected: Tests run from `eu-west-1` against the local webServer. May fail if the app isn't reachable from Checkly's infra — that's expected. The goal is validating the construct is wired up correctly.

**Step 3: Deploy to Checkly**

Run: `npx checkly deploy`
Expected: Deploys the "Raccoon Records" PlaywrightCheck suite to your Checkly account. Checks are deactivated so nothing runs yet.

**Step 4: Verify in Checkly dashboard**

Open Checkly dashboard and confirm the "Raccoon Records" check suite appears, tagged `raccoon-records` + `demo`, deactivated.

**Step 5: Commit any generated files (if any)**

```bash
git status
# If .checkly-lock.json or similar was created:
git add .checkly-lock.json
git commit -m "chore: add checkly lock file after deploy"
```
