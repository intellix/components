import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/basic — wrapper span carries mat-badge classes + content span present', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();
  await expect(badge).toHaveClass(/mat-badge(\s|$)/);
  await expect(badge).toHaveClass(/mat-badge-primary/);
  await expect(badge).toHaveClass(/mat-badge-medium/);
  await expect(badge).toHaveClass(/mat-badge-above/);
  await expect(badge).toHaveClass(/mat-badge-after/);
  await expect(badge).toHaveClass(/mat-badge-overlap/);

  const content = page.locator('span.mat-badge-content');
  await expect(content).toBeVisible();
  await expect(content).toContainText('5');
  await expect(content).toHaveAttribute('aria-hidden', 'true');
  await expect(content).toHaveClass(/mat-badge-active/);
});
