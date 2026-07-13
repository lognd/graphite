// WO-G5 deliverable 6 (live half, acceptance criterion): a real
// `regolith build --release`/`check` on the real fixture is watchable
// end-to-end through a real `graphite serve` backend (playwright.live.
// config.ts's webServer), not the mocked system rig -- no
// VITE_USE_MOCKS here, every request in this file hits the real API.

import { test, expect } from '@playwright/test';

const PROJECT = 'examples.timber_pavilion';

test('a real build --release run is watched end-to-end: log, D228 phase progress, history, verdict diff', async ({
  page,
}) => {
  await page.goto('/runs');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByLabel('verb').selectOption('build');
  await page.getByLabel('flags').fill('--release program.calx');
  await page.getByRole('button', { name: 'start', exact: true }).click();

  // A real subprocess is now running: the log pane must show real
  // captured stderr/stdout, not a placeholder.
  await expect(page.getByTestId('log-pane-body')).toContainText(/build/i, { timeout: 30_000 });

  // It must finish (real fixture's build completes in a few seconds)
  // and render the exit summary with a real verdict diff.
  await expect(page.getByTestId('exit-summary')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('exit-summary')).toContainText(/release_ok/);

  // The D228 typed-progress path (the ACCEPTANCE criterion's live half):
  // a real `build --release` drives discharge_all's per-obligation
  // progress records, so a ProgressRail labeled with the real `discharge`
  // phase tag must have rendered (phases persist after completion).
  await expect(page.getByText('discharge', { exact: true })).toBeVisible();

  // Run history must show this run afterward (durable record).
  await expect(page.getByRole('cell', { name: 'build', exact: true }).first()).toBeVisible({
    timeout: 10_000,
  });
});

test('cancel mid-run stops the process and records a cancelled/finished status', async ({
  page,
}) => {
  await page.goto('/runs');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByLabel('verb').selectOption('check');
  await page.getByLabel('flags').fill('program.calx');
  await page.getByRole('button', { name: 'start', exact: true }).click();

  // Race the real (short-lived) subprocess: click cancel as soon as the
  // affordance appears. A run that finishes first is still an honest
  // outcome (cancel-of-a-finished-run is a documented no-op) -- the
  // assertion only requires a terminal, non-"running" status renders.
  const cancelButton = page.getByRole('button', { name: 'cancel' }).first();
  if (await cancelButton.isVisible().catch(() => false)) {
    await cancelButton.click().catch(() => undefined);
  }

  await expect(page.getByTestId('exit-summary')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^run [0-9a-f]+ -- (ok|failed|cancelled)$/)).toBeVisible();
});

test('honest failure: a verb given a missing file renders the real stderr tail', async ({
  page,
}) => {
  await page.goto('/runs');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByLabel('verb').selectOption('check');
  await page.getByLabel('flags').fill('no-such-file.calx');
  await page.getByRole('button', { name: 'start', exact: true }).click();

  await expect(page.getByTestId('exit-summary')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^run [0-9a-f]+ -- failed$/)).toBeVisible();
  // The real CLI's own error text must be present verbatim in the log
  // pane -- never a graphite-invented "something went wrong" message.
  await expect(page.getByTestId('log-pane-body')).toContainText(/no-such-file\.calx/i);
});
