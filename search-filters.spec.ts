import { test, expect } from '@playwright/test';

test.describe('Search & Filters', () => {
  test('search filters records by title', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('record-card').first()).toBeVisible();
    const initialCount = await page.getByTestId('record-card').count();

    const searchInput = page.getByTestId('search-input');
    await searchInput.fill('midnight');
    await page.waitForTimeout(500);

    const filteredCount = await page.getByTestId('record-card').count();
    expect(filteredCount).toBeLessThan(initialCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('search filters records by artist name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('search-input').fill('Slow Pour');
    await page.waitForTimeout(500);

    const cards = page.getByTestId('record-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first().locator('.record-artist')).toContainText('Slow Pour');
  });

  test('search shows empty state for no results', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('search-input').fill('xyznonexistent');
    await page.waitForTimeout(500);

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText('No records found');
  });

  test('genre filter narrows catalog to matching records', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    const jazzFilter = page.getByTestId('genre-filters').getByText('Jazz');
    await jazzFilter.click();
    await page.waitForTimeout(300);

    const cards = page.getByTestId('record-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i).locator('.record-genre')).toContainText('Jazz');
    }
  });

  test('"All" filter resets the catalog', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();
    const fullCount = await page.getByTestId('record-card').count();

    await page.getByTestId('genre-filters').getByText('Jazz').click();
    await page.waitForTimeout(300);
    const filteredCount = await page.getByTestId('record-card').count();
    expect(filteredCount).toBeLessThan(fullCount);

    await page.getByTestId('genre-filters').getByText('All').click();
    await page.waitForTimeout(300);
    const resetCount = await page.getByTestId('record-card').count();
    expect(resetCount).toBe(fullCount);
  });
});
