import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * `MatSelect.compareWith` — see `qwik-material/select/SYNC.md`'s dedicated section. No matching
 * upstream docs example exists (`compareWith` only appears in upstream's unit tests, never a
 * `components-examples` route), so this is a Qwik-only functional spec (fresh `page.goto` per
 * test, so every interaction — including the INITIAL selection matching, which must already be
 * correct on first paint — happens post-resume for anything that follows it).
 */
async function load(page: Page) {
  await page.goto(`${BASE_URL}/mat-select/compare-with/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

test('single-select: initial object-valued selection matches via compareWith (key, not reference)', async ({
  page,
}) => {
  await load(page);
  const trigger = page.locator('[data-testid="single"] .mat-mdc-select-value-text');
  await expect(trigger).toHaveText('Pizza');
});

test('single-select: picking a different option via compareWith updates the trigger + emits the new object', async ({
  page,
}) => {
  await load(page);
  await page.locator('[data-testid="single"] mat-select').click();
  await page.locator('mat-option', {hasText: 'Steak'}).click();
  await expect(page.locator('[data-testid="single"] .mat-mdc-select-value-text')).toHaveText(
    'Steak',
  );
  await expect(page.locator('[data-testid="single-value"]')).toHaveText('Value: Steak');
});

test('multi-select: initial object-valued selections match via compareWith, and show as checked in the panel', async ({
  page,
}) => {
  await load(page);
  const trigger = page.locator('[data-testid="multi"] .mat-mdc-select-value-text');
  await expect(trigger).toHaveText('Steak, Tacos');
  await page.locator('[data-testid="multi"] mat-select').click();
  const steak = page.locator('mat-option', {hasText: 'Steak'});
  const pizza = page.locator('mat-option', {hasText: 'Pizza'});
  const tacos = page.locator('mat-option', {hasText: 'Tacos'});
  await expect(steak).toHaveAttribute('aria-selected', 'true');
  await expect(pizza).toHaveAttribute('aria-selected', 'false');
  await expect(tacos).toHaveAttribute('aria-selected', 'true');
});

test('multi-select: toggling an already-selected object (by key, not reference) deselects it', async ({
  page,
}) => {
  await load(page);
  await page.locator('[data-testid="multi"] mat-select').click();
  // Every option's `value` is a FRESH object on this render too — clicking "Steak" must still
  // deselect it, proving the membership check itself goes through `compareWith`, not `===`.
  await page.locator('mat-option', {hasText: 'Steak'}).click();
  await expect(page.locator('[data-testid="multi-value"]')).toHaveText('Value: Tacos');
  // Re-open and toggle Pizza on, proving a FRESH selection via compareWith also works.
  await page.locator('[data-testid="multi"] mat-select').click();
  await page.locator('mat-option', {hasText: 'Pizza'}).click();
  await expect(page.locator('[data-testid="multi-value"]')).toHaveText('Value: Pizza, Tacos');
});
