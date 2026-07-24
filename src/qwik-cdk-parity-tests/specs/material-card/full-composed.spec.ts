import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/full-composed — every card sub-component renders with its custom tag', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-card/full-composed/`);
  await page.waitForSelector('[data-scenario-ready]');

  // All the expected custom-element tags exist inside the card
  await expect(page.locator('mat-card')).toBeVisible();
  await expect(page.locator('mat-card-header')).toBeVisible();
  await expect(page.locator('mat-card-title')).toHaveText('Full composed card');
  await expect(page.locator('mat-card-subtitle')).toBeVisible();
  await expect(page.locator('mat-card-content')).toBeVisible();
  await expect(page.locator('mat-card-actions')).toHaveClass(/mat-mdc-card-actions-align-end/);
  await expect(page.locator('img.mat-mdc-card-avatar')).toBeVisible();
  await expect(page.locator('img.mat-mdc-card-image')).toBeVisible();
});
