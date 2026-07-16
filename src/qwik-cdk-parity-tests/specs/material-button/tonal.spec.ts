import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/tonal — renders with mat-tonal-button', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/tonal/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mat-tonal-button/);
});
