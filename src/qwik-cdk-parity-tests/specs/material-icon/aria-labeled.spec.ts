import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/aria-labeled — consumer-overridden aria-hidden=false + aria-label present + role=img', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('role', 'img');
  await expect(icon).toHaveAttribute('aria-hidden', 'false');
  await expect(icon).toHaveAttribute('aria-label', 'Home');
});
