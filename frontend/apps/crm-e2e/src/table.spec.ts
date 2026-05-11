import { expect, test } from '@playwright/test';

test.describe('Applications grid (AG Grid)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aplikacje' }).click();
    // Wait for AG Grid to render at least one row.
    await expect(page.locator('.ag-row').first()).toBeVisible();
  });

  test('sort indicator toggles on Firma header', async ({ page }) => {
    const header = page.locator('.ag-header-cell[col-id="company"]');
    await expect(header).toBeVisible();

    await header.click();
    await expect(header.locator('.ag-sort-ascending-icon')).toBeVisible();

    await header.click();
    await expect(header.locator('.ag-sort-descending-icon')).toBeVisible();
  });

  test('pagination advances to the next page', async ({ page }) => {
    // Default page size is 5; total rows = 10 → at least 2 pages.
    await page.locator('[ref="btNext"]').click();
    await expect(page.locator('.ag-paging-row-summary-panel')).toContainText('6 to 10');
  });

  test('row menu opens via the actions cell and Escape closes it', async ({ page }) => {
    const firstRow = page.locator('.ag-row').first();
    await firstRow.getByRole('button', { name: /więcej akcji/i }).click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('follow-up');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});
