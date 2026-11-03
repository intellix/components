import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts as a dedicated regression — exercises
 * `MatButtonToggleGroup`'s new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract
 * (mirrors upstream's `NgControlStatus` host classes — see button-toggle/SYNC.md's "Form state"
 * section), using the Qwik-only `mat-button-toggle/form-state` route (no Angular mirror).
 *
 * The behavior this spec exists to prove is the CLICK-driven (not blur-driven, unlike checkbox/
 * radio/slide-toggle) `_onTouched()` timing, confirmed live against upstream's own
 * `button-toggle.ts` (`_onButtonClick()` calls `_onTouched()` only when the clicked toggle's own
 * checked state actually changes — there is no `FocusMonitor.monitor(...).subscribe(...)` call
 * on the group at all):
 *  - group1 (nothing selected): clicking ANY toggle (a real change) marks it touched.
 *  - group2 (pre-selected to "a"): re-clicking the ALREADY-selected toggle is a complete no-op
 *    upstream — must NOT mark it touched; clicking a DIFFERENT toggle afterward must.
 *  - group3 (multi-select): every non-disabled click flips that toggle's own checked state, so
 *    `onTouched$` fires unconditionally, even on the very FIRST click.
 */
test('material-button-toggle/form-state — formBound classes + click-driven onTouched$ timing', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button-toggle/form-state/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group1 = page.locator('[aria-label="group1"]');
  const group2 = page.locator('[aria-label="group2"]');
  const group3 = page.locator('[aria-label="group3"]');
  const touched1 = page.locator('p', {hasText: 'group1 touched'});
  const touched2 = page.locator('p', {hasText: 'group2 touched'});
  const touched3 = page.locator('p', {hasText: 'group3 touched'});

  // Pristine — formBound classes present on every bound group (touched/dirty/invalid all
  // omitted/default-false here, only `touched` is wired on this route).
  await expect(group1).toHaveClass(/ng-untouched/);
  await expect(group2).toHaveClass(/ng-untouched/);
  await expect(group3).toHaveClass(/ng-untouched/);
  await expect(touched1).toHaveText('group1 touched: false');
  await expect(touched2).toHaveText('group2 touched: false');
  await expect(touched3).toHaveText('group3 touched: false');

  // group1: clicking "A" (currently unselected) is a real change -> touched.
  await group1.getByRole('radio', {name: 'A', exact: true}).click();
  await expect(touched1).toHaveText('group1 touched: true');
  await expect(group1).toHaveClass(/ng-touched/);

  // group2: re-clicking the ALREADY-selected "A" is upstream's own documented no-op — must stay
  // untouched.
  await group2.getByRole('radio', {name: 'A', exact: true}).click();
  await expect(touched2).toHaveText('group2 touched: false');
  await expect(group2).toHaveClass(/ng-untouched/);

  // group2: clicking "B" (a real selection change) now marks it touched.
  await group2.getByRole('radio', {name: 'B', exact: true}).click();
  await expect(touched2).toHaveText('group2 touched: true');
  await expect(group2).toHaveClass(/ng-touched/);

  // group3 (multi-select): the FIRST click on any toggle always flips its own checked state, so
  // onTouched$ fires unconditionally — no "already selected" exemption like single-select mode.
  await group3.getByRole('button', {name: 'X', exact: true}).click();
  await expect(touched3).toHaveText('group3 touched: true');
  await expect(group3).toHaveClass(/ng-touched/);
});
