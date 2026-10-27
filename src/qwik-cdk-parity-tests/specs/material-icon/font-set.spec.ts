import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/font-set — mat-icon carries the material-symbols-outlined class + fontIcon attribute + data-mat-icon-namespace', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/font-set/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/material-symbols-outlined/);
  await expect(icon).toHaveAttribute('fontIcon', 'home');
  await expect(icon).toHaveAttribute('data-mat-icon-namespace', 'material-symbols-outlined');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
});
