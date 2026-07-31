import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-divider/basic — <mat-divider> with .mat-divider + .mat-divider-horizontal classes, role="separator", aria-orientation="horizontal"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-divider/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const divider = page.locator('mat-divider');
  await expect(divider).toBeVisible();
  await expect(divider).toHaveClass(/mat-divider(\s|$)/);
  await expect(divider).toHaveClass(/mat-divider-horizontal/);
  await expect(divider).not.toHaveClass(/mat-divider-vertical/);
  await expect(divider).not.toHaveClass(/mat-divider-inset/);
  await expect(divider).toHaveAttribute('role', 'separator');
  await expect(divider).toHaveAttribute('aria-orientation', 'horizontal');

  // Self-closing — no children inside the <mat-divider> element.
  await expect(divider).toHaveText('');
});
