import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/positions — 4 wrappers cover all 4 above/below × before/after combinations', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/positions/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('span.mat-badge');
  await expect(badges).toHaveCount(4);

  // above-after: above + after
  await expect(badges.nth(0)).toHaveClass(/mat-badge-above/);
  await expect(badges.nth(0)).toHaveClass(/mat-badge-after/);

  // above-before: above + before
  await expect(badges.nth(1)).toHaveClass(/mat-badge-above/);
  await expect(badges.nth(1)).toHaveClass(/mat-badge-before/);

  // below-after: below + after
  await expect(badges.nth(2)).toHaveClass(/mat-badge-below/);
  await expect(badges.nth(2)).toHaveClass(/mat-badge-after/);

  // below-before: below + before
  await expect(badges.nth(3)).toHaveClass(/mat-badge-below/);
  await expect(badges.nth(3)).toHaveClass(/mat-badge-before/);
});
