// The charter's two standing questions, walked end to end (WO-G3
// deliverable 5): fleet -> project -> filtered obligation explorer ->
// claim detail. Runs against VITE_USE_MOCKS=1 fixtures (playwright.config
// baseURL), so no backend process is required.

import { test, expect } from '@playwright/test';

test('walks fleet -> project -> filtered explorer -> claim detail', async ({ page }) => {
  await page.goto('/');
  const main = page.locator('main');

  // "is my fleet healthy?" -- the fleet dashboard's census row.
  await expect(main.getByRole('table')).toBeVisible();
  await main.getByRole('link', { name: 'examples.timber_pavilion' }).first().click();
  await expect(page).toHaveURL(/\/project\/examples\.timber_pavilion$/);

  // Project view: census header + drill-through into a filtered explorer.
  await expect(main.getByRole('link', { name: /accepted$/ })).toBeVisible();
  await main.getByRole('link', { name: /accepted$/ }).click();
  await expect(page).toHaveURL(/\/obligations\?filter=accepted_deviation/);

  // "why did this claim defer/fail?" -- the flagship obligation table,
  // already filtered via URL state from the dashboard/project deep link.
  await expect(main.getByRole('table')).toBeVisible();
  const firstRow = main.locator('.gr-data-table__tr').first();
  await expect(firstRow).toBeVisible();
  await firstRow.getByRole('link', { name: 'view' }).click();

  // Claim detail: source text, verdict, and prev/next.
  await expect(page).toHaveURL(/\/claim\//);
  await expect(main.locator('h1')).toBeVisible();
  await expect(main.getByText(/\d+ \/ \d+/)).toBeVisible();
});

test('copies the obligation explorer as a markdown report', async ({ page }) => {
  await page.goto('/project/examples.timber_pavilion/obligations');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'copy as report' }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard).toContain('| Claim | Disposition | Subject | Model | Reason |');
});
