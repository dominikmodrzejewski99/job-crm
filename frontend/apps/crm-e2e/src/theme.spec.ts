import { expect, test } from '@playwright/test';

test.describe('Theme switch', () => {
  test('toggling between dark and light updates data-theme', async ({ page }) => {
    await page.goto('/');

    // Default is dark (set in index.html).
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('button', { name: 'Jasny' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.getByRole('button', { name: 'Ciemny' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('persists theme across reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Jasny' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
