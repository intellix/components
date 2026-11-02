import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button/filled — renders with mdc-button--unelevated + mat-mdc-unelevated-button', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/filled/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-button--unelevated/);
  await expect(btn).toHaveClass(/mat-mdc-unelevated-button/);
});
