// WO-G8 deliverable 2: performance floors, asserted in the system rig.
// - The obligation explorer must stay responsive past 1k rows: the
//   synthetic 2k-row mock project (examples.synthetic_2k, direct-URL
//   only) must render virtualized -- full count reported, but only a
//   window of rows mounted in the DOM.
// - Cold start to a usable dashboard must be under 2 seconds on the
//   fixture (charter's professionalism bar; the budget is generous for
//   CI noise -- the recorded local measurement lives in the WO ledger).

import { test, expect } from '@playwright/test';

const SYNTHETIC_2K = 'examples.synthetic_2k';

test('obligation explorer virtualizes past 1k rows (synthetic 2k mock)', async ({ page }) => {
  await page.goto(`/project/${SYNTHETIC_2K}/obligations`);
  const grid = page.locator('.gr-data-table__scroll');
  await expect(grid).toHaveAttribute('data-virtualized', 'true');
  await expect(grid).toHaveAttribute('data-row-count', '2000');
  await expect(page.getByText('2000 rows')).toBeVisible();
  const mounted = await page.locator('.gr-data-table__tr').count();
  expect(mounted).toBeGreaterThan(0);
  expect(mounted).toBeLessThan(300);

  // Scrolling deep into the table swaps the mounted window.
  const firstBefore = await page.locator('.gr-data-table__tr').first().textContent();
  await grid.evaluate((el) => {
    el.scrollTop = 32 * 1500;
    el.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('.gr-data-table__tr').first()).not.toHaveText(firstBefore ?? '');
});

test('the small fixture explorer stays unvirtualized (no behavior change under 1k)', async ({
  page,
}) => {
  await page.goto('/project/examples.timber_pavilion/obligations');
  const grid = page.locator('.gr-data-table__scroll');
  await expect(grid).toHaveAttribute('data-virtualized', 'false');
});

test('cold start: navigation to a usable dashboard table in under 2s', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await expect(page.locator('main').getByRole('table')).toBeVisible();
  const elapsed = Date.now() - start;
  expect(elapsed, `cold start took ${elapsed}ms`).toBeLessThan(2000);
});
