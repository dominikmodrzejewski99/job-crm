import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated a11y smoke-tests against the live app.
 *
 * Coverage philosophy: run axe on each top-level route and fail the build
 * on any **serious** or **critical** violation. We do not fail on `minor`
 * or `moderate` so the suite stays green during cosmetic iterations — they
 * still surface as test annotations.
 */

const FAIL_LEVELS: ReadonlyArray<'critical' | 'serious'> = ['critical', 'serious'];

test.describe('Accessibility (axe)', () => {
  test('login page has no critical / serious violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
      .analyze();

    annotate(test.info(), results.violations);
    const blocking = results.violations.filter((v) => FAIL_LEVELS.includes(v.impact as never));
    expect(blocking, fmt(blocking)).toHaveLength(0);
  });

  test('register page has no critical / serious violations', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    annotate(test.info(), results.violations);
    const blocking = results.violations.filter((v) => FAIL_LEVELS.includes(v.impact as never));
    expect(blocking, fmt(blocking)).toHaveLength(0);
  });
});

function annotate(info: { annotations: Array<{ type: string; description?: string }> }, violations: ReadonlyArray<{ id: string; impact?: string | null; description: string }>): void {
  for (const v of violations) {
    info.annotations.push({
      type: `axe:${v.impact ?? 'unknown'}`,
      description: `${v.id} — ${v.description}`,
    });
  }
}

function fmt(violations: ReadonlyArray<{ id: string; impact?: string | null; description: string }>): string {
  if (violations.length === 0) return 'no violations';
  return violations.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
}
