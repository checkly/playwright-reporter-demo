# Checkout with SQLite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a SQLite-backed checkout flow to Raccoon Records so a database timeout misconfiguration produces realistic 503 failures that Checkly catches.

**Architecture:** New `db.js` module initializes SQLite with `better-sqlite3`, creates `inventory` and `orders` tables, seeds stock from the existing hardcoded catalog. The checkout endpoint reads cart, validates/decrements stock in a transaction, inserts an order. A configurable `timeout` in `db.js` is the breakable knob for the demo. Frontend gets a checkout confirmation/error state in the existing cart drawer.

**Tech Stack:** Express (existing), `better-sqlite3`, vanilla JS frontend (existing), Playwright tests (existing)

---

### Task 1: Install better-sqlite3 and add db.js

**Files:**
- Modify: `package.json`
- Create: `db.js`
- Modify: `.gitignore`

**Step 1: Install better-sqlite3**

Run: `cd /tmp/raccoon-records && npm install better-sqlite3`

**Step 2: Add raccoon.db to .gitignore**

Append to `.gitignore`:
```
raccoon.db
```

**Step 3: Create db.js**

Create `db.js`:
```js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'raccoon.db');
const db = new Database(dbPath, { timeout: 5000 });

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

// ── Schema ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS inventory (
    record_id INTEGER PRIMARY KEY,
    stock INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    items TEXT NOT NULL,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
```

**Step 4: Commit**

```bash
git add package.json package-lock.json db.js .gitignore
git commit -m "feat: add better-sqlite3 and db module with inventory/orders schema"
```

---

### Task 2: Seed inventory from catalog and wire stock reads

**Files:**
- Modify: `server.js:1-5` (add db require)
- Modify: `server.js:283-283` (add seed logic after records array)
- Modify: `server.js:297-328` (GET /api/records — merge DB stock)
- Modify: `server.js:330-337` (GET /api/records/:id — merge DB stock)

**Step 1: Add db require at top of server.js**

After line 2 (`const path = require('path');`), add:
```js
const db = require('./db');
```

**Step 2: Add inventory seeding after the records array (after line 283)**

After the closing `];` of the records array, add:
```js

// ── Seed inventory from catalog on startup ───────────────────────
const seedInventory = db.prepare(
  'INSERT OR IGNORE INTO inventory (record_id, stock) VALUES (?, ?)'
);
const seedMany = db.transaction((records) => {
  for (const r of records) seedInventory.run(r.id, r.stock);
});
seedMany(records);
```

**Step 3: Modify GET /api/records to read stock from DB**

Replace the `res.json(results);` line at end of the GET /api/records handler (line 327) with:
```js
  // Merge live stock from DB
  const stockRows = db.prepare('SELECT record_id, stock FROM inventory').all();
  const stockMap = Object.fromEntries(stockRows.map((r) => [r.record_id, r.stock]));
  const withStock = results.map((r) => ({ ...r, stock: stockMap[r.id] ?? r.stock }));
  res.json(withStock);
```

**Step 4: Modify GET /api/records/:id to read stock from DB**

Replace `res.json(record);` in the GET /api/records/:id handler (line 336) with:
```js
  const inv = db.prepare('SELECT stock FROM inventory WHERE record_id = ?').get(record.id);
  res.json({ ...record, stock: inv ? inv.stock : record.stock });
```

**Step 5: Run existing tests to verify nothing breaks**

Run: `cd /tmp/raccoon-records && npx playwright test --project=chromium`
Expected: All existing tests pass. Stock values should match since we seeded from the same data.

**Step 6: Commit**

```bash
git add server.js
git commit -m "feat: seed inventory from catalog and serve stock from SQLite"
```

---

### Task 3: Add checkout API endpoint

**Files:**
- Modify: `server.js` (add routes before the "Start server" section, around line 380)

**Step 1: Add POST /api/checkout route**

