import { expect, test } from '@playwright/test';

test.describe('Signal-based form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: 'Dodaj aplikację' }).click();
  });

  test('blocks submit until required fields are filled', async ({ page }) => {
    const submit = page.getByRole('button', { name: 'Zapisz aplikację' });
    await expect(submit).toBeDisabled();

    await page.getByLabel('Firma').fill('Ac');
    await expect(submit).toBeDisabled(); // position still empty

    await page.getByLabel('Stanowisko').fill('Senior Backend');
    await expect(submit).toBeEnabled();
  });

  test('signal preview reflects field changes in real time', async ({ page }) => {
    await page.getByLabel('Firma').fill('Acme');
    await page.getByLabel('Stanowisko').fill('Java Engineer');

    const preview = page.locator('.form-result__code').first();
    await expect(preview).toContainText('"company": "Acme"');
    await expect(preview).toContainText('"position": "Java Engineer"');
  });

  test('shows toast on successful submit', async ({ page }) => {
    await page.getByLabel('Firma').fill('Acme');
    await page.getByLabel('Stanowisko').fill('Java Engineer');
    await page.getByRole('button', { name: 'Zapisz aplikację' }).click();

    await expect(page.locator('.ds-toast').first()).toContainText(/zapisana/i);
  });
});
