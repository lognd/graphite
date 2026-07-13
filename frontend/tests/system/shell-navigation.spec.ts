// Shell navigation journey (WO-G2 deliverable 6): the app shell's core
// keyboard-first flows -- nav links, command palette, shortcut sheet.

import { test, expect } from '@playwright/test';

test('navigates between the top-level routes via the left nav', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'primary' })).toBeVisible();

  await page.getByRole('link', { name: 'obligations' }).click();
  await expect(page).toHaveURL(/\/obligations$/);

  await page.getByRole('link', { name: 'artifacts' }).click();
  await expect(page).toHaveURL(/\/artifacts$/);

  await page.getByRole('link', { name: 'dashboard' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('opens the command palette with ctrl+k and navigates via a command', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog', { name: 'command palette' })).toBeVisible();

  await page.getByLabel('command palette search').fill('obligations');
  await page.getByText('go to obligations').click();
  await expect(page).toHaveURL(/\/obligations$/);
});

test('opens the shortcut sheet with ?', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'keyboard shortcuts' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'keyboard shortcuts' })).not.toBeVisible();
});
