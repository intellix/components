import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers a real bug found while working on scroll-strategy configuration
 * (see `qwik-material/dialog/SYNC.md`'s "scroll strategy lost after
 * resume" entry): `MatDialogConfig.scrollStrategy`'s default
 * (`createBlockScrollStrategy()`, upstream's own default — background
 * scroll is always blocked while a modal dialog is open) was silently
 * MISSING entirely on every dialog opened after a real page load, not
 * just when a custom factory was configured — the context-derived
 * factory, captured during the opener's render, didn't survive into the
 * later-invoked `open$` QRL across the real SSR→CSR resume boundary that
 * every genuine page load goes through.
 */
test.describe('Material Dialog — scroll blocking', () => {
  test('background scroll is blocked while the dialog is open (after a real page load)', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/scroll-blocking`);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.locator('.open-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/cdk-global-scrollblock/);

    await page.keyboard.press('Escape');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);
  });

  // A per-open `MatDialogConfig.scrollStrategy` override (a plain,
  // serializable `ScrollStrategyDescriptor`, `'noop'` here) must also
  // survive a real SSR→CSR resume and actually take effect — not just the
  // context-level default exercised by the case above. See
  // `qwik-material/dialog/SYNC.md`'s "scroll strategy lost after resume"
  // entry for why this needed a real `page.goto` + interaction to catch at
  // all (the underlying bug was specifically about surviving a REAL
  // resume boundary, not just the module's own synchronous logic).
  test('a non-default scrollStrategy override ("noop") does NOT block background scroll (after a real page load)', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/scroll-strategy-noop`);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.locator('.open-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.keyboard.press('Escape');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
  });
});
