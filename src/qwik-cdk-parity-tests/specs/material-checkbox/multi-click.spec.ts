import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts as a dedicated regression — guards
 * against the "stale capture" bug class found in the sibling slide-toggle
 * port: a click handler that captures `checked`/`disabled` as outer-scope
 * consts inside its `$()` closure (instead of re-reading them live) can see
 * a SECOND click never toggle back, because the closure that gets invoked
 * was built from an earlier render's snapshot. `MatCheckbox`'s own
 * `checked`/`indeterminate` are real signals read via `.value` (inherently
 * live); `disabled`/`disabledInteractive`/`clickAction` are re-read directly
 * from `props`/`config` inside `handleInputClick$` for the same reason (see
 * mat-checkbox.tsx's comment). This exercises a LONG click sequence —
 * several more toggles than angular-parity.spec.ts's own click()/click()/
 * spaceToggle() — to catch any staleness that only shows up after more than
 * two or three interactions.
 */
test('material-checkbox/basic — five clicks in a row toggle correctly every time', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const input = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
  const p = page.locator('[data-parity-root] p');

  const waitSettled = () =>
    page.waitForFunction(
      () => !document.querySelector('[data-parity-root] [class*="mdc-checkbox--anim-"]'),
      undefined,
      {timeout: 5000},
    );

  let expected = false;
  for (let i = 0; i < 5; i++) {
    await input.click({force: true});
    expected = !expected;
    await waitSettled();
    if (expected) {
      await expect(input).toHaveClass(/mdc-checkbox--selected/);
    } else {
      await expect(input).not.toHaveClass(/mdc-checkbox--selected/);
    }
    await expect(p).toHaveText(`Checked: ${expected}`);
  }
});
