import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

// Upstream button-toggle.spec.ts: roving-tabindex arrow-key navigation
// (LEFT/RIGHT/UP/DOWN move the active toggle, wrapping around; SPACE/ENTER
// activate it) — ported now that MatButtonToggleGroup implements its own
// `_keydown()` equivalent (previously out of scope).
test('material-button-toggle/basic — ArrowRight/ArrowLeft move the roving tabindex + selection, wrapping around; Space activates', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  await buttons.nth(0).focus();
  await expect(buttons.nth(0)).toBeFocused();

  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(1)).toBeFocused();
  await expect(buttons.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');

  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(2)).toBeFocused();
  await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'true');

  // Wraps around past the last toggle back to the first.
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(0)).toBeFocused();
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'true');

  // ArrowLeft wraps the other way.
  await page.keyboard.press('ArrowLeft');
  await expect(buttons.nth(2)).toBeFocused();
  await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'true');

  // Space on the already-focused (already-checked) toggle is a no-op —
  // radio semantics never deselect by reactivating the current one.
  await page.keyboard.press(' ');
  await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'true');
});

test('material-button-toggle/disabled-individual — arrow-key navigation skips the disabled toggle', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/disabled-individual/`);
  await page.waitForSelector('[data-scenario-ready]');

  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  await buttons.nth(0).focus();

  // Toggle 1 ('italic') is disabled — ArrowRight from 0 should land on 2,
  // not 1.
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(2)).toBeFocused();
  await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'true');

  // ArrowLeft from 2 wraps past the disabled middle toggle back to 0.
  await page.keyboard.press('ArrowLeft');
  await expect(buttons.nth(0)).toBeFocused();
});
