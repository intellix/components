import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/icon-button — <button> with mdc-icon-button + mat-mdc-icon-button', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/icon-button/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-icon-button/);
  await expect(btn).toHaveClass(/mat-mdc-icon-button/);
  await expect(btn).toHaveAttribute('aria-label', 'Menu');
  // Icon button does NOT wrap children in .mdc-button__label
  await expect(page.locator('.mdc-button__label')).toHaveCount(0);
});
