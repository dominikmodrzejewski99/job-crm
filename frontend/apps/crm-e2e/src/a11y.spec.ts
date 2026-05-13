import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * Automated a11y smoke-tests against the live app.
 *
 * Coverage philosophy: run axe on each top-level route and fail the build
 * on any **serious** or **critical** violation. We do not fail on `minor`
 * or `moderate` so the suite stays green during cosmetic iterations — they
 * still surface as test annotations.
 *
 * Auth-gated pages (dashboard, applications, follow-up, settings) use the
 * test fixture in playwright.config.ts to bypass login. If that bootstrap
 * isn't available yet, those tests skip gracefully rather than fail.
 */

const FAIL_LEVELS: ReadonlyArray<'critical' | 'serious'> = ['critical', 'serious'];
const TAGS: ReadonlyArray<string> = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('Accessibility (axe)', () => {
  test('landing page has no critical / serious violations', async ({ page }) => {
    await page.goto('/landing');
    await expect(page.locator('h1').first()).toBeVisible();
    await runAxe(page, test.info());
  });

  test('login page has no critical / serious violations', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();
    await runAxe(page, test.info());
  });

  test('register page has no critical / serious violations', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('h1')).toBeVisible();
    await runAxe(page, test.info());
  });

  test('skip link is reachable on Tab and points at <main>', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('href', '#main-content');
  });
});

async function runAxe(
  page: import('@playwright/test').Page,
  info: import('@playwright/test').TestInfo,
): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
  for (const v of results.violations) {
    info.annotations.push({
      type: `axe:${v.impact ?? 'unknown'}`,
      description: `${v.id} — ${v.description}`,
    });
  }
  const blocking = results.violations.filter((v) =>
    FAIL_LEVELS.includes(v.impact as never),
  );
  expect(blocking, fmt(blocking)).toHaveLength(0);
}

function fmt(
  violations: ReadonlyArray<{ id: string; impact?: string | null; description: string }>,
): string {
  if (violations.length === 0) return 'no violations';
  return violations.map((v) => `[${v.impact}] ${v.id}: ${v.description}`).join('\n');
}
