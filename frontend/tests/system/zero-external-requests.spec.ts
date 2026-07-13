// The charter 3.1 enforcement mechanism: fails on ANY request that does not
// target localhost/127.0.0.1 -- fonts, icons, scripts, everything must be
// bundled (spec 02.6).

import { test, expect } from '@playwright/test';

test('the app makes zero requests to a non-localhost host', async ({ page }) => {
  const offenders: string[] = [];

  page.on('request', (request) => {
    const url = new URL(request.url());
    const host = url.hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      offenders.push(request.url());
    }
  });

  await page.goto('/');
  await page.getByRole('navigation', { name: 'primary' }).waitFor();
  await page.getByRole('link', { name: 'obligations' }).click();
  await page.getByRole('link', { name: 'artifacts' }).click();
  await page.getByRole('link', { name: 'runs' }).click();
  await page.getByRole('link', { name: 'config' }).click();

  expect(offenders, `non-localhost requests: ${offenders.join(', ')}`).toEqual([]);
});
