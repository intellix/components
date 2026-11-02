import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: upstream's `MAT_SORT_DEFAULT_OPTIONS.disableClear` (ported to
 * `MatSortConfig.disableClear`) has no Angular mirror scenario. Upstream
 * unit test precedent: the "with default options" describe block in
 * sort.spec.ts sets `MAT_SORT_DEFAULT_OPTIONS = {disableClear: true}` with
 * no explicit `[matSortDisableClear]`/per-header `disableClear` input bound,
 * then asserts the cycle is `['asc', 'desc']` — never `''` — for either
 * start point. Mirrors `specs/material-sort/disable-clear.spec.ts`'s
 * Angular-mirrored sibling scenario (`matSortDisableClear` bound directly),
 * just sourced from the provider instead.
 */
test('material-sort/config-default-disable-clear — provider matSortConfig.disableClear applies with no per-table/-header override', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-sort/config-default-disable-clear/`);
  await page.waitForSelector('[data-scenario-ready]');

  const header = page.locator('[data-parity-root] th[aria-sort]').first();
  const container = header.locator('.mat-sort-header-container');

  await expect(header).toHaveAttribute('aria-sort', 'none');

  await header.click({force: true});
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(container).toHaveClass(/mat-sort-header-ascending/);

  await header.click({force: true});
  await expect(header).toHaveAttribute('aria-sort', 'descending');
  await expect(container).toHaveClass(/mat-sort-header-descending/);

  // Cycle never reaches '' — disableClear from the provider still applies.
  await header.click({force: true});
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await expect(container).not.toHaveClass(/mat-sort-header-recently-cleared/);
});
