import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/form-name — hidden <input name="text-style" value> emitted inside checked toggle only', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/form-name/`);
  await page.waitForSelector('[data-scenario-ready]');

  const toggles = page.locator('mat-button-toggle');

  // Preselected 'bold' — hidden input inside bold.
  const boldHidden = toggles.nth(0).locator('input[type="hidden"]');
  await expect(boldHidden).toHaveAttribute('name', 'text-style');
  await expect(boldHidden).toHaveAttribute('value', 'bold');

  // Non-checked children have no hidden input.
  await expect(toggles.nth(1).locator('input[type="hidden"]')).toHaveCount(0);
  await expect(toggles.nth(2).locator('input[type="hidden"]')).toHaveCount(0);

  // Switch to italic.
  await toggles.nth(1).locator('button.mat-button-toggle-button').click();

  // Hidden input moves to italic.
  await expect(toggles.nth(0).locator('input[type="hidden"]')).toHaveCount(0);
  const italicHidden = toggles.nth(1).locator('input[type="hidden"]');
  await expect(italicHidden).toHaveAttribute('name', 'text-style');
  await expect(italicHidden).toHaveAttribute('value', 'italic');
});
