import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers an app building its own overlay directly via `useOverlay()` — the
 * `OVERLAY` context `<QwikCdkRoot>` now provides a working implementation
 * for (previously nothing provided it, so `useOverlay()` would throw) —
 * plus `OverlayRef.backdropClick()` and `OverlayRef.detachments()`.
 */
test.describe('CDK Overlay — useOverlay() / backdropClick / detachments', () => {
  test('creates a real overlay with a backdrop; backdropClick and detachments fire', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/cdk-overlay/basic-create`);

    await page.locator('.open-button').click();
    await expect(page.locator('.overlay-message')).toHaveText('Hello overlay');
    await expect(page.locator('.cdk-overlay-backdrop')).toBeVisible();
    await expect(page.locator('[data-backdrop-clicks]')).toHaveText('0');
    await expect(page.locator('[data-detach-count]')).toHaveText('0');

    // Backdrop click fires the registered callback but does NOT itself
    // close the overlay — this app wired no auto-close behavior.
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});
    await expect(page.locator('[data-backdrop-clicks]')).toHaveText('1');
    await expect(page.locator('.overlay-content')).toBeVisible();

    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});
    await expect(page.locator('[data-backdrop-clicks]')).toHaveText('2');

    await page.locator('.close-button').click();
    await expect(page.locator('.overlay-content')).toHaveCount(0);
    await expect(page.locator('[data-detach-count]')).toHaveText('1');
  });
});
