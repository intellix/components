import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/multiple-rows — <mat-toolbar-multiple-rows> with 2 <mat-toolbar-row> children', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/multiple-rows/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-toolbar-multiple-rows/);
  await expect(toolbar).not.toHaveClass(/mat-toolbar-single-row/);

  const rows = page.locator('mat-toolbar mat-toolbar-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toHaveClass(/mat-toolbar-row/);
  await expect(rows.nth(0)).toHaveText('First row');
  await expect(rows.nth(1)).toHaveText('Second row');
});
