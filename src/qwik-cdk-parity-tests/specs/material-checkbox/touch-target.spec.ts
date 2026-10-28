import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts — its `click()` helper only ever
 * targets the native input directly. Upstream's `.mat-mdc-checkbox-touch-target`
 * div has its own `(click)="_onTouchTargetClick()"` handler, which toggles the
 * checkbox exactly like clicking the input, then focuses the input (mirrors
 * `_handleInputClick()` + an explicit `.focus()` call — see checkbox.ts).
 */
test('material-checkbox/basic — clicking the touch target toggles the checkbox and focuses the input', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/basic/`);
  await page.waitForSelector('[data-scenario-ready]');

  const touchTarget = page.locator('[data-parity-root] .mat-mdc-checkbox-touch-target');
  const input = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
  const p = page.locator('[data-parity-root] p');

  await expect(input).not.toBeChecked();

  // Click within the touch target's own extended hit area but OUTSIDE the
  // input's (the touch target is 48x48, the input 40x40, both centered on
  // the same point — a {2,2} offset from the touch target's own top-left
  // lands in that 4px margin, under neither the input's nor any other
  // element's box). `force: true` is still needed since the div is visually
  // `aria-hidden` scaffolding, not something Playwright considers "visible"
  // on its own terms.
  await touchTarget.click({force: true, position: {x: 2, y: 2}});

  await expect(input).toBeChecked();
  await expect(p).toHaveText('Checked: true');
  await expect(input).toBeFocused();
});

/**
 * Upstream's `_onTouchTargetClick` only focuses the input `if (!this.disabled)`
 * — a disabled checkbox's touch target still routes through the same handler
 * (no native `disabled` attribute blocks THIS div's click), but must not
 * toggle anything or steal focus.
 */
test('material-checkbox/disabled-interactive — touch target click is a no-op and does not focus', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/disabled-interactive/`);
  await page.waitForSelector('[data-scenario-ready]');

  const touchTarget = page.locator('[data-parity-root] .mat-mdc-checkbox-touch-target');
  const input = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
  const p = page.locator('[data-parity-root] p');

  await touchTarget.click({force: true, position: {x: 2, y: 2}});

  await expect(input).not.toBeChecked();
  await expect(p).toHaveText('Checked: false');
  await expect(input).not.toBeFocused();
});
