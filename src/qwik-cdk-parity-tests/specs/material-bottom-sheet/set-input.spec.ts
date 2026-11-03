import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Bottom-sheet counterpart of material-dialog/set-input.spec.ts — covers
 * `MatBottomSheetConfig.componentProps` + `MatBottomSheetRef.setInput`.
 */
test.describe('Material Bottom Sheet — componentProps / setInput', () => {
  test('componentProps seeds the initial render; setInput updates it reactively', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/set-input`);
    await page.locator('.open-button').click();
    await expect(page.locator('[data-label]')).toHaveText('initial');

    await page.locator('.update-button').click();
    await expect(page.locator('[data-label]')).toHaveText('updated');
  });
});
