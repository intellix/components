import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/aria-labeled — <mat-progress-bar> carries aria-label="Uploading" alongside role="progressbar"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toBeVisible();
  await expect(bar).toHaveAttribute('role', 'progressbar');
  await expect(bar).toHaveAttribute('aria-label', 'Uploading');
  await expect(bar).toHaveAttribute('aria-valuenow', '25');
});
