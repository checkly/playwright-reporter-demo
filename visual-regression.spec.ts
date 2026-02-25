import { test, expect } from '@playwright/test';

test.describe('Visual Regression @visual', () => {
  test('homepage layout matches snapshot', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByTestId('record-card').first()).toBeVisible();
    await page.waitForLoadState('networkidle');

    // First run creates the baseline. Subsequent runs compare against it.
    // Failed comparisons generate diff images — these get uploaded to Checkly.
    await expect(page).toHaveScreenshot('homepage-full.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    });
  });

  test('record detail modal layout matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('record-card').first().click();
    await expect(page.getByTestId('modal-title')).toBeVisible();

    await expect(page.getByTestId('record-modal')).toHaveScreenshot('record-modal.png', {
      maxDiffPixelRatio: 0.05,
    });
  });

  test('empty search state layout matches snapshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('record-card').first()).toBeVisible();

    await page.getByTestId('search-input').fill('xyznonexistent');
    await page.waitForTimeout(500);
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await expect(page).toHaveScreenshot('empty-search.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
