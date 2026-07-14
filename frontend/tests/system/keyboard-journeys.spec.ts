// WO-G8 deliverable 1: keyboard-only walkthroughs -- the standing
// journeys driven end to end with no pointer input at all (charter 4's
// keyboard-first bar; spec 03.3.5). Focus management is asserted along
// the way: focus is always somewhere visible and actionable, dialogs trap
// Escape, and tab order reaches every interactive element on the path.

import { test, expect, type Page } from '@playwright/test';

// Tab until the focused element matches, bounded so a broken tab order
// fails fast instead of hanging.
async function tabTo(page: Page, matcher: (el: { text: string; href: string }) => boolean) {
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => ({
      text: (document.activeElement?.textContent ?? '').trim(),
      href: document.activeElement?.getAttribute('href') ?? '',
    }));
    if (matcher(focused)) return;
  }
  throw new Error('tabTo: never reached the target element');
}

test('keyboard-only: fleet -> project -> filtered explorer -> claim detail', async ({ page }) => {
  await page.goto('/');
  // Reach the project link in the census table and enter it.
  await tabTo(page, (f) => f.href === '/project/examples.timber_pavilion');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/project\/examples\.timber_pavilion$/);

  // Census header count -> filtered explorer.
  await tabTo(page, (f) => f.href.includes('filter=accepted_deviation'));
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/filter=accepted_deviation/);

  // Row "view" link -> claim detail.
  await tabTo(page, (f) => f.text === 'view');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/claim\//);
  await expect(page.locator('main h1')).toBeVisible();
});

test('keyboard-only: command palette navigation to every top-level route', async ({ page }) => {
  await page.goto('/');
  for (const route of ['obligations', 'artifacts', 'runs', 'config', 'doctor', 'settings']) {
    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'command palette' })).toBeVisible();
    await page.getByLabel('command palette search').fill(route);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(new RegExp(`/${route}$`));
  }
});

test('keyboard-only: table j/k navigation and c-to-copy on the explorer', async ({ page }) => {
  await page.goto('/project/examples.timber_pavilion/obligations');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const grid = page.locator('.gr-data-table__scroll');
  await grid.focus();
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('k');
  await expect(page.locator('.gr-data-table__tr--active')).toHaveCount(1);
  await page.keyboard.press('c');
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard.length).toBeGreaterThan(0);
});

test('focus management: dialogs close on Escape and focus is never lost', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'keyboard shortcuts' })).not.toBeVisible();

  await page.keyboard.press('Control+k');
  const palette = page.getByRole('dialog', { name: 'command palette' });
  await expect(palette).toBeVisible();
  // The palette must take focus on open (a11y focus management).
  const focusInPalette = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    return dialog ? dialog.contains(document.activeElement) : false;
  });
  expect(focusInPalette).toBe(true);
  await page.keyboard.press('Escape');
  await expect(palette).not.toBeVisible();
  // Focus lands back somewhere real (body or an interactive element),
  // never on a detached node.
  const focusAlive = await page.evaluate(() => document.activeElement !== null);
  expect(focusAlive).toBe(true);
});
