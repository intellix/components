import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * A sidenav container that starts off-screen must still enable transitions (upstream's
 * constructor timer adds `mat-drawer-transition` ~200ms after creation, visible or not), so the
 * first open animates. See the `mat-sidenav/offscreen-container` scenario's doc comment.
 */
test('an initially off-screen sidenav container still animates its first open', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-sidenav/offscreen-container/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  const container = page.locator('mat-drawer-container');
  await expect(container).toHaveClass(/mat-drawer-transition/, {timeout: 2000});

  // Record every class the drawer ever has from the click onwards.
  await page.evaluate(() => {
    const drawer = document.querySelector('mat-drawer')!;
    const seen = ((window as unknown as {seenDrawerClasses: string[]}).seenDrawerClasses = []);
    new MutationObserver(() => seen.push(drawer.className)).observe(drawer, {
      attributes: true,
      attributeFilter: ['class'],
    });
  });
  await page.click('#open-drawer');
  const drawer = page.locator('mat-drawer');
  await expect(drawer).toHaveClass(/mat-drawer-opened/, {timeout: 3000});
  await expect(drawer).not.toHaveClass(/mat-drawer-animating/, {timeout: 3000});
  const seen = await page.evaluate(
    () => (window as unknown as {seenDrawerClasses: string[]}).seenDrawerClasses,
  );
  expect(seen.some(classes => classes.includes('mat-drawer-animating'))).toBe(true);
});
