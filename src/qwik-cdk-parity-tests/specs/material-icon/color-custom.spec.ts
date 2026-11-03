import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

// Task 2 (open-ended color): upstream types the real `color` setter
// `string | null | undefined` (src/material/icon/icon.ts:168), not just the
// 'primary'/'accent'/'warn' ThemePalette — any app-defined palette name is
// valid and rendered as `mat-${color}`. See `MatIconProps.color`'s doc
// comment in mat-icon.tsx and src/qwik-material/core/open-string.ts.
test('material-icon/color-custom — mat-brand-highlight class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-icon/color-custom/`);
  await page.waitForSelector('[data-scenario-ready]');
  const icon = page.locator('mat-icon');
  await expect(icon).toHaveClass(/mat-brand-highlight/);
  // Not one of the three M2 palette names, so `.mat-icon-no-color` (applied
  // whenever `color !== 'primary' && color !== 'accent' && color !== 'warn'`
  // per icon.ts's host binding) must still be set.
  await expect(icon).toHaveClass(/mat-icon-no-color/);
});