Before the `// ── Start server` comment, add:
```js
// ── Checkout ─────────────────────────────────────────────────────
const checkout = db.transaction(() => {
  if (cart.length === 0) {
    throw new Error('Cart is empty');
  }

  const orderItems = [];
  let total = 0;

  for (const item of cart) {
    const record = records.find((r) => r.id === item.recordId);
    if (!record) throw new Error(`Record ${item.recordId} not found`);

    const inv = db.prepare('SELECT stock FROM inventory WHERE record_id = ?').get(item.recordId);
    if (!inv || inv.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${record.title}"`);
    }

    db.prepare('UPDATE inventory SET stock = stock - ? WHERE record_id = ?').run(item.quantity, item.recordId);
    const lineTotal = record.price * item.quantity;
    orderItems.push({ recordId: item.recordId, title: record.title, quantity: item.quantity, price: record.price });
    total += lineTotal;
  }

  total = Math.round(total * 100) / 100;

  const result = db.prepare(
    'INSERT INTO orders (items, total, status) VALUES (?, ?, ?)'
  ).run(JSON.stringify(orderItems), total, 'confirmed');

  cart = [];

  return { orderId: result.lastInsertRowid, items: orderItems, total };
});

app.post('/api/checkout', (req, res) => {
  try {
    const order = checkout();
    res.status(201).json(order);
  } catch (err) {
    if (err.message === 'Cart is empty') {
      return res.status(400).json({ error: err.message });
    }
    if (err.message.startsWith('Insufficient stock')) {
      return res.status(409).json({ error: err.message });
    }
    console.error('Checkout failed:', err.message);
    res.status(503).json({ error: 'Checkout service unavailable. Please try again.' });
  }
});
```

**Step 2: Add GET /api/orders/:id route**

Right after the checkout route:
```js
app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(parseInt(req.params.id));
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ ...order, items: JSON.parse(order.items) });
});
```

**Step 3: Commit**

```bash
git add server.js
git commit -m "feat: add POST /api/checkout and GET /api/orders/:id endpoints"
```

---

### Task 4: Add checkout test

**Files:**
- Create: `checkout.spec.ts`

**Step 1: Write checkout.spec.ts**

```ts
import { test, expect } from '@playwright/test';

