import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/outlined — <mat-card> with outlined classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/outlined/`);
  await page.waitForSelector('[data-scenario-ready]');

  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card-outlined/);
  await expect(card).toHaveClass(/mdc-card--outlined/);
});
