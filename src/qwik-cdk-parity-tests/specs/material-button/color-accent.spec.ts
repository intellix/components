import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/color-accent — mat-accent class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/color-accent/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toHaveClass(/mat-accent/);
});
