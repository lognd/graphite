// WO-G8 deliverable 1: axe scan on EVERY shipped route, both themes.
// The gallery-a11y spec (WO-G2) covers only the dev-only component
// gallery; this spec walks the real production route table (the mocked
// fixture, VITE_USE_MOCKS=1, production preview build per playwright.config)
// so every route an end user can actually reach is verified, not just the
// component playground.

import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PROJECT = 'examples.timber_pavilion';

async function assertNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).include('body').analyze();
  expect(results.violations, `${label}: ${JSON.stringify(results.violations, null, 2)}`).toEqual(
    [],
  );
}

// The real app shell has no theme-toggle button (that is a dev-gallery-only
// affordance, see gallery-a11y.spec.ts); the shipped theme control is the
// Settings route's select, backed by localStorage['graphite.theme'] (see
// src/app/theme.tsx). Setting it directly and reloading exercises the same
// resolved-theme code path on every route without requiring a detour
// through Settings from each one.
async function setTheme(page: Page, mode: 'dark' | 'light') {
  await page.evaluate((m) => window.localStorage.setItem('graphite.theme', m), mode);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
}

// Static routes reachable directly by URL (no dynamic id needed).
const STATIC_ROUTES = [
  '/',
  '/obligations',
  '/artifacts',
  '/runs',
  '/config',
  '/doctor',
  '/settings',
];

for (const route of STATIC_ROUTES) {
  test(`axe: ${route} has no violations (dark + light)`, async ({ page }) => {
    await page.goto(route);
    await assertNoViolations(page, `${route} (dark)`);
    await setTheme(page, 'light');
    await assertNoViolations(page, `${route} (light)`);
  });
}

test('axe: project view has no violations (dark + light)', async ({ page }) => {
  await page.goto(`/project/${PROJECT}`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await assertNoViolations(page, 'project (dark)');
  await setTheme(page, 'light');
  await assertNoViolations(page, 'project (light)');
});

test('axe: filtered obligation explorer has no violations (dark + light)', async ({ page }) => {
  await page.goto(`/project/${PROJECT}/obligations?filter=accepted_deviation`);
  await expect(page.locator('main').getByRole('table')).toBeVisible();
  await assertNoViolations(page, 'obligation explorer (dark)');
  await setTheme(page, 'light');
  await assertNoViolations(page, 'obligation explorer (light)');
});

test('axe: claim detail has no violations (dark + light)', async ({ page }) => {
  await page.goto(`/project/${PROJECT}/obligations`);
  const firstRow = page.locator('.gr-data-table__tr').first();
  await firstRow.getByRole('link', { name: 'view' }).click();
  await expect(page).toHaveURL(/\/claim\//);
  await assertNoViolations(page, 'claim detail (dark)');
  await setTheme(page, 'light');
  await assertNoViolations(page, 'claim detail (light)');
});

const ARTIFACT_FAMILIES: Array<[label: string, testid: string]> = [
  ['Calc book', 'calc'],
  ['Drawings', 'drawings'],
  ['3D model', 'model'],
  ['BOM', 'bom'],
  ['Boards', 'boards'],
];

for (const [label] of ARTIFACT_FAMILIES) {
  test(`axe: artifacts/${label} family view has no violations (dark + light)`, async ({ page }) => {
    await page.goto('/artifacts');
    await page.getByLabel('project').selectOption(PROJECT);
    await page.getByRole('link', { name: new RegExp(label) }).click();
    await assertNoViolations(page, `${label} (dark)`);
    await setTheme(page, 'light');
    await assertNoViolations(page, `${label} (light)`);
  });
}

test('axe: calc sheet detail has no violations (dark + light)', async ({ page }) => {
  await page.goto('/artifacts');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByRole('link', { name: /Calc book/ }).click();
  await page.getByRole('link', { name: 'open sheet' }).first().click();
  await expect(page.getByText('Evidence chain')).toBeVisible();
  await assertNoViolations(page, 'calc sheet (dark)');
  await setTheme(page, 'light');
  await assertNoViolations(page, 'calc sheet (light)');
});
