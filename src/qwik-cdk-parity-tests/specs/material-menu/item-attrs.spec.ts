import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('extra attributes on MatMenuItem are forwarded to its <button>', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-menu/item-attrs/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  await page.locator('[data-parity-root] button').click();
  const item = page.getByTestId('logout-item');
  await expect(item).toHaveAttribute('title', 'Sign out of this device');
  await expect(item).toHaveAttribute('role', 'menuitem');
  await expect(item).toHaveClass(/mat-mdc-menu-item/);
});
