import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/basic — renders <mat-card> custom-element tag + expected classes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-card/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  // Tag-name assertion (CMS parity — regression to <div> fails here)
  const card = page.locator('mat-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveClass(/mat-mdc-card(\s|$)/);
  await expect(card).toHaveClass(/mdc-card(\s|$)/);

  // Child components render with correct custom tags
  await expect(page.locator('mat-card-title')).toHaveText('Basic card');
  await expect(page.locator('mat-card-subtitle')).toHaveText(/Raised appearance/);
  await expect(page.locator('mat-card-content')).toBeVisible();
});
