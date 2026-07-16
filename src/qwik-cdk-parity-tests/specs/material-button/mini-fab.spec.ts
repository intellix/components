import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button/mini-fab — <button> with mdc-fab--mini + mat-mdc-mini-fab', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/mini-fab/`);
  await page.waitForSelector('[data-scenario-ready]');
  const btn = page.locator('button.mat-mdc-button-base');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveClass(/mdc-fab/);
  await expect(btn).toHaveClass(/mdc-fab--mini/);
  await expect(btn).toHaveClass(/mat-mdc-mini-fab/);
  // Mini-FAB should NOT carry the regular FAB class
  await expect(btn).not.toHaveClass(/mat-mdc-fab(\s|$)/);
});
