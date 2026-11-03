import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

// Task 2 (open-ended button `color`): upstream types the real `color` Input
// `string | null` (src/material/button/button-base.ts:96), not just the
// 'primary'/'accent'/'warn' ThemePalette — any app-defined palette name is
// valid and rendered as `mat-${color}`. See `MatButtonProps.color`'s doc
// comment in mat-button.tsx and src/qwik-material/core/open-string.ts.
test('material-button/color-custom — mat-accent-outline class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/color-custom/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toHaveClass(/mat-accent-outline/);
});
