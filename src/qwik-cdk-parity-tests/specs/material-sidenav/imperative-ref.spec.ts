import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: `useMatDrawerRef()` — the imperative `open$()`/`close$()`/`toggle$()` handle built
 * on top of `<MatDrawer>`'s existing controlled `opened`/`onOpenedChange$` API (see
 * `use-mat-drawer-ref.ts`). No Angular mirror: upstream's `MatDrawer.open()`/`close()`/
 * `toggle()` are plain TS methods with no DOM footprint to diff against — what this spec
 * verifies is this port's own `Promise<MatDrawerToggleResult>` contract and that the hook
 * coexists with (fires through) the drawer's regular `onOpened$`/`onClosed$` events.
 */
test('material-sidenav/imperative-ref — open$/close$/toggle$ resolve with the settled result and fire the usual events', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-sidenav/imperative-ref/`);
  await page.waitForSelector('[data-scenario-ready]');

  const drawer = page.locator('[data-parity-root] mat-drawer');
  const lastResult = page.locator('[data-last-result]');
  const openedCount = page.locator('[data-opened-count]');
  const closedCount = page.locator('[data-closed-count]');
  const openedSignal = page.locator('[data-opened-signal]');

  await expect(drawer).not.toHaveClass(/mat-drawer-opened/);
  await expect(openedSignal).toHaveText('false');

  // open$() resolves 'open' once the drawer has settled, and the regular onOpened$ event fires.
  await page.locator('#open-btn').click();
  await expect(lastResult).toHaveText('open');
  await expect(drawer).toHaveClass(/mat-drawer-opened/);
  await expect(openedSignal).toHaveText('true');
  await expect(openedCount).toHaveText('1');
  await expect(closedCount).toHaveText('0');

  // A call while already at the requested state resolves immediately with no transition.
  await page.locator('#open-btn').click();
  await expect(lastResult).toHaveText('open');
  await expect(openedCount).toHaveText('1');

  // close$() resolves 'close' and fires onClosed$.
  await page.locator('#close-btn').click();
  await expect(lastResult).toHaveText('close');
  await expect(drawer).not.toHaveClass(/mat-drawer-opened/);
  await expect(openedSignal).toHaveText('false');
  await expect(closedCount).toHaveText('1');

  // toggle$() flips from closed -> open.
  await page.locator('#toggle-btn').click();
  await expect(lastResult).toHaveText('open');
  await expect(drawer).toHaveClass(/mat-drawer-opened/);
  await expect(openedCount).toHaveText('2');

  // toggle$() again flips back open -> closed.
  await page.locator('#toggle-btn').click();
  await expect(lastResult).toHaveText('close');
  await expect(drawer).not.toHaveClass(/mat-drawer-opened/);
  await expect(closedCount).toHaveText('2');
});
