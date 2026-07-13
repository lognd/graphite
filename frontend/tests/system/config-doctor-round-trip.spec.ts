// Config/doctor real-backend journeys (WO-G6 deliverable 5): unlike every
// other system spec (which runs against VITE_USE_MOCKS=1 static fixtures),
// these drive a REAL `graphite serve` + REAL `regolith` CLI subprocess
// over a throwaway copy of the fixture project (playwright.config.ts's
// third webServer pair) so the round-trip is genuinely verified outside
// the UI too -- via a separate CLI subprocess call in the test itself,
// per the WO's acceptance criterion, not just re-reading the same API.

import { execFileSync } from 'node:child_process';
import { test, expect } from '@playwright/test';

// Every step here shells out to the real `regolith` CLI (subprocess
// startup, not an in-memory mock) at least once, sometimes twice
// (config_cli.set_config re-reads via `config where` after `config
// set`) -- default 5s expect timeouts are too tight for that, so this
// whole spec runs with a longer one.
test.use({ baseURL: 'http://127.0.0.1:5175' });
test.setTimeout(60000);

const FIXTURE_PROJECT_ROOT = '/tmp/graphite-pw-fixture/timber_pavilion';
const PROJECT_NAME = 'examples.timber_pavilion';

function cliConfigWhere(key: string): string {
  return execFileSync(
    'uv',
    [
      'run',
      'python',
      '-m',
      'regolith.cli',
      '--color',
      'never',
      'config',
      'where',
      key,
      '--project',
      FIXTURE_PROJECT_ROOT,
    ],
    { cwd: '..', encoding: 'utf-8' },
  ).trim();
}

test('config edit round-trips through the real CLI and resets to default', async ({ page }) => {
  // Sanity: the fixture starts at the registered default (WO-G6 ledger).
  expect(cliConfigWhere('ui.port')).toBe('ui.port=8765 (source=default)');

  await page.goto('/config');
  await page.getByLabel('project').selectOption(PROJECT_NAME);

  const field = page.locator('.gr-config-field').filter({ hasText: 'ui.port' });
  await expect(field).toBeVisible();
  await expect(field.locator('.gr-config-field__source')).toHaveText('default');

  const input = field.locator('input[type="text"]');
  await input.fill('9999');
  await field.getByRole('button', { name: 'save' }).click();

  // The UI's own re-fetch shows the new value + the new source...
  await expect(field.locator('input[type="text"]')).toHaveValue('9999');
  await expect(field.locator('.gr-config-field__source')).toHaveText('project');
  // ...and a SEPARATE CLI subprocess invocation (not the API the UI just
  // called) independently confirms the write landed for real.
  await expect.poll(() => cliConfigWhere('ui.port')).toBe('ui.port=9999 (source=project)');

  // Reset to default -- the WO-G1 ledger's "no dedicated CLI reset verb,
  // set to the recorded default covers it" affordance.
  await field.getByRole('button', { name: 'reset to default' }).click();
  await expect(field.locator('input[type="text"]')).toHaveValue('8765');
  await expect.poll(() => cliConfigWhere('ui.port')).toBe('ui.port=8765 (source=project)');
});

test('a rejected config write renders the real CLI error message', async ({ page }) => {
  await page.goto('/config');
  await page.getByLabel('project').selectOption(PROJECT_NAME);

  const field = page.locator('.gr-config-field').filter({ hasText: 'optimize.seed' });
  const input = field.locator('input[type="text"]');
  await input.fill('not-an-int');
  await field.getByRole('button', { name: 'save' }).click();

  await expect(field.getByRole('alert')).toContainText(/not an int/);
});

test('doctor view re-probes the real regolith doctor for the fixture project', async ({ page }) => {
  await page.goto('/doctor');
  await page.getByLabel('project').selectOption(PROJECT_NAME);

  // At least one row from the real regolith.toolenv catalog renders.
  await expect(page.getByRole('cell', { name: 'kicad-cli', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 're-probe' }).click();
  await expect(page.getByRole('cell', { name: 'kicad-cli', exact: true })).toBeVisible();
});
