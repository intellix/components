import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/disabled-individual — middle child aria-disabled=true; others clickable', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-individual/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles.nth(0)).toHaveAttribute('aria-disabled', 'false');
  await expect(toggles.nth(1)).toHaveAttribute('aria-disabled', 'true');
  await expect(toggles.nth(2)).toHaveAttribute('aria-disabled', 'false');

  // Click first (enabled) — sets aria-checked.
  await toggles.nth(0).locator('button.mat-button-toggle-button').click();
  await expect(toggles.nth(0)).toHaveAttribute('aria-checked', 'true');
});
