# Design: Checkout Flow with SQLite

**Date:** 2026-02-25
**Purpose:** Add a realistic database-backed checkout to Raccoon Records so it can serve as the breakable demo for the Claude Code + Checkly CLI incident response blog post.

## Context

Raccoon Records is a vinyl store demo app (Express + vanilla JS) used to showcase `@checkly/playwright-reporter`. It currently has no database — catalog and cart are in-memory. The incident demo needs a checkout endpoint that hits a real database so a misconfiguration (timeout typo) produces realistic 503s that Checkly catches.

## Architecture

```
server.js          — existing Express app, modified to use db for stock
db.js (new)        — SQLite init, config with `timeout` param (the breakable knob)
raccoon.db (new)   — auto-created on first run, gitignored
index.html         — add checkout button + confirmation/error UI in cart drawer
checkout.spec.ts   — Playwright test that exercises the full checkout flow
```

### Dependencies
- `better-sqlite3` — synchronous SQLite for Node. Zero config, single file DB.

## Data Model

### `inventory` table
| Column    | Type    | Notes                    |
|-----------|---------|--------------------------|
| record_id | INTEGER | PK, matches catalog id   |
| stock     | INTEGER | Decremented on checkout  |

Seeded on first run from the hardcoded `records` array in server.js.

### `orders` table
| Column     | Type    | Notes                           |
|------------|---------|--------------------------------|
| id         | INTEGER | PK autoincrement               |
| items      | TEXT    | JSON array of {recordId, qty, price} |
| total      | REAL    | Order total                    |
| status     | TEXT    | 'confirmed'                    |
| created_at | TEXT    | ISO timestamp                  |

## API Changes

### New routes
- `POST /api/checkout` — validate stock from DB, insert order, decrement inventory, clear cart. Returns `{ orderId, total, items }` on success, 503 on DB failure.
- `GET /api/orders/:id` — return order details for confirmation display.

### Modified routes
- `GET /api/records` — read stock from `inventory` table instead of hardcoded value.
- `GET /api/records/:id` — same stock change.

## Frontend Changes

Minimal additions to `index.html`:
- Checkout button in cart drawer wires to `POST /api/checkout`
- On success: replace cart drawer content with order confirmation (order ID, items, total)
- On error: show error state in cart drawer with the actual error message (so the 503 / "database busy" is visible on screen during demo recording)

## The Incident Mechanism

`db.js` contains:
```js
const Database = require('better-sqlite3');
const db = new Database('./raccoon.db', { timeout: 5000 });
```

The "bad commit" for the demo changes `timeout: 5000` to `timeout: 5`. With a 5ms timeout, any concurrent DB access triggers `SQLITE_BUSY`, which the checkout endpoint surfaces as a 503. This is:
- A real SQLite configuration parameter
- A plausible typo (deleted three zeros)
- Produces a realistic error signature ("database is locked")

## Test Coverage

### New: `checkout.spec.ts`
- Add items to cart, click checkout, verify confirmation UI appears with order ID
- Verify stock decremented after checkout
- Verify checkout with empty cart shows appropriate message

### Existing tests
All 29 existing tests remain unchanged and passing. Stock values in the hardcoded array serve as seed data, so catalog tests see the same initial state.

## What's NOT in scope
- User authentication
- Payment processing
- Order history page
- Inventory management UI
- Any changes to the Checkly Reporter configuration
