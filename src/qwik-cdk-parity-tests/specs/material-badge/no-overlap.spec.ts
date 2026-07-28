import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/no-overlap — mat-badge without mat-badge-overlap class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-badge/no-overlap/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).not.toHaveClass(/mat-badge-overlap/);
});
