import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/disabled — <button disabled> with mat-mdc-button-disabled class', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/disabled/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toBeDisabled();
  await expect(btn).toHaveClass(/mat-mdc-button-disabled/);
});
