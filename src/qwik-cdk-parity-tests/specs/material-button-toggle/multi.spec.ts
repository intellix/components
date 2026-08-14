import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/multi — role="group" + .mat-button-toggle-group-multiple; role="checkbox" children; click 2 in sequence; click again unchecks', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/multi/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('role', 'group');
  await expect(group).toHaveClass(/mat-button-toggle-group-multiple/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('role', 'checkbox');

  // Click "read" then "write".
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(2)).toHaveAttribute('aria-checked', 'false');

  // Click "read" again — unchecks.
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
});
