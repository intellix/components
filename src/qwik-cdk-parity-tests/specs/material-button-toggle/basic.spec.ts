import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button-toggle/basic — <mat-button-toggle-group role="radiogroup"> with 3 radio children; clicking one sets aria-checked + .mat-button-toggle-checked', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toBeVisible();
  await expect(group).toHaveAttribute('role', 'radiogroup');
  await expect(group).toHaveAttribute('aria-disabled', 'false');
  await expect(group).toHaveClass(/mat-button-toggle-group/);
  await expect(group).toHaveClass(/mat-button-toggle-group-appearance-standard/);

  const toggles = page.locator('mat-button-toggle');
  await expect(toggles).toHaveCount(3);
  await expect(toggles.nth(0)).toHaveAttribute('role', 'presentation');
  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  await expect(buttons.nth(0)).toHaveAttribute('role', 'radio');

  // Nothing selected initially: the first (enabled) toggle is the sole
  // roving-tabindex-focusable one; the rest are tabindex=-1.
  for (let i = 0; i < 3; i++) {
    await expect(buttons.nth(i)).toHaveAttribute('aria-checked', 'false');
    await expect(toggles.nth(i)).not.toHaveClass(/mat-button-toggle-checked/);
    await expect(buttons.nth(i)).toHaveAttribute('tabindex', i === 0 ? '0' : '-1');
  }

  // Every grouped toggle gets a checkbox wrapper + pseudo-checkbox, a focus
  // overlay, and a ripple span.
  for (let i = 0; i < 3; i++) {
    await expect(
      toggles.nth(i).locator('.mat-button-toggle-checkbox-wrapper mat-pseudo-checkbox'),
    ).toHaveCount(1);
    await expect(toggles.nth(i).locator('> .mat-button-toggle-focus-overlay')).toHaveCount(1);
    await expect(toggles.nth(i).locator('> .mat-ripple.mat-button-toggle-ripple')).toHaveCount(1);
  }

  // Click "italic" (index 1).
  await buttons.nth(1).click({force: true});

  await expect(buttons.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
  await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
  await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'false');
  await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');
});
