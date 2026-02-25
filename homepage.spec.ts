import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  const BASE = process.env.ENVIRONMENT_URL || '';
  test('loads with correct title and branding', async ({ page }) => {
    await page.goto(`${BASE}/`);

    await expect(page).toHaveTitle(/Raccoon Records/);

    const logo = page.getByTestId('logo');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('Raccoon Records');
  });

  test('displays the record catalog', async ({ page }) => {
    await page.goto(`${BASE}/`);

    const grid = page.getByTestId('record-grid');
    const cards = grid.getByTestId('record-card');
    await expect(cards.first()).toBeVisible();

    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('each record card shows title, artist, and price', async ({ page }) => {
    await page.goto(`${BASE}/`);

    const firstCard = page.getByTestId('record-card').first();
    await expect(firstCard).toBeVisible();

    await expect(firstCard.locator('.record-title')).not.toBeEmpty();
    await expect(firstCard.locator('.record-artist')).not.toBeEmpty();
    await expect(firstCard.locator('.record-price')).toContainText('$');
  });

  test('shows genre filter buttons', async ({ page }) => {
    await page.goto(`${BASE}/`);

    const filters = page.getByTestId('genre-filters');
    await expect(filters).toBeVisible();

    const allBtn = filters.getByText('All');
    await expect(allBtn).toHaveClass(/active/);

    const buttons = filters.locator('.filter-btn');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(1);
  });

  test('cart button is visible with empty badge', async ({ page }) => {
    await page.goto(`${BASE}/`);

    const cartBtn = page.getByTestId('cart-button');
    await expect(cartBtn).toBeVisible();
    await expect(cartBtn).toContainText('Cart');
  });
});
