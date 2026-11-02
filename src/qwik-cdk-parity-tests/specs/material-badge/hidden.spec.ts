import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/hidden — mat-badge with mat-badge-hidden class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/hidden/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('button.mat-badge');
  await expect(badge).toBeAttached();
  await expect(badge).toHaveClass(/mat-badge-hidden/);
});
