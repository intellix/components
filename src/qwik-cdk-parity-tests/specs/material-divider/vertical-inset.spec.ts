import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/vertical-inset — both .mat-divider-vertical AND .mat-divider-inset classes active', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-divider/vertical-inset/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-vertical/);
  await expect(divider).toHaveClass(/mat-divider-inset/);
  await expect(divider).not.toHaveClass(/mat-divider-horizontal/);
  await expect(divider).toHaveAttribute('aria-orientation', 'vertical');
});
