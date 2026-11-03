import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts as a dedicated regression — exercises `MatRadioGroup`'s
 * new `formBound`/`touched`/`dirty`/`invalid`/`onTouched$` contract (mirrors upstream's
 * `NgControlStatus` host classes on the GROUP + `_touch()` timing — see radio/SYNC.md's "Form
 * state" section), using the Qwik-only `mat-radio/form-state` route (no Angular mirror).
 *
 * The behavior this spec is specifically here to prove: the group becomes touched on blur of
 * ANY member radio — including when focus moves to ANOTHER radio IN THE SAME GROUP (upstream's
 * `_touch()` is called from each `<MatRadioButton>`'s own `FocusMonitor` subscription, which
 * fires on blur of that specific element regardless of where focus goes next).
 */
test('material-radio/form-state — formBound classes + group-touched-on-any-blur timing', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-radio/form-state/`);
  await page.waitForSelector('[data-scenario-ready]');

  const boundGroup = page.locator('[data-parity-root] mat-radio-group').nth(0);
  const unboundGroup = page.locator('[data-parity-root] mat-radio-group').nth(1);
  const radioA = page.locator('[data-parity-root]').getByRole('radio', {name: 'A', exact: true});
  const radioB = page.locator('[data-parity-root]').getByRole('radio', {name: 'B', exact: true});

  // Pristine.
  await expect(boundGroup).toHaveClass(/ng-untouched/);
  await expect(boundGroup).toHaveClass(/ng-pristine/);
  await expect(boundGroup).toHaveClass(/ng-valid/);
  await expect(boundGroup).not.toHaveClass(/ng-touched|ng-dirty|ng-invalid/);

  // The unbound group never carries ANY of these classes.
  const unboundClass = (await unboundGroup.getAttribute('class')) ?? '';
  expect(unboundClass).not.toMatch(/ng-(un)?touched|ng-(pri|dir)/);

  // Click radio A -> dirty (value changed), but still untouched (no blur yet).
  await radioA.click();
  await expect(boundGroup).toHaveClass(/ng-dirty/);
  await expect(boundGroup).toHaveClass(/ng-untouched/);

  // Move focus from A to B WITHIN the group (keyboard arrow navigation — native same-`name`
  // radio behavior, both selection and focus move together) — this blurs A, which must mark the
  // GROUP touched even though focus never left the group at all.
  await radioA.focus();
  await radioA.press('ArrowRight');
  await expect(boundGroup).toHaveClass(/ng-touched/);
});
