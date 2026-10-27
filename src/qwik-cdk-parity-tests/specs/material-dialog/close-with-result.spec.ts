import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Single-side DOM assertions against the qwik-material dev-app.
 * Covers the dialog close-with-result flow: the value passed to MatDialogClose[result]
 * must be surfaced in the page after the dialog closes.
 */
test.describe('Material Dialog — close with result', () => {
  test('emits the close result to the opener', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-with-result`);

    // Wait for the page to be ready.
    await page.waitForSelector('[data-scenario-ready]');

    // The trigger button opens the dialog.
    await page.locator('button.open-button').click();

    // Dialog must appear.
    const container = page.locator('mat-dialog-container.mat-mdc-dialog-container');
    await expect(container).toBeVisible();

    // Click the MatDialogClose button (result="hello world").
    await page.locator('mat-dialog-container button[mat-dialog-close]').first().click();

    // Container must detach.
    await expect(container).toHaveCount(0);

    // The opener must render the close result.
    await expect(page.locator('[data-result]')).toHaveText('hello world');
  });
});
