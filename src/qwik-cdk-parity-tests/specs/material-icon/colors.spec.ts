import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/colors — 3 mat-icon nodes with distinct .mat-{primary,accent,warn} classes and no .mat-icon-no-color', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icons = page.locator('mat-icon');
  await expect(icons).toHaveCount(3);

  await expect(icons.nth(0)).toHaveClass(/mat-primary/);
  await expect(icons.nth(0)).not.toHaveClass(/mat-icon-no-color/);

  await expect(icons.nth(1)).toHaveClass(/mat-accent/);
  await expect(icons.nth(1)).not.toHaveClass(/mat-icon-no-color/);

  await expect(icons.nth(2)).toHaveClass(/mat-warn/);
  await expect(icons.nth(2)).not.toHaveClass(/mat-icon-no-color/);
});
