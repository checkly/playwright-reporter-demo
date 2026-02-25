import { test, expect } from '@playwright/test';

test.describe('Product Detail', () => {
  const BASE = process.env.ENVIRONMENT_URL || '';
  test.beforeEach(async ({ request }) => {
    // Clear cart to avoid stale badge counts from parallel tests
    await request.delete(`${BASE}/api/cart`);
  });
  test('clicking a record card opens the detail modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();

    const modal = page.getByTestId('record-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('modal-title')).not.toBeEmpty();
  });

  test('modal displays all record details', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();

    await expect(page.getByTestId('modal-title')).not.toBeEmpty();
    await expect(page.getByTestId('modal-artist')).not.toBeEmpty();
    await expect(page.getByTestId('modal-genre')).not.toBeEmpty();
    await expect(page.getByTestId('modal-description')).not.toBeEmpty();
    await expect(page.getByTestId('modal-price')).toContainText('$');
    await expect(page.getByTestId('modal-year')).not.toBeEmpty();
    await expect(page.getByTestId('modal-rating')).toContainText('★');
    await expect(page.getByTestId('modal-stock')).toContainText('stock');
  });

  test('close button dismisses the modal', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();
    await expect(page.getByTestId('record-modal')).toBeVisible();

    await page.getByTestId('modal-close').click();
    await expect(page.getByTestId('record-modal')).not.toBeVisible();
  });

  test('clicking outside the modal dismisses it', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();
    await expect(page.getByTestId('record-modal')).toBeVisible();

    await page.getByTestId('record-modal').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('record-modal')).not.toBeVisible();
  });

  test('add to cart from modal updates the cart badge', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();
    await page.getByTestId('modal-add-to-cart').click();

    const badge = page.getByTestId('cart-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('1');
  });
});
