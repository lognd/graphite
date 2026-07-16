// Scan-trace studio: real-backend upload journey (WO-G11 acceptance
// criterion: "A scan uploads, is stored under traced/scans/, and its
// blake3 hash is returned and displayed"). Runs against the REAL
// `graphite serve` + real `graphite.service.scan_upload` write
// (playwright.config.ts's real-backend webServer pair), not the
// VITE_USE_MOCKS static fixtures -- the same reasoning
// config-doctor-round-trip.spec.ts gives for its own real rig: a
// filesystem write deserves a real filesystem check, not a mock
// re-read of itself.

import { readFileSync, existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://127.0.0.1:5175' });
test.setTimeout(30000);

const PROJECT_NAME = 'examples.timber_pavilion';
const FIXTURE_PROJECT_ROOT = '/tmp/graphite-pw-fixture/timber_pavilion';

test('uploading a scan stores it under traced/scans/ and shows its blake3 hash', async ({
  page,
}) => {
  await page.goto(`/project/${encodeURIComponent(PROJECT_NAME)}/studio`);
  await expect(page.getByTestId('studio-step')).toHaveText('step: upload');

  const fileInput = page.getByLabel('upload scan image');
  await fileInput.setInputFiles({
    name: 'gasket_top.png',
    mimeType: 'image/png',
    buffer: Buffer.from('not-a-real-png-but-fine-for-storage-test'),
  });

  const hashLine = page.getByTestId('scan-hash');
  await expect(hashLine).toBeVisible();
  await expect(hashLine).toContainText('traced/scans/gasket_top.png');

  const hashChip = hashLine.locator('.gr-hash-chip__value');
  const shortHash = await hashChip.textContent();
  expect(shortHash).toBeTruthy();
  await hashChip.click();
  const fullHash = await hashChip.textContent();
  expect(fullHash).toMatch(/^blake3:[0-9a-f]{64}$/);

  const storedPath = `${FIXTURE_PROJECT_ROOT}/traced/scans/gasket_top.png`;
  expect(existsSync(storedPath)).toBe(true);
  expect(readFileSync(storedPath, 'utf-8')).toBe('not-a-real-png-but-fine-for-storage-test');

  await expect(page.getByTestId('studio-step')).toHaveText('step: calibrate-points');
});
