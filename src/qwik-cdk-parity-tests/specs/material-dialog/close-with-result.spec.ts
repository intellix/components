import {test, expect} from '@playwright/test';

/**
 * Single-side DOM assertions against the qwik-material dev-app at http://localhost:4173.
 * Covers the dialog close-with-result flow: the value passed to MatDialogClose[result]
 * must be surfaced in the page after the dialog closes.
 */
test.describe('Material Dialog — close with result', () => {
  test('emits the close result to the opener', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/close-with-result');

    // Wait for the page to be ready.
    await page.waitForSelector('[data-scenario-ready]');

    // The trigger button opens the dialog.
    await page.locator('button.open-button').click();

    // Dialog must appear.
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();

    // Click the MatDialogClose button (result="hello world").
    await page.locator('.mat-mdc-dialog-container button').first().click();

    // Container must detach.
    await expect(container).toHaveCount(0, {timeout: 1000});

    // The opener must render the close result.
    await expect(page.locator('[data-result]')).toHaveText('hello world');
  });
});
