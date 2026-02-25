# 🦝 Checkly Playwright Reporter — Example Repository

> **Run `npx playwright test` and get a shareable dashboard** with every screenshot, video, trace, console log, and network request from your test suite — automatically.

This repo is a **complete, self-contained example** of the [`@checkly/playwright-reporter`](https://www.npmjs.com/package/@checkly/playwright-reporter). It ships with its own demo app (Raccoon Records, a vinyl shop) and a full Playwright test suite that exercises it. Fork it, plug in your Checkly credentials, and watch your results light up in the [Checkly Test Sessions](https://app.checklyhq.com/test-sessions) dashboard.

---

## What you get

| Feature | What it does |
|---|---|
| **One-line setup** | Drop `createChecklyReporter()` into your config — done |
| **Real-time progress** | Pass/fail results stream to your terminal as tests execute |
| **Full asset upload** | Screenshots, videos, and Playwright traces bundled + uploaded |
| **Console & network data** | Extracted from traces automatically — no extra config |
| **Git context** | Branch, commit SHA, and author auto-detected from CI or local repo |
| **Secret scrubbing** | API keys and tokens redacted before upload |
| **CI-ready** | GitHub Actions workflow included, runs on every push |

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

Playwright auto-starts the demo app via the [`webServer`](https://playwright.dev/docs/test-webserver) config. No manual server management needed.

### 3. Upload to Checkly

```bash
export CHECKLY_API_KEY=cu_xxx
export CHECKLY_ACCOUNT_ID=your-account-id
npx playwright test --project=chromium
```

Open the session URL printed in your terminal:

```
🦝 Checkly Reporter v1.5.0  •  🎭 Playwright v1.57.0

View test results: https://chk.ly/abc123

  ✓  homepage.spec.ts › loads with correct title and branding (0.8s)
  ✓  search-filters.spec.ts › search filters records by title (1.2s)
  ✓  cart.spec.ts › add to cart from catalog card (1.5s)
  ...
Project    Total  Pass  Fail  Flaky  Skip  Rate
chromium      22    22     0      0     0  100.00%
```

## What's in this repo

```
.
├── app/
│   ├── server.js                    # Express API (records, cart, search)
│   └── public/
│       └── index.html               # Raccoon Records — vinyl shop frontend
├── tests/
│   ├── homepage.spec.ts             # Navigation, layout, key elements
│   ├── search-filters.spec.ts       # Search + genre filter interactions
│   ├── product-detail.spec.ts       # Modal open/close, detail display
│   ├── cart.spec.ts                 # Add to cart, clear cart, badge updates
│   ├── api-health.spec.ts           # Direct API endpoint validation
│   └── visual-regression.spec.ts    # Screenshot comparison baselines
├── playwright.config.ts             # Reporter config with all options documented
├── .github/workflows/
│   └── playwright.yml               # CI with Checkly integration
└── package.json
```

### The demo app: Raccoon Records 🦝

A dark, editorial vinyl shop built with Express + vanilla HTML/CSS/JS. Features:

- **Product catalog** with 8 hand-curated records across genres
- **Search** (title, artist, genre) with debounced input
- **Genre filters** (pill buttons)
- **Product detail modal** with descriptions, ratings, stock levels
- **Shopping cart** (drawer with add/clear/total)
- **REST API** at `/api/records`, `/api/cart`, `/api/genres`, `/api/health`

Run it standalone with `npm run dev` and visit `http://localhost:3000`.

### The test suite

| Test file | Pattern | What it showcases |
|---|---|---|
| `homepage.spec.ts` | Navigation + assertions | Basic page load, element visibility, content checks |
| `search-filters.spec.ts` | User interaction | Text input, debounced search, filter clicks, empty states |
| `product-detail.spec.ts` | Modal interaction | Open/close, detail rendering, add-to-cart from modal |
| `cart.spec.ts` | Stateful flows | API-driven setup, badge updates, clear cart, toast notifications |
| `api-health.spec.ts` | API testing | Direct HTTP requests, schema validation, latency checks, 404 handling |
| `visual-regression.spec.ts` | Screenshot comparison | Full-page + component snapshots with diff thresholds |

### Monitoring vs E2E strategy

This repo uses test intent tags so monitoring and full E2E can share the same code without runtime conditionals:

- `@monitor`: Stable, non-destructive checks for Checkly Playwright monitoring.
- `@stateful`: Flows that mutate shared app state (not part of monitoring suite).
- `@destructive`: Flows that create irreversible state (like checkout/order).
- `@visual`: Snapshot-driven visual regression checks.

The `checkly` Playwright project is configured to run only `@monitor` tests (and invert destructive/stateful/visual tags).

Useful commands:

- `npm run test:monitor` — runs only monitoring-safe checks locally.
- `npm run checkly` — runs the Checkly PlaywrightCheck test command.
- `npm run checkly:trigger` — triggers deployed checks by tags.

## Configuration walkthrough

```typescript
// playwright.config.ts
createChecklyReporter({
  // Dynamic name — searchable in the Checkly dashboard
  sessionName: process.env.CI
    ? `CI — ${process.env.GITHUB_REF_NAME} @ ${process.env.GITHUB_SHA?.slice(0, 7)}`
    : `Local — ${new Date().toISOString().slice(0, 16)}`,

  // Skip upload locally, upload in CI
  dryRun: !process.env.CI,

  // Auto-redact env vars matching SECRET, KEY, TOKEN, PASSWORD, etc.
  scrubbing: { autoDetect: true },
})
```

> **Key insight:** The reporter uploads whatever Playwright produces. If you want traces in Checkly, enable `trace` in your Playwright config. No traces = no console/network data in the dashboard.

```typescript
use: {
  screenshot: 'only-on-failure',  // → uploaded on failure
  video: 'retain-on-failure',     // → uploaded on failure
  trace: 'retain-on-failure',     // → console + network extracted
}
```

## CI integration

The included GitHub Actions workflow runs tests on every push and uploads results to Checkly:

1. Go to **Settings → Secrets and variables → Actions**
2. Add `CHECKLY_API_KEY` and `CHECKLY_ACCOUNT_ID`
3. Push a commit

Both the Playwright HTML report and the Checkly report ZIP are saved as GitHub Actions artifacts.

## Tips

- **Combine reporters freely.** This repo uses `list` + Checkly + `html`. They all run in parallel.
- **Use `dryRun: !process.env.CI`** to skip uploads locally while still generating the JSON.
- **Session names are searchable.** Use `PR #${number}` or `${branch} @ ${sha}` to find sessions fast.
- **Visual regression baselines** are generated on first run. Run once to create them, then commit the snapshots.
- **`webServer` auto-starts the app.** No need to run the server manually before testing.

## Resources

- [Playwright Reporter docs](https://www.checklyhq.com/docs/detect/testing/playwright-reporter)
- [Changelog](https://www.checklyhq.com/docs/detect/testing/playwright-reporter-changelog)
- [npm package](https://www.npmjs.com/package/@checkly/playwright-reporter)
- [Checkly Test Sessions](https://app.checklyhq.com/test-sessions)

---

Built with 🦝 by the [Checkly](https://www.checklyhq.com) team.
