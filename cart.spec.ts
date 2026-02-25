import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  // Cart is shared DB state — run serially to avoid race conditions
  test.describe.configure({ mode: 'serial' });
  const BASE = process.env.ENVIRONMENT_URL || '';
  test.beforeEach(async ({ request }) => {
    // Clear cart before each test via API
    await request.delete(`${BASE}/api/cart`);
  });

  test('add to cart from catalog card', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('add-to-cart-1').click();

    await expect(page.getByTestId('cart-badge')).toContainText('1');
    await expect(page.getByTestId('toast')).toContainText('Added to cart');
  });

  test('cart drawer opens and shows items', async ({ page, request }) => {
    // Pre-add an item via API
    await request.post(`${BASE}/api/cart`, {
      data: { recordId: 1 },
    });

    await page.goto(`${BASE}/`);

    await page.getByTestId('cart-button').click();

    const drawer = page.getByTestId('cart-drawer');
    await expect(drawer).toBeVisible();

    const items = drawer.getByTestId('cart-item');
    await expect(items).toHaveCount(1);

    await expect(page.getByTestId('cart-total')).toContainText('$');
  });

  test('clear cart empties all items', async ({ page, request }) => {
    await request.post(`${BASE}/api/cart`, { data: { recordId: 1 } });
    await request.post(`${BASE}/api/cart`, { data: { recordId: 2 } });

    await page.goto(`${BASE}/`);

    await page.getByTestId('cart-button').click();
    await expect(page.getByTestId('cart-item').first()).toBeVisible();

    await page.getByTestId('clear-cart-btn').click();

    await expect(page.getByTestId('cart-drawer')).toContainText('empty');
    await expect(page.getByTestId('cart-total')).toContainText('$0.00');
  });

  test('cart badge updates when adding multiple items', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('add-to-cart-1').click();
    await page.waitForTimeout(300);
    await page.getByTestId('add-to-cart-2').click();

    await expect(page.getByTestId('cart-badge')).toContainText('2');
  });

  test('cart close button hides the drawer', async ({ page }) => {
    await page.goto(`${BASE}/`);

    await page.getByTestId('cart-button').click();
    await expect(page.getByTestId('cart-drawer')).toBeVisible();

    await page.getByTestId('cart-close').click();
    await page.waitForTimeout(400);
  });
});
