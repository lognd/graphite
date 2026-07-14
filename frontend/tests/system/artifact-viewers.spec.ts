// WO-G4 deliverable 6: opens each artifact family from the artifacts hub
// (project select -> family link) and asserts real content renders, using
// the committed mock fixtures (VITE_USE_MOCKS=1, recorded from
// tests/fixtures/timber_pavilion). Also re-confirms the charter 3.1
// zero-external-request rig holds with every viewer mounted (fonts/3D/
// wasm all local, spec 02.6/02.7).

import { test, expect } from '@playwright/test';

const PROJECT = 'examples.timber_pavilion';

async function openFamily(page: import('@playwright/test').Page, familyLabel: string) {
  await page.goto('/artifacts');
  await page.getByLabel('project').selectOption(PROJECT);
  await page.getByRole('link', { name: new RegExp(familyLabel) }).click();
}

test('calc book: audit index renders with the zero-unexplained summary', async ({ page }) => {
  await openFamily(page, 'Calc');
  await expect(page.getByTestId('audit-summary')).toBeVisible();
  await expect(page.getByText('Audit index')).toBeVisible();
  await expect(page.getByRole('cell', { name: 'bearing', exact: true })).toBeVisible();
});

test('calc sheet: opening a sheet shows model/claim/evidence chain', async ({ page }) => {
  await openFamily(page, 'Calc');
  await page.getByRole('link', { name: 'open sheet' }).first().click();
  await expect(page.getByText('Evidence chain')).toBeVisible();
  await expect(page.getByText('Inputs')).toBeVisible();
});

test('drawings: SVG sheet family renders an honest empty/list state', async ({ page }) => {
  await openFamily(page, 'Drawings');
  // Mock artifact listing carries a PavilionFrame SVG relpath -- the list
  // view must surface it as a link.
  await expect(page.getByRole('link', { name: 'PavilionFrame' })).toBeVisible();
});

test('3D model: honest empty state when no GLB is shipped (mock fixture is civil)', async ({
  page,
}) => {
  await openFamily(page, '3d');
  await expect(page.getByText(/No GLB shipped for this project/)).toBeVisible();
});

test('BOM/cost/schedule: renders frame lock rows and cost estimates verbatim', async ({ page }) => {
  await openFamily(page, 'Bom');
  await expect(page.getByText('PavilionFrame.G1.section')).toBeVisible();
  await expect(page.getByText('all/construction')).toBeVisible();
});

test('boards: honest unrouted/absent states when the fixture ships no board/HDL products', async ({
  page,
}) => {
  await openFamily(page, 'Boards');
  await expect(page.getByText(/No gerber layers shipped/)).toBeVisible();
  await expect(page.getByText(/No firmware\/HDL products shipped/)).toBeVisible();
});

// WO-G9: the mainboard_mx mock project ships real boards + harness
// families (lithos F145's two previously-invisible families). Navigated
// directly by URL rather than through the project picker -- it is a
// mock-only fixture project, not part of the fleet dashboard's project
// list (adding it there would perturb fleet-count assertions elsewhere).
test('boards (mainboard_mx): gerber stack renders with the silkscreen layer toggled on by default', async ({
  page,
}) => {
  await page.goto('/artifacts/mainboard_mx/boards');
  await expect(page.getByText('F.Silkscreen')).toBeVisible();
  await expect(page.getByText('Edge.Cuts')).toBeVisible();
  const silkscreenToggle = page.getByLabel(/F\.Silkscreen/);
  await expect(silkscreenToggle).toBeChecked();
});

test('harness: tap map, expected signals with an honest recorded absence, and bringup.md all render', async ({
  page,
}) => {
  await page.goto('/artifacts/mainboard_mx/harness');
  await expect(page.getByRole('cell', { name: 'CH0', exact: true }).first()).toBeVisible();
  await expect(page.getByText('mainboard_mx bring-up')).toBeVisible();
  await expect(page.getByText(/no expected-signal record was authored/)).toBeVisible();
});

test('a family the hub has never been taught about (harness) is reachable from the hub tile', async ({
  page,
}) => {
  await page.goto('/artifacts?project=mainboard_mx');
  await page.getByRole('link', { name: /Harness/ }).click();
  await expect(page.getByText('mainboard_mx bring-up')).toBeVisible();
});

test('zero-external-request holds with every artifact viewer mounted', async ({ page }) => {
  const offenders: string[] = [];
  page.on('request', (request) => {
    const host = new URL(request.url()).hostname;
    if (host !== '127.0.0.1' && host !== 'localhost') {
      offenders.push(request.url());
    }
  });

  await openFamily(page, 'Calc');
  await page.getByRole('link', { name: 'open sheet' }).first().click();
  await page.goto('/artifacts');
  await openFamily(page, 'Drawings');
  await page.goto('/artifacts');
  await openFamily(page, '3d');
  await page.goto('/artifacts');
  await openFamily(page, 'Bom');
  await page.goto('/artifacts');
  await openFamily(page, 'Boards');

  expect(offenders, `non-localhost requests: ${offenders.join(', ')}`).toEqual([]);
});

test('calc sheet: prev/next walks the calc book order (WO-G8, closes the WO-G4 deferral)', async ({
  page,
}) => {
  await openFamily(page, 'Calc');
  await page.getByRole('link', { name: 'open sheet' }).first().click();
  await expect(page.getByText('1 / 6')).toBeVisible();
  // First sheet: prev disabled, next live.
  await expect(page.locator('.gr-detail-nav [aria-disabled="true"]')).toHaveText('< prev');
  await page.getByRole('link', { name: 'next >' }).click();
  await expect(page.getByText('2 / 6')).toBeVisible();
  await page.getByRole('link', { name: '< prev' }).click();
  await expect(page.getByText('1 / 6')).toBeVisible();
});
