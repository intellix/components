import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-badge/description — inline cdk-visually-hidden span carries the description text', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-badge/description/`);
  await page.waitForSelector('[data-scenario-ready]');

  const badge = page.locator('span.mat-badge');
  await expect(badge).toBeVisible();

  const content = page.locator('span.mat-badge-content');
  await expect(content).toContainText('5');

  const desc = page.locator('span.mat-badge-content > span.cdk-visually-hidden');
  await expect(desc).toBeAttached();
  await expect(desc).toHaveText('3 unread messages');
});
