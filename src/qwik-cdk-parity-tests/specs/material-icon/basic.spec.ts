import {test, expect} from '@playwright/test';

// Overridable so this spec can target a per-worktree Qwik preview port, same
// convention as lib/material-parity.ts's QWIK_URL.
const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-icon/basic — mat-icon custom-element with .mat-icon .notranslate .mat-icon-no-color classes, role=img, aria-hidden=true, data-mat-icon-type=font, Slot ligature text', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/mat-icon(\s|$)/);
  await expect(icon).toHaveClass(/notranslate/);
  await expect(icon).toHaveClass(/mat-icon-no-color/);
  await expect(icon).toHaveAttribute('role', 'img');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toContainText('home');

  // Ligature-text mode: the registry-style default font-set class (configured
  // by the mat-icon routes layout) applies, but no `fontIcon` prop means no
  // fontIcon-derived class and no `data-mat-icon-name` attribute.
  await expect(icon).toHaveClass(/material-symbols-outlined/);
  await expect(icon).not.toHaveAttribute('data-mat-icon-name', /./);
  await expect(icon).not.toHaveAttribute('fontIcon', /./);
});
