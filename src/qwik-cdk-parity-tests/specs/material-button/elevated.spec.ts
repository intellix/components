import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/elevated — renders with mdc-button--raised + mat-mdc-raised-button', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/elevated/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--raised/);
  await expect(btn).toHaveClass(/mat-mdc-raised-button/);
});
