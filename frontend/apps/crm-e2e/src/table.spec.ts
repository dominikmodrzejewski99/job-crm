import { expect, test } from '@playwright/test';

test.describe('Application table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Aplikacje' }).click();
  });

  test('cycles the sort indicator on the Firma column', async ({ page }) => {
    const header = page.locator('th[ds-sort-header="company"]');
    await expect(header).toHaveAttribute('aria-sort', 'none');

    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'ascending');

    await header.click();
    await expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  test('pagination advances to the next page', async ({ page }) => {
    const firstPage = await page.locator('tbody tr').count();
    expect(firstPage).toBeGreaterThan(0);

    await page.getByRole('button', { name: '2' }).click();
    await expect(page.locator('.ds-pagination__btn.is-active')).toHaveText('2');
  });

  test('row menu opens and closes', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await firstRow.getByRole('button', { name: /więcej akcji/i }).click();

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('follow-up');

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
  });
});
