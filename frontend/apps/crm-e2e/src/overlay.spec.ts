import { expect, test } from '@playwright/test';

test.describe('Overlay components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Overlay & feedback' }).click();
  });

  test('all four toast variants render and stack', async ({ page }) => {
    for (const variant of ['Success', 'Info', 'Warning', 'Error'] as const) {
      await page.getByRole('button', { name: variant, exact: true }).click();
    }
    await expect(page.locator('.ds-toast')).toHaveCount(4);
  });

  test('modal confirms and emits a toast on confirm', async ({ page }) => {
    await page.getByRole('button', { name: /usuń aplikację \(modal\)/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Usuń', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('.ds-toast').first()).toContainText(/usunięto/i);
  });
});
