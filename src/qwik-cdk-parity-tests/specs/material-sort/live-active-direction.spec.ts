import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: `<MatSort>`'s `active`/`direction` props are LIVE (see `mat-sort.tsx`'s
 * `MatSortProps.active` doc comment) — upstream has no docs example exercising a later
 * `[matSortActive]`/`[matSortDirection]` rebind, so this is a fresh functional spec, not an
 * Angular-mirrored one. Covers:
 *   1. a programmatic prop change (post-resume) updates the header's `aria-sort`/direction
 *      classes, matching upstream's `ngOnChanges()`-driven template rebind;
 *   2. that programmatic change does NOT emit `onSortChange$` (upstream's `ngOnChanges()` never
 *      calls `sortChange.emit()` — only `sort()`, invoked by a header click/keydown, does);
 *   3. a subsequent header click still toggles correctly AND emits.
 */
test('material-sort/live-active-direction — programmatic active/direction updates the header without emitting sortChange', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-sort/live-active-direction/`);
  await page.waitForSelector('[data-scenario-ready]');

  const nameHeader = page.locator('[data-parity-root] th[mat-sort-header="name"]');
  const populationHeader = page.locator('[data-parity-root] th[mat-sort-header="population"]');
  const changeCount = page.locator('[data-change-count]');
  const sortState = page.locator('[data-sort-state]');

  // Initial props: active=population, direction=desc — no click has happened, so no
  // onSortChange$ has fired yet.
  await expect(populationHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  await expect(changeCount).toHaveText('0');

  // Programmatic prop change (post-resume) — moves the sort to "name"/"asc".
  await page.locator('#set-name-asc').click();
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(populationHeader).toHaveAttribute('aria-sort', 'none');
  await expect(
    nameHeader.locator('.mat-sort-header-container'),
  ).toHaveClass(/mat-sort-header-ascending/);
  // Still zero — a props-driven change never emits onSortChange$.
  await expect(changeCount).toHaveText('0');
  // The displayed `sort` signal (only ever written by onSortChange$) is still blank — confirms
  // the programmatic prop change took a DIFFERENT path than a real sortChange emission would.
  await expect(sortState).toHaveText('');

  // Another programmatic change, back to "population"/"desc".
  await page.locator('#set-population-desc').click();
  await expect(populationHeader).toHaveAttribute('aria-sort', 'descending');
  await expect(nameHeader).toHaveAttribute('aria-sort', 'none');
  await expect(changeCount).toHaveText('0');

  // A real header click still works and DOES emit — clicking "population" (currently
  // desc) advances the cycle to cleared ('').
  await populationHeader.click({force: true});
  await expect(populationHeader).toHaveAttribute('aria-sort', 'none');
  await expect(changeCount).toHaveText('1');
  await expect(sortState).toHaveText('population');

  // Clicking "name" (currently cleared) activates it at its default start ('asc').
  await nameHeader.click({force: true});
  await expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  await expect(changeCount).toHaveText('2');
  await expect(sortState).toHaveText('name asc');
});
