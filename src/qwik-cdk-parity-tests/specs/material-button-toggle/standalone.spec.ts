import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button-toggle/standalone — <mat-button-toggle role="presentation"> wrapping a role="button" aria-pressed="false" button; no pseudo-checkbox; click flips aria-pressed + .mat-button-toggle-checked via local signal', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/standalone/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggle = page.locator('mat-button-toggle');
  await expect(toggle).toHaveCount(1);
  await expect(toggle).toHaveAttribute('role', 'presentation');
  await expect(toggle).toHaveClass(/mat-button-toggle-standalone/);
  await expect(toggle).not.toHaveClass(/mat-button-toggle-checked/);

  const button = toggle.locator('button.mat-button-toggle-button');
  await expect(button).toHaveAttribute('role', 'button');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await expect(button).toHaveAttribute('tabindex', '0');
  expect(await button.getAttribute('aria-checked')).toBeNull();

  // Standalone toggles never render the checkbox wrapper / pseudo-checkbox
  // (upstream condition requires `buttonToggleGroup` to be present).
  await expect(toggle.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(0);
  await expect(toggle.locator('> .mat-button-toggle-focus-overlay')).toHaveCount(1);
  await expect(toggle.locator('> .mat-ripple.mat-button-toggle-ripple')).toHaveCount(1);

  // Click via inner <button>.
  await button.click({force: true});

  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveClass(/mat-button-toggle-checked/);

  // Click again — flips back.
  await button.click({force: true});
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});
