// The deferral group-by walk (WO-G3 deliverable 5): the obligation
// explorer's group-by-reason/family/part affordance (04.1 "any list of
// problems" companion checklist), driven entirely through URL state so
// it is a real deep link, not just client component state.

import { test, expect } from '@playwright/test';

test('groups the obligation explorer by reason, then by family', async ({ page }) => {
  await page.goto('/project/examples.timber_pavilion/obligations');
  const main = page.locator('main');

  await main.getByRole('button', { name: 'reason', exact: true }).click();
  await expect(page).toHaveURL(/group=reason/);
  await expect(main.getByRole('heading', { name: /accepted_deviation/ })).toBeVisible();
  await expect(main.getByRole('heading', { name: /calc_sheet/ })).toBeVisible();

  await main.getByRole('button', { name: 'family', exact: true }).click();
  await expect(page).toHaveURL(/group=family/);
  await expect(main.getByRole('heading', { name: /^strength/ })).toBeVisible();

  // Reloading the URL directly (a bookmarked/shared deep link) must
  // reproduce the same grouped view -- the group lives in the URL, not
  // component state.
  await page.reload();
  await expect(main.getByRole('heading', { name: /^strength/ })).toBeVisible();

  await main.getByRole('button', { name: 'none', exact: true }).click();
  await expect(page).not.toHaveURL(/group=/);
});
