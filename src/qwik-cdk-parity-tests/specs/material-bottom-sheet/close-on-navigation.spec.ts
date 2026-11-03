import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/** Bottom-sheet counterpart of material-dialog/close-on-navigation.spec.ts. */
test.describe('Material Bottom Sheet — closeOnNavigation', () => {
  test('default: closes on history.back() after a pushState', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/close-on-navigation`);
    await page.locator('.open-default-button').click();
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();

    await page.evaluate(() => history.pushState({}, '', location.pathname + '#navigated'));
    await page.evaluate(() => history.back());

    await expect(page.locator('mat-bottom-sheet-container')).toHaveCount(0);
  });

  test('closeOnNavigation: false — stays open on history.back()', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/close-on-navigation`);
    await page.locator('.open-disabled-button').click();
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();

    await page.evaluate(() => history.pushState({}, '', location.pathname + '#navigated'));
    await page.evaluate(() => history.back());

    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();
  });
});
