import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/fab — <button> with mdc-fab + mat-accent default', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/fab/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab/);
  await expect(btn).toHaveClass(/mat-mdc-fab/);
  await expect(btn).toHaveClass(/mat-accent/);
  await expect(btn).not.toHaveClass(/mdc-fab--extended/);
});
