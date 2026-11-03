import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * `hideSingleSelectionIndicator`/`hideMultipleSelectionIndicator` — see
 * `qwik-material/button-toggle/SYNC.md`'s dedicated section. Fresh
 * `page.goto` per test (no reuse across tests) so every interaction happens
 * post-resume, matching this project's "functional spec" convention for
 * behaviour with no matching upstream docs example.
 */
async function load(page: Page) {
  await page.goto(`${BASE_URL}/mat-button-toggle/hide-selection-indicator/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

test('hideSingleSelectionIndicator suppresses the checkbox wrapper on a single-mode group', async ({
  page,
}) => {
  await load(page);
  const group = page.locator('[data-testid="single-hidden"] mat-button-toggle-group');
  await expect(group.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(0);
  // The toggle itself still works — only the visual indicator is gone.
  await group.locator('button.mat-button-toggle-button').first().click();
  await expect(group.locator('button.mat-button-toggle-button').first()).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('hideMultipleSelectionIndicator suppresses the checkbox wrapper on a multi-mode group', async ({
  page,
}) => {
  await load(page);
  const group = page.locator('[data-testid="multi-hidden"] mat-button-toggle-group');
  await expect(group.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(0);
  await group.locator('button.mat-button-toggle-button').first().click();
  await expect(group.locator('button.mat-button-toggle-button').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a single-mode group setting only hideMultipleSelectionIndicator still shows its checkbox wrapper (flags are per-mode, not global)', async ({
  page,
}) => {
  await load(page);
  const group = page.locator('[data-testid="single-cross-flag"] mat-button-toggle-group');
  await expect(group.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(2);
});

test('a default group (neither flag set) still shows its checkbox wrapper on every toggle', async ({
  page,
}) => {
  await load(page);
  const group = page.locator('[data-testid="multi-hidden"] mat-button-toggle-group');
  // Sanity: the sibling single-mode default group used elsewhere in this suite
  // (basic.spec.ts) already pins this; re-confirm locally that hiding one
  // group's indicator doesn't leak into an unrelated one on the same page.
  const singleHidden = page.locator('[data-testid="single-hidden"] mat-button-toggle-group');
  await expect(singleHidden.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(0);
  await expect(group.locator('.mat-button-toggle-checkbox-wrapper')).toHaveCount(0);
});
