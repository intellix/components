import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-toolbar/color-warn — <mat-toolbar> with mat-warn class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-toolbar/color-warn/`);
  await page.waitForSelector('[data-scenario-ready]');
  const toolbar = page.locator('mat-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveClass(/mat-warn/);
});
