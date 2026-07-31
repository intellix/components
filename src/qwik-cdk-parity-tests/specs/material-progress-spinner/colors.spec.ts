import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/colors — 3 spinners with distinct .mat-{primary,accent,warn} classes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinners = page.locator('mat-progress-spinner');
  await expect(spinners).toHaveCount(3);

  await expect(spinners.nth(0)).toHaveClass(/mat-primary/);
  await expect(spinners.nth(0)).toHaveAttribute('aria-valuenow', '25');
  await expect(spinners.nth(1)).toHaveClass(/mat-accent/);
  await expect(spinners.nth(1)).toHaveAttribute('aria-valuenow', '50');
  await expect(spinners.nth(2)).toHaveClass(/mat-warn/);
  await expect(spinners.nth(2)).toHaveAttribute('aria-valuenow', '75');
});
