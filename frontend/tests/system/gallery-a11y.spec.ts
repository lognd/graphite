// Theme switching + axe a11y smoke on the component gallery (WO-G2
// deliverable 6). Verifies both dark and light themes render with no
// detectable WCAG violations (spec 03/charter 4).

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// The gallery is a dev-only route (spec: never shipped in production), so
// this spec targets the dev server webServer entry, not the production
// preview build the other system specs use.
test.use({ baseURL: 'http://127.0.0.1:5174' });

test('gallery is accessible in dark theme', async ({ page }) => {
  await page.goto('/dev/gallery');
  await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/);
  const results = await new AxeBuilder({ page }).include('body').analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('gallery is accessible in light theme after toggling', async ({ page }) => {
  await page.goto('/dev/gallery');
  await page.getByRole('button', { name: 'toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /dark|light/);
  const results = await new AxeBuilder({ page }).include('body').analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
