import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button/filled-link — <a> with filled classes', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-button/filled-link/`);
  await page.waitForSelector('[data-scenario-ready]');
  const a = page.locator('a.mat-mdc-button-base');
  await expect(a).toBeVisible();
  await expect(a).toHaveClass(/mdc-button--unelevated/);
  await expect(a).toHaveAttribute('href', '/about');
});
