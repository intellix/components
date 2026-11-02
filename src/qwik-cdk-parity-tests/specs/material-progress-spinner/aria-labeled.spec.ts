import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/aria-labeled — <mat-progress-spinner> carries aria-label="Loading" alongside role="progressbar"', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('role', 'progressbar');
  await expect(spinner).toHaveAttribute('aria-label', 'Loading');
  await expect(spinner).toHaveAttribute('aria-valuenow', '25');
});
