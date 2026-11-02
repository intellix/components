import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/list-context — 2 dividers between 3 items, each with correct role', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-divider/list-context/`);
  await page.waitForSelector('[data-scenario-ready]');

  const dividers = page.locator('mat-divider');
  await expect(dividers).toHaveCount(2);

  await expect(dividers.nth(0)).toHaveAttribute('role', 'separator');
  await expect(dividers.nth(0)).toHaveClass(/mat-divider-horizontal/);
  await expect(dividers.nth(1)).toHaveAttribute('role', 'separator');
  await expect(dividers.nth(1)).toHaveClass(/mat-divider-horizontal/);
});
