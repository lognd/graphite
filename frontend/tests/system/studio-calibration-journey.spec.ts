// Scan-trace studio: calibration + grid-capture + export-gate journey
// (WO-G11 acceptance criteria). Runs against the mocked production
// bundle (VITE_USE_MOCKS=1) since calibration/grid math is entirely
// client-side -- the scan-upload-to-real-storage assertion lives in
// studio-scan-upload.spec.ts's real-backend rig instead.

import { test, expect } from '@playwright/test';

const PROJECT_NAME = 'examples.timber_pavilion';

async function uploadMockScan(page: import('@playwright/test').Page) {
  await page.goto(`/project/${encodeURIComponent(PROJECT_NAME)}/studio`);
  await page.getByLabel('upload scan image').setInputFiles({
    name: 'gasket_top.png',
    mimeType: 'image/png',
    buffer: Buffer.from('mock-scan-bytes'),
  });
  await expect(page.getByTestId('scan-hash')).toBeVisible();
}

/** Places the two default rung-A reference points at distinct image
 * positions (the "place" svg targets, WO-G11 deliverable 3) and fills
 * their object-plane mm coordinates -- a non-degenerate 2-point
 * similarity fit. */
async function placeTwoReferencePoints(
  page: import('@playwright/test').Page,
  objectXY: [[string, string], [string, string]] = [
    ['0', '0'],
    ['50', '0'],
  ],
) {
  await page.getByLabel('place reference point 1').click({ position: { x: 2, y: 2 } });
  await page.getByLabel('place reference point 2').click({ position: { x: 20, y: 20 } });
  await page.getByLabel('object x for point 1').fill(objectXY[0][0]);
  await page.getByLabel('object y for point 1').fill(objectXY[0][1]);
  await page.getByLabel('object x for point 2').fill(objectXY[1][0]);
  await page.getByLabel('object y for point 2').fill(objectXY[1][1]);
}

test('rung A (scale) fit shows a transform + residual, and export starts disabled', async ({
  page,
}) => {
  await uploadMockScan(page);

  // Export is refused before calibration.
  await expect(page.getByTestId('export-button')).toBeDisabled();
  await expect(page.getByTestId('export-refused-reason')).toBeVisible();

  await placeTwoReferencePoints(page);
  await page.getByRole('button', { name: 'fit calibration' }).click();

  await expect(page.getByTestId('calibration-result')).toBeVisible();
  await expect(page.getByTestId('residual-rms')).toContainText('residual rms:');
  await expect(page.getByTestId('residual-max')).toContainText('residual max:');
  await expect(page.getByTestId('studio-step')).toHaveText('step: grid-capture');
});

test('capture_kind=photo with rung A (scale) surfaces the honesty diagnostic', async ({ page }) => {
  await page.goto(`/project/${encodeURIComponent(PROJECT_NAME)}/studio`);
  // capture_kind is declared at import time (D261 ruling 4: the UI
  // must ask, never assume) -- select it before uploading.
  await page.getByLabel('capture kind').selectOption('photo');
  await page.getByLabel('upload scan image').setInputFiles({
    name: 'gasket_top.png',
    mimeType: 'image/png',
    buffer: Buffer.from('mock-scan-bytes'),
  });
  await expect(page.getByTestId('scan-hash')).toBeVisible();
  await placeTwoReferencePoints(page);
  await page.getByRole('button', { name: 'fit calibration' }).click();

  await expect(page.getByTestId('diagnostic-photo_uncorrected_scale')).toBeVisible();
  // The diagnostic keeps export disabled even though calibration exists.
  await page.getByLabel('pitch basis').selectOption('measured');
  await expect(page.getByTestId('export-button')).toBeDisabled();
});

test('a declared accuracy_bound_mm tighter than the fitted residual is flagged', async ({
  page,
}) => {
  await uploadMockScan(page);
  await placeTwoReferencePoints(page, [
    ['0', '0'],
    ['50', '0.001'],
  ]);
  await page.getByRole('button', { name: 'fit calibration' }).click();
  await expect(page.getByTestId('calibration-result')).toBeVisible();

  await page.getByLabel('declared accuracy bound mm').fill('0');
  await expect(page.getByTestId('diagnostic-accuracy_bound_tighter_than_residual')).toBeVisible();
});

test('grid capture: 4 corners + pitch/count project intersections, drag-and-confirm updates the set', async ({
  page,
}) => {
  await uploadMockScan(page);
  await placeTwoReferencePoints(page);
  await page.getByRole('button', { name: 'fit calibration' }).click();
  await expect(page.getByTestId('calibration-result')).toBeVisible();
  await page.getByLabel('pitch basis').selectOption('measured');

  const gridSvg = page.getByRole('img', { name: 'grid corner placement surface' });
  // Click the 4 corners (top-left, top-right, bottom-right, bottom-left).
  await gridSvg.click({ position: { x: 50, y: 50 } });
  await gridSvg.click({ position: { x: 300, y: 50 } });
  await gridSvg.click({ position: { x: 300, y: 250 } });
  await gridSvg.click({ position: { x: 50, y: 250 } });

  await page.getByLabel('grid pitch mm').fill('10');
  await page.getByLabel('grid count u').fill('3');
  await page.getByLabel('grid count v').fill('3');
  await page.getByRole('button', { name: 'project grid intersections' }).click();

  await expect(page.getByTestId('grid-point-0-0')).toBeVisible();
  await expect(page.getByTestId('grid-point-2-2')).toBeVisible();
  await expect(page.getByTestId('grid-confirm-state')).toHaveText('0/9 confirmed');

  // Confirm one point in place (single click, no drag).
  await page.getByTestId('grid-point-1-1').click();
  await expect(page.getByTestId('grid-confirm-state')).toHaveText('1/9 confirmed');

  // Drag-correct another: double-click arms drag mode, then click the
  // new position to confirm the corrected placement.
  await page.getByTestId('grid-point-0-1').dblclick();
  await gridSvg.click({ position: { x: 60, y: 150 } });
  await expect(page.getByTestId('grid-confirm-state')).toHaveText('2/9 confirmed');

  await expect(page.getByTestId('studio-step')).toHaveText('step: ready');
});

test('export enables once calibration, pitch_basis, and diagnostics all clear', async ({
  page,
}) => {
  await uploadMockScan(page);
  await placeTwoReferencePoints(page);
  await page.getByRole('button', { name: 'fit calibration' }).click();
  await expect(page.getByTestId('calibration-result')).toBeVisible();

  await expect(page.getByTestId('export-button')).toBeDisabled();
  await page.getByLabel('pitch basis').selectOption('measured');
  await expect(page.getByTestId('export-button')).toBeEnabled();
});
