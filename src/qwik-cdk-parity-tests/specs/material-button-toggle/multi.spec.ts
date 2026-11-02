import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button-toggle/multi — role="group"; role="button" + aria-pressed children (never "checkbox"); click 2 in sequence; click again unchecks', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/multi/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('role', 'group');
  // There is no "mat-button-toggle-group-multiple" class upstream.
  await expect(group).not.toHaveClass(/mat-button-toggle-group-multiple/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  // Multi-select mode renders role="button" + aria-pressed, never
  // role="checkbox"/aria-checked (upstream `isSingleSelector()` is false
  // whenever the group is in multiple mode).
  await expect(buttons.nth(0)).toHaveAttribute('role', 'button');
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
  expect(await buttons.nth(0).getAttribute('aria-checked')).toBeNull();
  // Multi-select toggles are never part of the single-select roving
  // tabindex scheme — every one stays tabindex=0.
  for (let i = 0; i < 3; i++) {
    await expect(buttons.nth(i)).toHaveAttribute('tabindex', '0');
  }

  // Click "read" then "write".
  await buttons.nth(0).click({force: true});
  await buttons.nth(1).click({force: true});

  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'false');

  // Click "read" again — unchecks (checkbox semantics, unlike single-select
  // radio semantics).
  await buttons.nth(0).click({force: true});
  await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'false');
  await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
});
