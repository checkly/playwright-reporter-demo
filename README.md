# Checkly Playwright Reporter + Playwright Check Suites

> Run `npx playwright test` and get a shareable dashboard with every screenshot, video, trace, console log, and network request from your test suite — automatically.

This repo is a **complete, self-contained example** of two Checkly features:

1. **[Playwright Reporter](https://www.npmjs.com/package/@checkly/playwright-reporter)** — uploads test results (assets, traces, network data) to [Checkly Test Sessions](https://www.checklyhq.com/docs/detect/testing/playwright-reporter/).
2. **[Playwright Check Suites](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/)** — runs a subset of the same tests as continuous synthetic monitoring from multiple global locations.

It ships with its own demo app (**Raccoon Records**, a vinyl shop) and a full Playwright test suite. Fork it, add your Checkly credentials, and see your results in the [Checkly dashboard](https://app.checklyhq.com).

---

## What you get

| Feature | Description |
|---|---|
| **Test Sessions dashboard** | Pass/fail results, screenshots, videos, and Playwright traces uploaded after every run |
| **Synthetic monitoring** | Three Playwright Check Suites run production-safe `@monitor` tests every 10 minutes from two regions |
| **Console and network data** | Extracted from Playwright traces automatically — no extra configuration |
| **Git context** | Branch, commit SHA, and author auto-detected from CI or local repo |
| **Secret scrubbing** | API keys and tokens redacted before upload |
| **Tag-based test selection** | `@monitor`, `@stateful`, `@destructive`, and `@visual` tags separate monitoring from full E2E |

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/checkly/checkly-playwright-reporter-example.git
cd checkly-playwright-reporter-example
npm install
npx playwright install --with-deps chromium
```

### 2. Run the tests

```bash
npx playwright test --project=chromium
```

Playwright auto-starts the demo app through the [`webServer`](https://playwright.dev/docs/test-webserver) config. No separate server process needed.

### 3. Upload results to Checkly

```bash
export CHECKLY_API_KEY=cu_xxx
export CHECKLY_ACCOUNT_ID=your-account-id
npx playwright test --project=chromium
```

Open the session URL printed in your terminal to view results in the [Checkly Test Sessions dashboard](https://app.checklyhq.com/test-sessions).

---

## What's in this repo

```
.
├── server.js                      # Express API (records, cart, checkout, search)
├── db.js                          # Database adapter (SQLite local, Turso production)
├── index.html                     # Raccoon Records — vinyl shop frontend
├── tests/
│   ├── api-health.spec.ts         # API endpoint validation
│   ├── homepage.spec.ts           # Page load, catalog, filters, cart button
│   ├── product-detail.spec.ts     # Modal open/close, detail display
│   ├── search-filters.spec.ts     # Search input, genre filters, empty states
│   ├── cart.spec.ts               # Add to cart, clear, badge updates
│   ├── checkout.spec.ts           # Order creation, stock decrement
│   └── visual-regression.spec.ts  # Screenshot comparison baselines
├── playwright.config.ts           # Playwright config with reporter and projects
├── checkly.config.ts              # Checkly Check Suite definitions
├── vercel.json                    # Vercel deployment config
└── package.json
```

### The demo app: Raccoon Records

A dark, editorial vinyl shop built with Express and vanilla HTML/CSS/JS. Features:

- **Product catalog** with 8 hand-curated records across genres
- **Search** by title, artist, or genre with debounced input
- **Genre filters** as pill buttons
- **Product detail modal** with descriptions, ratings, and stock levels
- **Shopping cart** drawer with add, clear, and total
- **REST API** at `/api/records`, `/api/cart`, `/api/genres`, `/api/checkout`, `/api/health`

Run it standalone with `npm run dev` and visit `http://localhost:3000`.

---

## The test suite

| Test file | Tag | Tests | What it covers |
|---|---|---|---|
| `tests/api-health.spec.ts` | `@monitor @api`, `@stateful` | 9 | API health, catalog, search, genres, cart round-trip, latency |
| `tests/homepage.spec.ts` | `@monitor @core` | 5 | Page load, title, catalog grid, genre filters, cart button |
| `tests/product-detail.spec.ts` | `@monitor @core` | 5 | Modal open/close, record details, add-to-cart from modal |
| `tests/search-filters.spec.ts` | `@monitor @search` | 5 | Title search, artist search, empty state, genre filter, reset |
| `tests/cart.spec.ts` | `@stateful` | 5 | Add to cart, drawer, clear cart, badge updates, close button |
| `tests/checkout.spec.ts` | `@destructive` | 9 | Order creation, stock changes, validation, full UI checkout |
| `tests/visual-regression.spec.ts` | `@visual` | 3 | Full-page and component screenshot comparisons |

**Total:** 41 tests across 7 files. Playwright projects represent runtime coverage only: `chromium`, `firefox`, and `mobile-chrome`.

### Monitoring vs. E2E strategy

Test intent tags separate monitoring-safe tests from full E2E flows. Both share the same codebase without runtime conditionals.

| Tag | Purpose | Included in monitoring |
|---|---|---|
| `@monitor` | Stable, non-destructive checks | Yes |
| `@api` | API health and contract checks | Yes, in the API Health suite |
| `@core` | Critical homepage and product-detail UX | Yes, in the Core UI suite |
| `@search` | Search and filtering UX | Yes, in the Search & Filters suite |
| `@stateful` | Mutates shared app state (cart operations) | No |
| `@destructive` | Creates irreversible state (orders, stock changes) | No |
| `@visual` | Screenshot comparison baselines | No |

Playwright projects stay focused on runtime coverage. Local monitoring runs use `--grep @monitor`, while deployed Checkly suites use `pwTags` to select `@api`, `@core`, or `@search` from the same test files.

---

## Checkly Playwright Check Suites

This repo defines three [Playwright Check Suites](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/) in `checkly.config.ts`. Each suite runs a tagged subset of production-safe tests as continuous synthetic monitoring.

| Check Suite | Test file | Tests | Description |
|---|---|---|---|
| **API Health** | `@api` | 8 | API endpoints, response schemas, latency |
| **Core UI — Homepage & Product Detail** | `@core` | 10 | Page load, catalog rendering, modal interactions |
| **Search & Filters** | `@search` | 5 | Search input, genre filtering, empty states |

**Schedule:** Every 10 minutes from `eu-west-1` and `us-east-1`.

All suites reuse the regular `chromium` Playwright project and select their test group with `pwTags`. This keeps browser/device concerns in Playwright and monitoring grouping in Checkly.

### How it works

The [`checkly`](https://www.npmjs.com/package/checkly) CLI reads `checkly.config.ts`, bundles your Playwright tests, and runs them on Checkly's infrastructure. The config points to your existing `playwright.config.ts` — no separate test files or check definitions needed.

```typescript
// checkly.config.ts (simplified)
import { defineConfig } from 'checkly'
import { Frequency } from 'checkly/constructs'

export default defineConfig({
  projectName: 'Raccoon Records',
  logicalId: 'raccoon-records',
  checks: {
    playwrightConfigPath: './playwright.config.ts',
    locations: ['eu-west-1', 'us-east-1'],
    playwrightChecks: [
      {
        name: 'Core UI — Homepage & Product Detail',
        logicalId: 'core-ui',
        pwProjects: ['chromium'],
        pwTags: ['@core'],
        frequency: Frequency.EVERY_10M,
      },
      // ... more check suites
    ],
  },
})
```

### Environment variables

The `ENVIRONMENT_URL` variable controls the base URL for all tests. Set it in the [Checkly environment variables dashboard](https://app.checklyhq.com) to point to your deployed instance. Locally, tests default to `http://localhost:3000`.

When Checkly runs the tests, the `CHECKLY` environment variable is set automatically. The Playwright config uses this to skip the `webServer` (tests hit the deployed URL instead) and the reporter (not needed in the monitoring runtime).

### Validate and deploy

```bash
# Validate checks against your deployed app
npx checkly test --record -e ENVIRONMENT_URL=https://your-app.vercel.app

# Deploy to Checkly
npx checkly deploy
```

For more details, see the [Playwright Check Suite quickstart](https://www.checklyhq.com/docs/quickstarts/playwright-check/) and [configuration reference](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/configuration/).

---

## Reporter configuration

The Playwright config conditionally loads the [`@checkly/playwright-reporter`](https://www.npmjs.com/package/@checkly/playwright-reporter) to upload test results to [Checkly Test Sessions](https://www.checklyhq.com/docs/detect/testing/playwright-reporter/).

```typescript
// playwright.config.ts (reporter section)
createChecklyReporter({
  // Dynamic name — searchable in the Checkly dashboard
  sessionName: process.env.CI
    ? `CI — ${process.env.GITHUB_REF_NAME} @ ${process.env.GITHUB_SHA?.slice(0, 7)}`
    : `Local — ${new Date().toISOString().slice(0, 16)}`,

  // Auto-redact env vars matching SECRET, KEY, TOKEN, PASSWORD
  scrubbing: { autoDetect: true },
})
```

### Asset capture

The reporter uploads whatever Playwright produces. Enable traces to get console and network data in the dashboard.

```typescript
use: {
  screenshot: 'only-on-failure',  // uploaded on failure
  video: 'retain-on-failure',     // uploaded on failure
  trace: 'on',                    // console + network data always captured
}
```

---

## CI/CD

Add these secrets to your CI provider before running Playwright with the Checkly reporter or deploying checks:

| Secret | Purpose |
|---|---|
| `CHECKLY_API_KEY` | Authenticates with the Checkly API |
| `CHECKLY_ACCOUNT_ID` | Identifies the Checkly account |

Use `ENVIRONMENT_URL` in CI or Checkly environments to point tests at the deployed app.

---

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the demo app at `http://localhost:3000` |
| `npm test` | Run all Playwright tests (all projects) |
| `npm run test:monitor` | Run production-safe `@monitor` tests in Chromium |
| `npm run test:chromium` | Run tests in Chromium only |
| `npm run test:visual` | Run visual regression tests in Chromium |
| `npm run test:headed` | Run Chromium tests in headed mode |
| `npm run test:debug` | Open Playwright Inspector for debugging |
| `npm run test:ui` | Open Playwright UI mode |
| `npm run report` | Open the Playwright HTML report |
| `npm run checkly` | Validate Check Suites with `checkly test` |
| `npm run checkly:deploy` | Deploy Check Suites to Checkly |
| `npm run checkly:destroy` | Remove deployed checks from Checkly |
| `npm run checkly:trigger` | Trigger deployed checks on demand |

---

## Resources

- [`@checkly/playwright-reporter` on npm](https://www.npmjs.com/package/@checkly/playwright-reporter)
- [`checkly` CLI on npm](https://www.npmjs.com/package/checkly)
- [Playwright Reporter docs](https://www.checklyhq.com/docs/detect/testing/playwright-reporter/)
- [Playwright Reporter changelog](https://www.checklyhq.com/docs/detect/testing/playwright-reporter-changelog/)
- [Playwright Check Suites docs](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/)
- [Check Suite configuration reference](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/configuration/)
- [Check Suite environment variables](https://www.checklyhq.com/docs/detect/synthetic-monitoring/playwright-checks/environment-variables/)
- [Checkly Test Sessions dashboard](https://app.checklyhq.com/test-sessions)

---

Built by the [Checkly](https://www.checklyhq.com) team.
