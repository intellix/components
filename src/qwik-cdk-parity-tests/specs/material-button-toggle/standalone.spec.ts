import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/standalone — <mat-button-toggle role="button" aria-pressed="false">; click flips aria-pressed + .mat-button-toggle-checked via local signal', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/standalone/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggle = page.locator('mat-button-toggle');
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('role', 'button');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(toggle).not.toHaveClass(/mat-button-toggle-checked/);

  // Click via inner <button>.
  await toggle.locator('button.mat-button-toggle-button').click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveClass(/mat-button-toggle-checked/);

  // Click again — flips back.
  await toggle.locator('button.mat-button-toggle-button').click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
