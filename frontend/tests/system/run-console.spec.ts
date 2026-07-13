// WO-G5 run console, mocked half (VITE_USE_MOCKS=1, no backend): the
// run form renders with config-aware defaults, run history lists the
// recorded fixture rows, and detail replay shows the captured stream +
// verdict diff. The live subprocess/SSE/cancel journeys live in
// tests/system-live (playwright.live.config.ts) against a real backend
// -- mock mode cannot spawn a real CLI, and pretending it can would
// violate the honesty posture.

import { test, expect } from '@playwright/test';

test('run form renders verbs, projects, and the run history table', async ({ page }) => {
  await page.goto('/runs');

  await expect(page.getByLabel('project')).toBeVisible();
  await expect(page.getByLabel('verb')).toBeVisible();
  await expect(page.getByLabel('flags')).toBeVisible();
  await expect(page.getByRole('button', { name: 'start', exact: true })).toBeEnabled();

  // History shows both recorded mock rows with status/verb/duration.
  await expect(page.getByRole('cell', { name: 'check', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'build', exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'failed', exact: true })).toBeVisible();
});

test('history detail replays the captured stream and the verdict diff', async ({ page }) => {
  await page.goto('/runs');

  await page.getByRole('button', { name: 'detail' }).first().click();
  const replay = page.getByLabel('run detail replay');
  await expect(replay).toBeVisible();
  // The captured stream is the real recorded log tail, including a
  // verbatim D228 progress line.
  await expect(replay.getByTestId('log-pane-body')).toContainText('progress v=1');
  await expect(replay.getByText(/release_ok: false -> true/)).toBeVisible();
  await replay.getByRole('button', { name: 'close' }).click();
  await expect(replay).not.toBeVisible();
});
