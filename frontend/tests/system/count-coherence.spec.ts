// WO-G8 deliverable 4 (coherence sweep): every count in a header agrees
// with its drill-down. The fixture's accepted counts are the sharp case:
// D221.2 reports TWO accepted denominators (4 accepted ROWS sharing 3
// unique accepted content addresses), and the deep link filters the
// explorer BY ROW -- so every linked count must be the row count, with
// the unique-deviation census count labeled separately where shown.

import { test, expect } from '@playwright/test';

const PROJECT = 'examples.timber_pavilion';

test('dashboard accepted count equals its filtered drill-down row count', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');
  const acceptedLink = main.locator(
    `a[href="/project/${PROJECT}/obligations?filter=accepted_deviation"]`,
  );
  await expect(acceptedLink).toHaveText('4');
  await acceptedLink.click();
  await expect(page).toHaveURL(/filter=accepted_deviation/);
  await expect(page.locator('.gr-data-table__scroll')).toHaveAttribute('data-row-count', '4');
});

test('project census accepted count equals its drill-down and labels the unique count', async ({
  page,
}) => {
  await page.goto(`/project/${PROJECT}`);
  const main = page.locator('main');
  await expect(main.getByRole('link', { name: '4 accepted' })).toBeVisible();
  await expect(main.getByText('(3 unique)')).toBeVisible();
  await main.getByRole('link', { name: '4 accepted' }).click();
  await expect(page.locator('.gr-data-table__scroll')).toHaveAttribute('data-row-count', '4');
});

test('every other project census count equals its drill-down row count', async ({ page }) => {
  for (const [label, expected] of [
    ['discharged', '6'],
    ['deferred', '0'],
    ['violated', '0'],
  ] as const) {
    await page.goto(`/project/${PROJECT}`);
    await page
      .locator('main')
      .getByRole('link', { name: new RegExp(`${label}$`) })
      .click();
    if (expected === '0') {
      // An honest empty state, never a blank table (04.3).
      await expect(page.locator('main').getByText(/No obligations/)).toBeVisible();
    } else {
      await expect(page.locator('.gr-data-table__scroll')).toHaveAttribute(
        'data-row-count',
        expected,
      );
    }
  }
});
