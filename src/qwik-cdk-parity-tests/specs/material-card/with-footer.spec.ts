import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-footer — <mat-card-footer> renders with expected class', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-card/with-footer/`);
  await page.waitForSelector('[data-scenario-ready]');

  const footer = page.locator('mat-card-footer');
  await expect(footer).toBeVisible();
  await expect(footer).toHaveClass(/mat-mdc-card-footer/);
  await expect(footer).toHaveText('Footer text');
});
