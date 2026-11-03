import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts as a dedicated regression — exercises `MatCheckbox`'s
 * new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract (mirrors upstream's
 * `NgControlStatus` host classes + `_onBlur()` → `_onTouched()` timing — see checkbox/SYNC.md's
 * "Form state" section) end to end, using the Qwik-only `mat-checkbox/form-state` route (no
 * Angular mirror — the classes themselves ARE already covered by angular-parity.spec.ts via the
 * `ripple-overview` docs example at rest; this spec is the one place that exercises the
 * BEHAVIOR: dirty-on-change, touched-on-blur, and the unbound checkbox's total absence of these
 * classes).
 */
test('material-checkbox/form-state — formBound classes + onTouched$ timing', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/form-state/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bound = page.locator('[data-parity-root] mat-checkbox').nth(0);
  const unbound = page.locator('[data-parity-root] mat-checkbox').nth(1);
  const input = page.locator('[data-parity-root] input.mdc-checkbox__native-control').nth(0);

  // Pristine: untouched/pristine/valid on the bound checkbox.
  await expect(bound).toHaveClass(/ng-untouched/);
  await expect(bound).toHaveClass(/ng-pristine/);
  await expect(bound).toHaveClass(/ng-valid/);
  await expect(bound).not.toHaveClass(/ng-touched|ng-dirty|ng-invalid/);

  // The unbound checkbox never carries ANY of these classes — `formBound` gates them entirely.
  const unboundClass = (await unbound.getAttribute('class')) ?? '';
  expect(unboundClass).not.toMatch(/ng-(un)?touched|ng-(pri|dir)/);

  // Click -> dirty (mirrors NgModel marking dirty the instant the value changes), but still
  // untouched (no blur yet).
  await input.click();
  await expect(bound).toHaveClass(/ng-dirty/);
  await expect(bound).toHaveClass(/ng-untouched/);

  // Blur -> touched (mirrors upstream's `_onBlur()` -> `_onTouched()`).
  await input.blur();
  await expect(bound).toHaveClass(/ng-touched/);

  // `invalid` is pre-computed by the consumer, not derived from any interaction here.
  await page.getByRole('button', {name: 'Toggle invalid'}).click();
  await expect(bound).toHaveClass(/ng-invalid/);
  await expect(bound).not.toHaveClass(/ng-valid/);
});
