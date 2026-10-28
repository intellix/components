import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: upstream's `MAT_SORT_DEFAULT_OPTIONS.arrowPosition` (ported to
 * `MatSortConfig.arrowPosition`) has no Angular mirror scenario. Upstream
 * unit test precedent: the "with default arrowPosition" describe block in
 * sort.spec.ts sets `MAT_SORT_DEFAULT_OPTIONS = {arrowPosition: 'before'}`
 * with no per-header `[arrowPosition]` bound, then asserts EVERY header's
 * container gets `mat-sort-header-position-before`. Mirrors
 * `specs/material-sort/arrow-position-before.spec.ts`'s Angular-mirrored
 * sibling scenario (per-header `arrowPosition="before"` prop), just sourced
 * from the provider and applied to every header instead of one.
 */
test('material-sort/config-default-arrow-position — provider matSortConfig.arrowPosition applies to every header with no per-header override', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-sort/config-default-arrow-position/`);
  await page.waitForSelector('[data-scenario-ready]');

  const containers = page.locator('[data-parity-root] .mat-sort-header-container');
  await expect(containers).toHaveCount(2);
  await expect(containers.nth(0)).toHaveClass(/mat-sort-header-position-before/);
  await expect(containers.nth(1)).toHaveClass(/mat-sort-header-position-before/);
});
