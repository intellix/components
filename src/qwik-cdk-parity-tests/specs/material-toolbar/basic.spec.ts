import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/basic — <mat-toolbar> with mat-toolbar + single-row class', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/basic/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-toolbar(\s|$)/);
  await expect(toolbar).toHaveClass(/mat-toolbar-single-row/);
  await expect(toolbar).not.toHaveClass(/mat-toolbar-multiple-rows/);
  await expect(toolbar).toHaveText('My Application');
});
