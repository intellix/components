import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers passing initial props to the opened component
 * (`MatDialogConfig.componentProps`) and updating them later through the
 * ref (`MatDialogRef.setInput`) — the Qwik-idiomatic replacement for
 * upstream's `dialogRef.componentInstance.x = …` /
 * `componentRef.setInput('x', …)`.
 */
test.describe('Material Dialog — componentProps / setInput', () => {
  test('componentProps seeds the initial render; setInput updates it reactively', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/set-input`);
    await page.locator('.open-button').click();
    await expect(page.locator('[data-label]')).toHaveText('initial');

    await page.locator('.update-button').click();
    await expect(page.locator('[data-label]')).toHaveText('updated');
  });
});
