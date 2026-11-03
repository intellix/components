import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers `MatDialog.afterAllClosed$` — fires once the open-dialog count
 * reaches zero, not on every individual close.
 */
test.describe('Material Dialog — afterAllClosed$', () => {
  test('fires once, only after the last of several open dialogs closes', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/after-all-closed`);
    await page.locator('.setup-button').click();
    await page.locator('.open-two-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(2);
    await expect(page.locator('[data-fire-count]')).toHaveText('0');

    await page.locator('.close-a-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(1);
    await expect(page.locator('[data-fire-count]')).toHaveText('0');

    await page.locator('.close-b-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
    await expect(page.locator('[data-fire-count]')).toHaveText('1');
  });
});
