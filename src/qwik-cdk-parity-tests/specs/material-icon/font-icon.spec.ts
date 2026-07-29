import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/font-icon — mat-icon with data-mat-icon-name=home + fontIcon attribute (no ligature slot text)', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/font-icon/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toHaveAttribute('data-mat-icon-name', 'home');
  await expect(icon).toHaveAttribute('fontIcon', 'home');
});
