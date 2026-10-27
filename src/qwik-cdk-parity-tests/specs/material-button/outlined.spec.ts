import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button/outlined — renders with mdc-button--outlined + mat-mdc-outlined-button', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/outlined/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--outlined/);
  await expect(btn).toHaveClass(/mat-mdc-outlined-button/);
});
