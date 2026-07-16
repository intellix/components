import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/text — renders <button> with mat-mdc-button class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/text/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mat-mdc-button(\s|$)/);
  await expect(btn).toHaveText('Text button');
});
