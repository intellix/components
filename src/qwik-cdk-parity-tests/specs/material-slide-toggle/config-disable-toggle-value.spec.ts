import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: upstream's `MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS.disableToggleValue`
 * (ported to `MatSlideToggleConfig.disableToggleValue`, provider-only — no
 * per-instance `@Input()` upstream, matched here) has no Angular mirror
 * scenario (the dev-app's `qwik-parity` routes don't exercise provider
 * defaults on the Angular side either). Upstream unit test precedent: "should
 * not change value on click when click action is noop when using custom a
 * action configuration" (slide-toggle.spec.ts).
 */
test('material-slide-toggle/config-disable-toggle-value — click still fires onToggleChange$ but never flips checked / fires onChange$', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-slide-toggle/config-disable-toggle-value/`);
  await page.waitForSelector('[data-scenario-ready]');

  const button = page.locator('button.mdc-switch');
  await expect(button).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('[data-toggle-count]')).toHaveText('0');
  await expect(page.locator('[data-change-count]')).toHaveText('0');

  await button.click();
  await expect(page.locator('[data-toggle-count]')).toHaveText('1');
  await expect(page.locator('[data-change-count]')).toHaveText('0');
  await expect(button).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('mat-slide-toggle')).not.toHaveClass(/mat-mdc-slide-toggle-checked/);

  await button.click();
  await expect(page.locator('[data-toggle-count]')).toHaveText('2');
  await expect(page.locator('[data-change-count]')).toHaveText('0');
  await expect(button).toHaveAttribute('aria-checked', 'false');
});
