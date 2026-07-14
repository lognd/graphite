// README/guide screenshot capture (WO-G8 deliverable 5): real Playwright
// screenshots of the shipped app over the committed fixture mocks, saved
// into docs/screenshots/ and committed. Skipped in the ordinary test run
// (screenshots regenerate on demand, they are not assertions):
//
//   cd frontend && GRAPHITE_SCREENSHOTS=1 npx playwright test \
//     tests/system/capture-screenshots.spec.ts
//
// (or `make screenshots` at the repo root).

import { test, expect } from '@playwright/test';

const OUT = '../docs/screenshots';
const PROJECT = 'examples.timber_pavilion';

test.skip(process.env.GRAPHITE_SCREENSHOTS !== '1', 'set GRAPHITE_SCREENSHOTS=1 to regenerate');

test.use({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });

test('capture: fleet dashboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main').getByRole('table')).toBeVisible();
  await page.screenshot({ path: `${OUT}/dashboard.png` });
});

test('capture: obligation explorer (grouped by reason)', async ({ page }) => {
  await page.goto(`/project/${PROJECT}/obligations?group=reason`);
  await expect(page.locator('main').getByRole('table').first()).toBeVisible();
  await page.screenshot({ path: `${OUT}/obligation-explorer.png` });
});

test('capture: claim detail', async ({ page }) => {
  await page.goto(`/project/${PROJECT}/obligations`);
  await page.locator('.gr-data-table__tr').first().getByRole('link', { name: 'view' }).click();
  await expect(page.locator('main h1')).toBeVisible();
  await page.screenshot({ path: `${OUT}/claim-detail.png` });
});

test('capture: calc sheet', async ({ page }) => {
  await page.goto('/artifacts');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByRole('link', { name: /Calc/ }).click();
  await page.getByRole('link', { name: 'open sheet' }).first().click();
  await expect(page.getByText('Evidence chain')).toBeVisible();
  await page.screenshot({ path: `${OUT}/calc-sheet.png` });
});

test('capture: run console', async ({ page }) => {
  await page.goto('/runs');
  await expect(page.getByText('start a run')).toBeVisible();
  await page.screenshot({ path: `${OUT}/run-console.png` });
});
