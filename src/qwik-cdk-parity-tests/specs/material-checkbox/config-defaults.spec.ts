import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Not covered by angular-parity.spec.ts — every contract scenario either
 * omits `color` (falling back to the component's own 'accent' default,
 * matching upstream's hardcoded `checkboxDefaults`) or sets it explicitly; no
 * scenario exercises `useMatCheckboxProvider({...})`, the
 * MAT_CHECKBOX_DEFAULT_OPTIONS-equivalent this port adds. Uses the Qwik-only
 * `mat-checkbox/config-defaults` route (no Angular mirror).
 */
test('material-checkbox/config-defaults — provider color/clickAction defaults apply unless overridden', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-checkbox/config-defaults/`);
  await page.waitForSelector('[data-scenario-ready]');

  const hosts = page.locator('[data-parity-root] mat-checkbox');
  const inputs = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
  const p = page.locator('[data-parity-root] p');

  // #0: no explicit `color` — picks up the provider's `color: 'primary'`.
  await expect(hosts.nth(0)).toHaveClass(/mat-primary/);
  // #1: explicit `color="warn"` wins over the provider default.
  await expect(hosts.nth(1)).toHaveClass(/mat-warn/);
  await expect(hosts.nth(1)).not.toHaveClass(/mat-primary/);

  // #0 also picks up the provider's `clickAction: 'noop'` — clicking never
  // toggles `checked` or calls onChange$ (upstream: "Do not toggle checked or
  // indeterminate").
  await expect(inputs.nth(0)).not.toBeChecked();
  await inputs.nth(0).click({force: true});
  await expect(inputs.nth(0)).not.toBeChecked();
  await expect(p).toHaveText('Checked: false');
});
