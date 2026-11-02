import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/inline — mat-icon with .mat-icon-inline class alongside the base .mat-icon class', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/inline/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/mat-icon(\s|$)/);
  await expect(icon).toHaveClass(/mat-icon-inline/);
});
