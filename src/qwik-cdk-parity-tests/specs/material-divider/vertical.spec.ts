import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/vertical — .mat-divider-vertical class + aria-orientation="vertical"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-divider/vertical/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-vertical/);
  await expect(divider).not.toHaveClass(/mat-divider-horizontal/);
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
});
