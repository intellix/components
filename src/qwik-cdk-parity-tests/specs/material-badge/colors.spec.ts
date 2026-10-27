import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/colors — 3 wrappers with distinct mat-badge-{primary,accent,warn} classes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/colors/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('button.mat-badge');
  await expect(badges).toHaveCount(3);

  await expect(badges.nth(0)).toHaveClass(/mat-badge-primary/);
  await expect(badges.nth(1)).toHaveClass(/mat-badge-accent/);
  await expect(badges.nth(2)).toHaveClass(/mat-badge-warn/);
});
