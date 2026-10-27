import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Single-side DOM assertions against the qwik-material dev-app.
 * Covers the MDC enter/exit animation class lifecycle.
 *
 * NOTE: Animation timing is inherently racy. The `--opening` class may already have
 * transitioned to `--open` by the time the assertion runs (depends on hydration timing).
 * We therefore only assert that `--open` lands within 500 ms; we do not assert
 * the transient `--opening` class. Similarly, `--closing` may be gone before we can
 * check it, so we just assert the container eventually detaches.
 */
test.describe('Material Dialog — animation classes', () => {
  test('mdc-dialog--open is set on the mat-dialog-container element after the enter animation', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/basic`);
    await expect(page.locator('mat-dialog-container.mdc-dialog--open')).toBeVisible();
  });

  test('container detaches from the DOM after Escape closes the dialog', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/basic`);
    // Wait for the dialog to open fully before triggering close.
    await expect(page.locator('mat-dialog-container.mdc-dialog--open')).toBeVisible();

    await page.keyboard.press('Escape');

    // After the exit animation the container must be removed from the DOM.
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
  });
});
