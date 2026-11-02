import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/disabled — mat-badge with mat-badge-disabled class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/disabled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('button.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge-disabled/);
});
