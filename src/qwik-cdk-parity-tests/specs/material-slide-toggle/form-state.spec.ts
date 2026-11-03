import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts as a dedicated regression — exercises
 * `MatSlideToggle`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract (mirrors
 * upstream's `NgControlStatus` host classes + the `FocusMonitor`-driven `_onTouched()` timing —
 * see slide-toggle/SYNC.md's "Form state" section), using the Qwik-only
 * `mat-slide-toggle/form-state` route (no Angular mirror).
 */
test('material-slide-toggle/form-state — formBound classes + onTouched$ timing', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-slide-toggle/form-state/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bound = page.locator('[data-parity-root] mat-slide-toggle').nth(0);
  const unbound = page.locator('[data-parity-root] mat-slide-toggle').nth(1);
  const button = page.locator('[data-parity-root] button.mdc-switch').nth(0);

  // Pristine.
  await expect(bound).toHaveClass(/ng-untouched/);
  await expect(bound).toHaveClass(/ng-pristine/);
  await expect(bound).toHaveClass(/ng-valid/);
  await expect(bound).not.toHaveClass(/ng-touched|ng-dirty|ng-invalid/);

  // The unbound toggle never carries ANY of these classes.
  const unboundClass = (await unbound.getAttribute('class')) ?? '';
  expect(unboundClass).not.toMatch(/ng-(un)?touched|ng-(pri|dir)/);

  // Click -> dirty, still untouched (no blur yet).
  await button.click();
  await expect(bound).toHaveClass(/ng-dirty/);
  await expect(bound).toHaveClass(/ng-untouched/);

  // Blur -> touched.
  await button.blur();
  await expect(bound).toHaveClass(/ng-touched/);

  await page.getByRole('button', {name: 'Toggle invalid'}).click();
  await expect(bound).toHaveClass(/ng-invalid/);
  await expect(bound).not.toHaveClass(/ng-valid/);
});
