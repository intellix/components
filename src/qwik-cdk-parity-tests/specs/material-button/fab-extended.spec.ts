import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/fab-extended — mdc-fab--extended + mat-mdc-extended-fab', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/fab-extended/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab--extended/);
  await expect(btn).toHaveClass(/mat-mdc-extended-fab/);
});