test.describe('Checkout', () => {
  const BASE = 'http://localhost:3000';

  test.beforeEach(async ({ request }) => {
    await request.delete(`${BASE}/api/cart`);
  });

  test('POST /api/checkout creates an order and decrements stock', async ({ request }) => {
    // Get initial stock for record 1
    const before = await (await request.get(`${BASE}/api/records/1`)).json();

    // Add to cart and checkout
    await request.post(`${BASE}/api/cart`, { data: { recordId: 1, quantity: 1 } });
    const checkoutRes = await request.post(`${BASE}/api/checkout`);

    expect(checkoutRes.status()).toBe(201);

    const order = await checkoutRes.json();
    expect(order).toHaveProperty('orderId');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].recordId).toBe(1);
    expect(order.total).toBe(before.price);

    // Verify stock decremented
    const after = await (await request.get(`${BASE}/api/records/1`)).json();
    expect(after.stock).toBe(before.stock - 1);
  });

  test('POST /api/checkout with empty cart returns 400', async ({ request }) => {
    const res = await request.post(`${BASE}/api/checkout`);
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Cart is empty');
  });

  test('GET /api/orders/:id returns the created order', async ({ request }) => {
    await request.post(`${BASE}/api/cart`, { data: { recordId: 3, quantity: 2 } });
    const checkoutRes = await request.post(`${BASE}/api/checkout`);
    const { orderId } = await checkoutRes.json();

    const orderRes = await request.get(`${BASE}/api/orders/${orderId}`);
    expect(orderRes.status()).toBe(200);

    const order = await orderRes.json();
    expect(order.id).toBe(orderId);
    expect(order.status).toBe('confirmed');
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
  });

  test('full checkout flow via UI', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    // Add item to cart
    await page.getByTestId('add-to-cart-1').click();
    await expect(page.getByTestId('cart-badge')).toContainText('1');

    // Open cart and checkout
    await page.getByTestId('cart-button').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();
    await page.getByTestId('checkout-btn').click();

    // Verify confirmation appears
    await expect(page.getByTestId('checkout-confirmation')).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('checkout-confirmation')).toContainText('Order');
  });
});
```

**Step 2: Run checkout tests to verify they pass**

Run: `cd /tmp/raccoon-records && npx playwright test checkout.spec.ts --project=chromium`
Expected: All 4 tests pass.

**Step 3: Commit**

```bash
git add checkout.spec.ts
git commit -m "test: add checkout API and UI flow tests"
```

---

### Task 5: Add checkout UI (confirmation and error states in cart drawer)

**Files:**
- Modify: `index.html` — CSS (after `.cart-clear-btn` styles, ~line 580), cart drawer HTML (~line 709-716), and JS (~line 780-784)

**Step 1: Add CSS for checkout states**

After the `.cart-clear-btn` rule (after line 580), add:
```css
    /* ── Checkout States ──────────────────────────────── */
    .checkout-confirmation {
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .checkout-confirmation .success-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .checkout-confirmation h3 {
      font-family: var(--serif);
      font-size: 1.3rem;
      margin-bottom: 0.5rem;
    }

    .checkout-confirmation .order-id {
      font-family: var(--mono);
      color: var(--accent);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .checkout-confirmation .order-total {
      font-family: var(--mono);
      font-size: 1.5rem;
      color: var(--accent);
      margin-bottom: 1.5rem;
    }

    .checkout-error {
      padding: 2rem 1.5rem;
      text-align: center;
    }

    .checkout-error .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .checkout-error h3 {
      font-family: var(--serif);
      font-size: 1.3rem;
      color: var(--danger);
      margin-bottom: 0.5rem;
    }

    .checkout-error .error-message {
      font-family: var(--mono);
      font-size: 0.85rem;
      color: var(--text-muted);
      background: var(--bg);
      padding: 0.75rem;
      border-radius: var(--radius);
      margin-bottom: 1.5rem;
      word-break: break-word;
    }

    .checkout-continue-btn {
      width: 100%;
      background: var(--accent);
      color: var(--bg);
      border: none;
      padding: 0.8rem;
      border-radius: var(--radius);
      font-family: var(--sans);
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
    }

    .checkout-retry-btn {
      width: 100%;
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.8rem;
      border-radius: var(--radius);
      font-family: var(--sans);
      font-size: 0.95rem;
      cursor: pointer;
      margin-bottom: 0.5rem;
    }
```

**Step 2: Add checkout state containers to cart drawer HTML**

After the `cart-footer` div closing tag (line 716, before `</div>` that closes cart-drawer), add:
```html
    <!-- Checkout states (hidden by default, shown by JS) -->
    <div class="checkout-confirmation" data-testid="checkout-confirmation" style="display:none">
      <div class="success-icon">✓</div>
      <h3>Order Confirmed!</h3>
      <div class="order-id" data-testid="order-id"></div>
      <div class="order-total" data-testid="order-total"></div>
      <button class="checkout-continue-btn" data-testid="continue-shopping-btn">Continue Shopping</button>
    </div>
    <div class="checkout-error" data-testid="checkout-error" style="display:none">
      <div class="error-icon">!</div>
      <h3>Checkout Failed</h3>
      <div class="error-message" data-testid="checkout-error-message"></div>
      <button class="checkout-retry-btn" data-testid="checkout-retry-btn">Try Again</button>
      <button class="checkout-continue-btn" data-testid="checkout-error-close-btn">Close</button>
    </div>
```

**Step 3: Add checkout JS functions**

Replace the `clearCart` function and add checkout functions. After the `clearCart` function (~line 780-784), add the `performCheckout` function:

```js
    async function performCheckout() {
      try {
        const res = await fetch('/api/checkout', { method: 'POST' });
        if (!res.ok) {
          const err = await res.json();
          showCheckoutError(err.error || `HTTP ${res.status}`);
          return;
        }
        const order = await res.json();
        showCheckoutConfirmation(order);
        await fetchCart();
      } catch (err) {
        showCheckoutError(err.message);
      }
    }

    function showCheckoutConfirmation(order) {
      document.querySelector('[data-testid="cart-items"]').style.display = 'none';
      document.querySelector('.cart-footer').style.display = 'none';
      document.querySelector('[data-testid="checkout-error"]').style.display = 'none';
      const conf = document.querySelector('[data-testid="checkout-confirmation"]');
      conf.style.display = 'block';
      conf.querySelector('[data-testid="order-id"]').textContent = `Order #${order.orderId}`;
      conf.querySelector('[data-testid="order-total"]').textContent = `$${order.total.toFixed(2)}`;
    }

    function showCheckoutError(message) {
      document.querySelector('[data-testid="cart-items"]').style.display = 'none';
      document.querySelector('.cart-footer').style.display = 'none';
      document.querySelector('[data-testid="checkout-confirmation"]').style.display = 'none';
      const err = document.querySelector('[data-testid="checkout-error"]');
      err.style.display = 'block';
      err.querySelector('[data-testid="checkout-error-message"]').textContent = message;
    }

    function resetCartDrawer() {
      document.querySelector('[data-testid="cart-items"]').style.display = '';
      document.querySelector('.cart-footer').style.display = '';
      document.querySelector('[data-testid="checkout-confirmation"]').style.display = 'none';
      document.querySelector('[data-testid="checkout-error"]').style.display = 'none';
    }
```

**Step 4: Wire up the event listeners**

In the event listeners section (~line 888-890), wire the checkout and continue/retry buttons:

Replace the existing checkout button listener (it's the `cart-checkout-btn` data-testid, currently not wired to anything useful). Add after the `clear-cart-btn` listener:

```js
    document.querySelector('[data-testid="checkout-btn"]').addEventListener('click', performCheckout);
    document.querySelector('[data-testid="continue-shopping-btn"]').addEventListener('click', () => { resetCartDrawer(); cartDrawer.classList.remove('open'); });
    document.querySelector('[data-testid="checkout-retry-btn"]').addEventListener('click', () => { resetCartDrawer(); renderCartItems(); });
    document.querySelector('[data-testid="checkout-error-close-btn"]').addEventListener('click', () => { resetCartDrawer(); cartDrawer.classList.remove('open'); });
```

Also update the cart open handler to always reset the drawer state:
Replace line 888:
```js
    cartBtn.addEventListener('click', () => { fetchCart().then(renderCartItems); cartDrawer.classList.add('open'); });
```
with:
```js
    cartBtn.addEventListener('click', () => { resetCartDrawer(); fetchCart().then(renderCartItems); cartDrawer.classList.add('open'); });
```

**Step 5: Run all tests**

Run: `cd /tmp/raccoon-records && npx playwright test --project=chromium`
Expected: All tests pass including the UI checkout flow test from Task 4.

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add checkout confirmation and error UI in cart drawer"
```

---

### Task 6: Update module exports for test isolation

**Files:**
- Modify: `server.js:386` (module.exports line)

**Step 1: Export db for test cleanup**

Replace the existing module.exports line:
```js
module.exports = { app, resetCart: () => { cart = []; } };
```
with:
```js
module.exports = { app, db, resetCart: () => { cart = []; } };
```

**Step 2: Run full test suite across all projects**

Run: `cd /tmp/raccoon-records && npx playwright test`
Expected: All tests pass across chromium, firefox, and mobile-chrome.

**Step 3: Commit**

```bash
git add server.js
git commit -m "feat: export db from server module for test access"
```

---

### Task 7: Final verification and cleanup

**Step 1: Delete the SQLite DB to verify clean startup**

Run: `cd /tmp/raccoon-records && rm -f raccoon.db && node -e "require('./db'); console.log('DB created OK')"`
Expected: `DB created OK`

**Step 2: Start the server and verify manually**

Run: `cd /tmp/raccoon-records && node server.js &`
Then: `curl -s http://localhost:3000/api/records/1 | node -e "process.stdin.on('data',d=>console.log('stock:',JSON.parse(d).stock))"`
Expected: `stock: 12`
Then: `kill %1`

**Step 3: Run full test suite one last time**

Run: `cd /tmp/raccoon-records && rm -f raccoon.db && npx playwright test`
Expected: All tests pass.

**Step 4: Commit any remaining changes (if any)**

Only if there were fixes needed from the verification steps.
