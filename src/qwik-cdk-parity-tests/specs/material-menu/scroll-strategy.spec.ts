import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers configuring a menu's scroll strategy (upstream
 * `MAT_MENU_SCROLL_STRATEGY`), previously hard-coded to `reposition`.
 */
test.describe('Material Menu — scroll strategy configuration', () => {
  // The DEFAULT path (no custom descriptor) still opens correctly and uses the
  // same reposition strategy as before this change — no regression.
  test('menu still opens normally when no custom scroll-strategy descriptor is configured', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-menu/scroll-strategy-block`);
    await page.locator('.menu-trigger').click();
    await expect(page.locator('.mat-mdc-menu-panel')).toBeVisible();
  });

  // Was a KNOWN GAP (see menu/SYNC.md's "scroll-strategy configuration"
  // entry): a plain `() => ScrollStrategy` factory captured via useContext()
  // during the opener's render did not survive into the later-invoked open$
  // QRL after a real SSR->CSR resume boundary. Fixed by replacing the
  // function factory with a serializable `ScrollStrategyDescriptor`
  // ('block', here) — plain data survives the resume. A fresh `page.goto`
  // (real page load, real resume boundary) + an actual trigger interaction
  // is required to exercise this; asserting on module-level state would not
  // catch the regression this test guards against.
  test('matMenuScrollStrategy="block" switches the panel to the block strategy after a real page load', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-menu/scroll-strategy-block`);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);
    await page.locator('.menu-trigger').click();
    await expect(page.locator('.mat-mdc-menu-panel')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/cdk-global-scrollblock/);
  });
});
