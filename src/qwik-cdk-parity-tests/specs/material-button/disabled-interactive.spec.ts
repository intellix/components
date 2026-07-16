import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/disabled-interactive — aria-disabled=true, native NOT disabled', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/disabled-interactive/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).not.toBeDisabled();
  await expect(btn).toHaveAttribute('aria-disabled', 'true');
  await expect(btn).toHaveClass(/mat-mdc-button-disabled-interactive/);
});
