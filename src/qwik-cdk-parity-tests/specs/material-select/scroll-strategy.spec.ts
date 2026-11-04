import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers overriding a select's scroll strategy (upstream
 * `MAT_SELECT_SCROLL_STRATEGY`), app-wide via
 * `useMatSelectProvider({scrollStrategy: 'block'})` — this port's
 * own default is `{type: 'reposition'}`. See `select/SYNC.md`'s
 * "Scroll-strategy configuration" entry: the descriptor is plain,
 * serializable data (not a function factory), so it must survive a real
 * SSR→CSR resume and actually reach `openSelectPanel()` — this needs a
 * fresh `page.goto` + a real interaction to exercise at all.
 */
test.describe('Material Select — scroll strategy configuration', () => {
  test('matSelectScrollStrategy="block" blocks background scroll after a real page load', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-select/scroll-strategy-block`);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.locator('[data-parity-root] .mat-mdc-select').click();
    await expect(page.locator('.mat-mdc-select-panel')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/cdk-global-scrollblock/);
  });
});
