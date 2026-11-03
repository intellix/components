import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Functional (Qwik-only, no Angular comparison) coverage for the
 * backdropClick-fires-regardless-of-disableClose fix: upstream
 * `MatBottomSheetRef.backdropClick()` always emits on a backdrop click, even
 * when `disableClose` is true. Also covers mutating
 * `matBottomSheetRef.disableClose` after open.
 */
test.describe('Material Bottom Sheet — backdropClick fires regardless of disableClose', () => {
  test('onBackdropClick$ fires on every backdrop click while disableClose is true, but the sheet stays open', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/backdrop-click-always`);
    await page.locator('.open-button').click();
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();
    await expect(page.locator('[data-count]')).toHaveText('0');

    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});
    await expect(page.locator('[data-count]')).toHaveText('1');
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();

    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});
    await expect(page.locator('[data-count]')).toHaveText('2');
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();
  });

  test('mutating matBottomSheetRef.disableClose after open takes effect on the next backdrop click', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/backdrop-click-always`);
    await page.locator('.open-button').click();
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();

    await page.locator('.allow-close-button').click();
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});

    await expect(page.locator('[data-count]')).toHaveText('1');
    await expect(page.locator('mat-bottom-sheet-container')).toHaveCount(0);
  });
});
