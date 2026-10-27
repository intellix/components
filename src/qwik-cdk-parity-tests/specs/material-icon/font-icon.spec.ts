import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/font-icon — mat-icon with data-mat-icon-name=home + fontIcon attribute (no ligature slot text), plus the default font-set class and the fontIcon-derived .home class (non-ligature font)', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/font-icon/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'home');
  await expect(icon).toHaveAttribute('fontIcon', 'home');
  // No explicit `fontSet` prop here — this is the registry-style default the
  // mat-icon routes layout configures (mirroring the Angular dev-app's
  // MatIconRegistry.setDefaultFontSetClass('material-symbols-outlined')).
  await expect(icon).toHaveClass(/material-symbols-outlined/);
  // _updateFontIconClasses (src/material/icon/icon.ts): since the resolved
  // font-set isn't a ligature font, `fontIcon` is also added as a class.
  await expect(icon).toHaveClass(/(^|\s)home(\s|$)/);
  await expect(icon).not.toHaveClass(/mat-ligature-font/);
});
