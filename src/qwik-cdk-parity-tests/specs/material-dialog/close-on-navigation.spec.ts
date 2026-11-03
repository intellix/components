import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers `closeOnNavigation` (default `true`, like upstream): closes the
 * dialog when the user navigates back/forward in history (`popstate`),
 * not on every link click. `closeOnNavigation: false` opts out.
 */
test.describe('Material Dialog — closeOnNavigation', () => {
  test('default: closes on history.back() after a pushState', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-on-navigation`);
    await page.locator('.open-default-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.evaluate(() => history.pushState({}, '', location.pathname + '#navigated'));
    await page.evaluate(() => history.back());

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
  });

  test('default: closes on a hashchange', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-on-navigation`);
    await page.locator('.open-default-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.evaluate(() => {
      location.hash = 'changed';
    });

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0);
  });

  test('closeOnNavigation: false — stays open on history.back()', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-on-navigation`);
    await page.locator('.open-disabled-button').click();
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.evaluate(() => history.pushState({}, '', location.pathname + '#navigated'));
    await page.evaluate(() => history.back());

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });
});
