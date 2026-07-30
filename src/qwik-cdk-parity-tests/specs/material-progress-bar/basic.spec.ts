import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/basic — <mat-progress-bar> with default determinate mode, primary color, aria-valuenow=50, 3-div inner template', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveClass(/mat-mdc-progress-bar/);
  await expect(bar).toHaveClass(/mdc-linear-progress/);
  await expect(bar).toHaveClass(/mat-primary/);
  await expect(bar).toHaveAttribute('role', 'progressbar');
  await expect(bar).toHaveAttribute('aria-valuemin', '0');
  await expect(bar).toHaveAttribute('aria-valuemax', '100');
  await expect(bar).toHaveAttribute('aria-valuenow', '50');
  await expect(bar).toHaveAttribute('tabindex', '-1');
  await expect(bar).toHaveAttribute('mode', 'determinate');

  await expect(bar.locator('.mdc-linear-progress__buffer')).toBeAttached();
  await expect(bar.locator('.mdc-linear-progress__primary-bar')).toBeAttached();
  await expect(bar.locator('.mdc-linear-progress__secondary-bar')).toBeAttached();
});
