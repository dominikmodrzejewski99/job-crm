import { expect, Page, test } from '@playwright/test';

const TOKEN_KEY = 'jobtrack:auth:token';
const USER_KEY = 'jobtrack:auth:user';

const NOW = Date.now();
const DAY = 86_400_000;

interface OfferFixture {
  id: string;
  source: 'JUSTJOIN' | 'NOFLUFF';
  externalId: string;
  title: string;
  companyName: string;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  url: string;
  postedAt: string | null;
  fetchedAt: string;
}

const OFFERS: OfferFixture[] = [
  {
    id: 'off-1',
    source: 'JUSTJOIN',
    externalId: 'jjit-1',
    title: 'Senior Angular Developer',
    companyName: 'TechCo',
    location: 'Warszawa',
    remote: true,
    salaryMin: 18000,
    salaryMax: 25000,
    currency: 'PLN',
    url: 'https://example.com/1',
    postedAt: new Date(NOW - 1 * DAY).toISOString(),
    fetchedAt: new Date(NOW).toISOString(),
  },
  {
    id: 'off-2',
    source: 'NOFLUFF',
    externalId: 'nfj-2',
    title: 'Junior Java Developer',
    companyName: 'JavaInc',
    location: 'Kraków',
    remote: false,
    salaryMin: 6000,
    salaryMax: 8000,
    currency: 'PLN',
    url: 'https://example.com/2',
    postedAt: new Date(NOW - 2 * DAY).toISOString(),
    fetchedAt: new Date(NOW).toISOString(),
  },
  {
    id: 'off-3',
    source: 'JUSTJOIN',
    externalId: 'jjit-3',
    title: 'DevOps Engineer with Kubernetes',
    companyName: 'CloudCo',
    location: 'Warszawa',
    remote: true,
    salaryMin: 15000,
    salaryMax: 22000,
    currency: 'EUR',
    url: 'https://example.com/3',
    postedAt: new Date(NOW - 40 * DAY).toISOString(),
    fetchedAt: new Date(NOW).toISOString(),
  },
  {
    id: 'off-4',
    source: 'NOFLUFF',
    externalId: 'nfj-4',
    title: 'Lead Backend Engineer (Spring)',
    companyName: 'BankSoft',
    location: 'Warszawa',
    remote: false,
    salaryMin: 28000,
    salaryMax: 35000,
    currency: 'PLN',
    url: 'https://example.com/4',
    postedAt: new Date(NOW - 3 * DAY).toISOString(),
    fetchedAt: new Date(NOW).toISOString(),
  },
  {
    id: 'off-5',
    source: 'JUSTJOIN',
    externalId: 'jjit-5',
    title: 'Fullstack Developer (React + Node)',
    companyName: 'StartupX',
    location: 'Wrocław',
    remote: true,
    salaryMin: 12000,
    salaryMax: 16000,
    currency: 'PLN',
    url: 'https://example.com/5',
    postedAt: new Date(NOW - 5 * DAY).toISOString(),
    fetchedAt: new Date(NOW).toISOString(),
  },
];

async function installAuthAndMocks(page: Page): Promise<void> {
  await page.addInitScript(
    ([tokenKey, userKey]) => {
      localStorage.setItem(tokenKey, 'mock-jwt');
      localStorage.setItem(
        userKey,
        JSON.stringify({
          id: 'u1',
          email: 'tester@e2e.local',
          displayName: 'E2E Tester',
        }),
      );
    },
    [TOKEN_KEY, USER_KEY],
  );

  // Catch-all empty stub for any backend call we didn't explicitly mock — keeps
  // dashboard / followups / settings widgets quiet when navigating into the
  // shell.
  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/joboffers') && !url.includes('save-as-application') && !url.includes('refresh')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: OFFERS,
          totalElements: OFFERS.length,
          totalPages: 1,
          number: 0,
          size: OFFERS.length,
          empty: false,
        }),
      });
      return;
    }
    if (url.endsWith('/auth/me')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'u1', email: 'tester@e2e.local', displayName: 'E2E Tester' }),
      });
      return;
    }
    // Default: respond with empty page-shaped JSON so list endpoints don't blow up.
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0, empty: true }),
    });
  });
}

