import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/basic — mat-icon custom-element with .mat-icon .notranslate .mat-icon-no-color classes, role=img, aria-hidden=true, data-mat-icon-type=font, Slot ligature text', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveClass(/mat-icon(\s|$)/);
  await expect(icon).toHaveClass(/notranslate/);
  await expect(icon).toHaveClass(/mat-icon-no-color/);
  await expect(icon).toHaveAttribute('role', 'img');
  await expect(icon).toHaveAttribute('aria-hidden', 'true');
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'font');
  await expect(icon).toContainText('home');
});
