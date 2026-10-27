import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button/text-link — renders <a> instead of <button>', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/text-link/`);
  await page.waitForSelector('[data-scenario-ready]');
  await expect(page.locator('button.mat-mdc-button-base')).toHaveCount(0);
  const a = page.locator('a.mat-mdc-button-base');
  await expect(a).toBeVisible();
  await expect(a).toHaveAttribute('href', '/about');
});
