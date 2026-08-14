import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/basic — <mat-button-toggle-group role="radiogroup"> with 3 radio children; clicking one sets aria-checked + .mat-button-toggle-checked', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute('role', 'radiogroup');
  await expect(group).toHaveClass(/mat-button-toggle-group/);
  await expect(group).toHaveClass(/mat-button-toggle-standard/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('role', 'radio');

  // Initial state: none checked.
  for (let i = 0; i < 3; i++) {
    await expect(toggles.nth(i)).toHaveAttribute('aria-checked', 'false');
    await expect(toggles.nth(i)).not.toHaveClass(/mat-button-toggle-checked/);
  }

  // Click "italic" (index 1).
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(toggles.nth(2)).toHaveAttribute('aria-checked', 'false');
});
