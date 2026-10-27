import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-badge/empty-content — auto-hide when content is empty or whitespace; visible when content is 0', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/empty-content/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badges = page.locator('button.mat-badge');
  await expect(badges).toHaveCount(3);

  await expect(badges.nth(0)).toBeAttached();
  await expect(badges.nth(0)).toHaveClass(/mat-badge-hidden/);

  await expect(badges.nth(1)).toBeAttached();
  await expect(badges.nth(1)).toHaveClass(/mat-badge-hidden/);

  await expect(badges.nth(2)).toBeVisible();
  await expect(badges.nth(2)).not.toHaveClass(/mat-badge-hidden/);
  const zeroContent = badges.nth(2).locator('span.mat-badge-content');
  await expect(zeroContent).toContainText('0');
});
