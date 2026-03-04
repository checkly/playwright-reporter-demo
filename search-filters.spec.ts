import { test, expect } from '@playwright/test';

test.describe('Search & Filters @monitor', () => {
  const BASE = process.env.ENVIRONMENT_URL || '';
  test('search filters records by title', async ({ page }) => {
    await page.goto(`${BASE}/`);

    await expect(page.getByTestId('record-card').first()).toBeVisible();
    const initialCount = await page.getByTestId('record-card').count();

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('midnight');
    await expect
      .poll(async () => page.getByTestId('record-card').count(), { timeout: 15_000 })
      .toBeLessThan(initialCount);

    const filteredCount = await page.getByTestId('record-card').count();
    expect(filteredCount).toBeGreaterThan(0);
    await expect(page.getByTestId('record-card').first().locator('.record-title')).toContainText(/midnight/i);
  });

  test('search filters records by artist name', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('search-input').fill('Slow Pour');

    const cards = page.getByTestId('record-card');
    await expect(cards).toHaveCount(1, { timeout: 15_000 });
    await expect(cards.first().locator('.record-artist')).toContainText('Slow Pour');
  });

  test('search shows empty state for no results', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('search-input').fill('xyznonexistent');

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible({ timeout: 15_000 });
    await expect(emptyState).toContainText('No records found');
  });

  test('genre filter narrows catalog to matching records', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();
    const fullCount = await page.getByTestId('record-card').count();

    const jazzFilter = page.getByTestId('genre-filters').getByText('Jazz');
    await jazzFilter.click();

    const cards = page.getByTestId('record-card');
    await expect.poll(async () => cards.count(), { timeout: 15_000 }).toBeLessThan(fullCount);
    const genres = await cards.locator('.record-genre').allTextContents();
    expect(genres.length).toBeGreaterThan(0);
    for (const genre of genres) {
      expect(genre).toContain('Jazz');
    }
  });

  test('"All" filter resets the catalog', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await expect(page.getByTestId('record-card').first()).toBeVisible();
    const fullCount = await page.getByTestId('record-card').count();

    await page.getByTestId('genre-filters').getByText('Jazz').click();
    await expect
      .poll(async () => page.getByTestId('record-card').count(), { timeout: 15_000 })
      .toBeLessThan(fullCount);
    const filteredCount = await page.getByTestId('record-card').count();
    expect(filteredCount).toBeLessThan(fullCount);

    await page.getByTestId('genre-filters').getByText('All').click();
    await expect
      .poll(async () => page.getByTestId('record-card').count(), { timeout: 15_000 })
      .toBe(fullCount);
    const resetCount = await page.getByTestId('record-card').count();
    expect(resetCount).toBe(fullCount);
  });
});
