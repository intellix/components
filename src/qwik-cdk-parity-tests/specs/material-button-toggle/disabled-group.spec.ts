import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button-toggle/disabled-group — group aria-disabled=true; every child button carries the native `disabled` attribute + pointer-events:none', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-group/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-button-toggle-group');
  await expect(group).toHaveAttribute('aria-disabled', 'true');

  const toggles = page.locator('mat-button-toggle');
  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  for (let i = 0; i < 3; i++) {
    await expect(toggles.nth(i)).toHaveClass(/mat-button-toggle-disabled/);
    // Native `disabled` on the inner <button> (no aria-disabled anywhere —
    // disabledInteractive, the only upstream path to aria-disabled, isn't
    // ported) is what actually blocks interaction and is what screen
    // readers pick up on.
    await expect(buttons.nth(i)).toBeDisabled();
    // Upstream `.mat-button-toggle-disabled { pointer-events: none; ... }`
    // — no opacity override.
    const pe = await toggles.nth(i).evaluate(el => getComputedStyle(el).pointerEvents);
    expect(pe).toBe('none');
  }

  // Preselected "bold" (index 0) — verify it's still shown as checked SSR-side.
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'true');

  // Clicking is a no-op while disabled (pointer-events: none also blocks a
  // real pointer, but assert on state directly since Playwright's click
  // bypasses pointer-events by default).
  await buttons.nth(1).click({force: true});
  await expect(buttons.nth(1)).toHaveAttribute('aria-checked', 'false');
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'true');
});
