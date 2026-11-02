import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test("material-button-toggle/disabled-individual — middle child's inner button carries `disabled`; others clickable", async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-individual/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggles = page.locator('mat-button-toggle');
  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  await expect(buttons.nth(0)).toBeEnabled();
  await expect(buttons.nth(1)).toBeDisabled();
  await expect(buttons.nth(2)).toBeEnabled();
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-disabled/);
  await expect(toggles.nth(0)).not.toHaveClass(/mat-button-toggle-disabled/);
  await expect(toggles.nth(2)).not.toHaveClass(/mat-button-toggle-disabled/);

  // No selection yet: the first ENABLED toggle (index 0) is the sole
  // roving-tabindex-focusable one. Disabled toggles always render
  // tabindex=-1 regardless.
  await expect(buttons.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(buttons.nth(1)).toHaveAttribute('tabindex', '-1');
  await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');

  // Click first (enabled) — sets aria-checked + moves the roving tabindex.
  await buttons.nth(0).click({force: true});
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(buttons.nth(0)).toHaveAttribute('tabindex', '0');
  await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');
});