test.describe('Job board filters', () => {
  test.beforeEach(async ({ page }) => {
    await installAuthAndMocks(page);
    await page.goto('/job-board');
    await expect(page.getByTestId('offer-grid')).toBeVisible();
  });

  test('renders all offers initially', async ({ page }) => {
    await expect(page.getByTestId('offer-card')).toHaveCount(OFFERS.length);
  });

  test('search filters by title', async ({ page }) => {
    const searchBox = page.getByTestId('filter-search').locator('input').first();
    await searchBox.fill('Angular');
    await expect(page.getByTestId('offer-card')).toHaveCount(1);
    await expect(page.getByTestId('offer-card')).toContainText('Senior Angular Developer');
  });

  test('source select narrows to JustJoinIT', async ({ page }) => {
    await page.locator('ds-select').filter({ hasText: 'Źródło' }).click();
    await page.getByRole('option', { name: 'JustJoinIT' }).click();
    const cards = page.getByTestId('offer-card');
    const expected = OFFERS.filter((o) => o.source === 'JUSTJOIN').length;
    await expect(cards).toHaveCount(expected);
  });

  test('work mode chip "Remote" hides on-site offers', async ({ page }) => {
    await page.getByRole('group', { name: 'Tryb pracy' }).getByRole('button', { name: 'Remote' }).click();
    const expected = OFFERS.filter((o) => o.remote).length;
    await expect(page.getByTestId('offer-card')).toHaveCount(expected);
  });

  test('seniority chip "Senior" matches detected level', async ({ page }) => {
    await page.getByRole('group', { name: 'Seniority' }).getByRole('button', { name: 'Senior' }).click();
    // Only "Senior Angular Developer" matches /\bsenior\b/i in fixtures.
    await expect(page.getByTestId('offer-card')).toHaveCount(1);
    await expect(page.getByTestId('offer-card')).toContainText('Senior Angular Developer');
  });

  test('seniority chip "Lead" picks up Lead Backend offer', async ({ page }) => {
    await page.getByRole('group', { name: 'Seniority' }).getByRole('button', { name: 'Lead' }).click();
    await expect(page.getByTestId('offer-card')).toHaveCount(1);
    await expect(page.getByTestId('offer-card')).toContainText('Lead Backend Engineer');
  });

  test('category chip "DevOps" narrows by detected category', async ({ page }) => {
    await page.getByRole('group', { name: 'Kategoria' }).getByRole('button', { name: 'DevOps' }).click();
    await expect(page.getByTestId('offer-card')).toHaveCount(1);
    await expect(page.getByTestId('offer-card')).toContainText('DevOps Engineer');
  });

  test('salary range "min" hides low-paying offers', async ({ page }) => {
    // Min 20000 — Senior Angular (25k), DevOps (22k), Lead Backend (35k) all pass;
    // Junior Java (8k) and Fullstack (16k) get filtered out.
    const salaryGroup = page.locator('.toolbar-filter--salary');
    await salaryGroup.locator('input[placeholder="od"]').fill('20000');
    await expect(page.getByTestId('offer-card')).toHaveCount(3);
  });

  test('"posted within last week" excludes old offers', async ({ page }) => {
    await page.locator('ds-select').filter({ hasText: 'Dodane' }).click();
    await page.getByRole('option', { name: 'Ostatni tydzień' }).click();
    // Excludes the 40-day-old DevOps offer.
    await expect(page.getByTestId('offer-card')).toHaveCount(OFFERS.length - 1);
  });

  test('reset button clears all active filters', async ({ page }) => {
    await page.getByRole('group', { name: 'Seniority' }).getByRole('button', { name: 'Senior' }).click();
    await page.getByRole('group', { name: 'Tryb pracy' }).getByRole('button', { name: 'Remote' }).click();
    await expect(page.getByTestId('filter-reset')).toBeVisible();
    await expect(page.getByTestId('filter-reset')).toContainText('(2)');

    await page.getByTestId('filter-reset').click();
    await expect(page.getByTestId('filter-reset')).toBeHidden();
    await expect(page.getByTestId('offer-card')).toHaveCount(OFFERS.length);
  });

  test('sorting by salary descending puts highest-paid first', async ({ page }) => {
    await page.locator('ds-select').filter({ hasText: 'Sortuj' }).click();
    await page.getByRole('option', { name: 'Pensja: malejąco' }).click();
    const first = page.getByTestId('offer-card').first();
    // Lead Backend has the highest salaryMax (35000).
    await expect(first).toContainText('Lead Backend Engineer');
  });
});
