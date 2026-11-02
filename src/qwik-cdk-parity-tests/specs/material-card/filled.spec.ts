import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/filled — <mat-card> with filled classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/filled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card-filled/);
  await expect(card).toHaveClass(/mdc-card--filled/);
});
