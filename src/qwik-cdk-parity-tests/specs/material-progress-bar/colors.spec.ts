import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-progress-bar/colors — 3 bars with distinct .mat-{primary,accent,warn} classes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bars = page.locator('mat-progress-bar');
  await expect(bars).toHaveCount(3);

  await expect(bars.nth(0)).toHaveClass(/mat-primary/);
  await expect(bars.nth(0)).toHaveAttribute('aria-valuenow', '25');
  await expect(bars.nth(1)).toHaveClass(/mat-accent/);
  await expect(bars.nth(1)).toHaveAttribute('aria-valuenow', '50');
  await expect(bars.nth(2)).toHaveClass(/mat-warn/);
  await expect(bars.nth(2)).toHaveAttribute('aria-valuenow', '75');
});
