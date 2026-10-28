import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts — its `click()`/`spaceToggle()` helpers
 * only ever target the native input directly. Clicking the projected <label>
 * text is real upstream behavior (checkbox.html's `<label [for]="inputId">`):
 * the browser's native `for`/`id` forwarding synthesizes a click on the
 * associated input, and `_preventBubblingFromLabel` (mirrored here on
 * `MatInternalFormField`'s `onClick$`) stops that synthetic click's bubble so
 * nothing above double-handles it. Net effect: clicking the label toggles the
 * checkbox exactly once.
 */
test('material-checkbox/basic — clicking the label toggles the checkbox exactly once', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const label = page.locator('[data-parity-root] label.mdc-label');
  const input = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
  const p = page.locator('[data-parity-root] p');

  await expect(input).not.toBeChecked();
  await expect(p).toHaveText('Checked: false');

  await label.click();

  await expect(input).toBeChecked();
  await expect(p).toHaveText('Checked: true');

  // A second click toggles back exactly once too (no double-fire).
  await label.click();

  await expect(input).not.toBeChecked();
  await expect(p).toHaveText('Checked: false');
});
