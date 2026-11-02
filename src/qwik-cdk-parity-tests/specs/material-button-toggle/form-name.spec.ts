import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test("material-button-toggle/form-name — group.name is mirrored onto every single-select child's inner <button name>, regardless of checked state; no hidden <input> is ever rendered", async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/form-name/`);
  await page.waitForSelector('[data-scenario-ready]');

  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');

  // Upstream has no hidden <input> anywhere in button-toggle's template —
  // `name` is a plain (non-form-participating) attribute on the inner
  // <button>, mirrored from the group in single-select mode regardless of
  // which toggle is checked.
  await expect(page.locator('input[type="hidden"]')).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await expect(buttons.nth(i)).toHaveAttribute('name', 'text-style');
  }

  // Preselected 'bold'.
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'true');

  // Switch to italic — `name` stays on every button; only `aria-checked`
  // (and the roving tabindex) moves.
  await buttons.nth(1).click({force: true});
  await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'false');
  await expect(buttons.nth(1)).toHaveAttribute('aria-checked', 'true');
  for (let i = 0; i < 3; i++) {
    await expect(buttons.nth(i)).toHaveAttribute('name', 'text-style');
  }
  await expect(page.locator('input[type="hidden"]')).toHaveCount(0);
});
