import {test, expect} from '@playwright/test';

/**
 * Functional (not Angular-DOM-parity) coverage for `useCdkCopyToClipboard()` — no Angular
 * reference scenario exists for this brand-new qwik-cdk entry point, so this exercises real
 * browser clipboard behavior directly against the qwik-cdk dev-app, per
 * `qwik-cdk/clipboard/SYNC.md`'s testing note.
 */
const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test.describe('cdk-clipboard — functional', () => {
  test('clicking the trigger copies the configured text', async ({page, context}) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(`${QWIK_URL}/cdk-clipboard/basic/`);
    await page.waitForSelector('[data-scenario-ready]');

    await page.getByTestId('copy-button').click();
    await expect(page.getByTestId('copy-status')).toHaveText('Status: copied');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Hello from qwik-cdk clipboard');
  });
});
