import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: upstream's `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS.color` (ported to
 * `MatSlideToggleConfig.color`) has no Angular mirror scenario. Upstream unit
 * test precedent: "should be able to change the default color"
 * (slide-toggle.spec.ts) — a provider-level default color applies when no
 * per-instance `color` prop is given, matching the constructor's
 * `this.color = defaults.color || 'accent'`.
 */
test('material-slide-toggle/config-default-color — provider matSlideToggleConfig.color applies when no per-instance color prop is set', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-slide-toggle/config-default-color/`);
  await page.waitForSelector('[data-scenario-ready]');

  const host = page.locator('mat-slide-toggle');
  await expect(host).toHaveClass(/mat-warn/);
  await expect(host).not.toHaveClass(/mat-accent/);
});
