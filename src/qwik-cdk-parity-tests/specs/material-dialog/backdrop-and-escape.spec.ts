import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Single-side DOM assertions against the qwik-material dev-app.
 * Covers backdrop-click close, Escape-key close, and the disableClose option.
 */
test.describe('Material Dialog — backdrop and escape', () => {
  test('close-on-backdrop: clicking the backdrop detaches the container', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-on-backdrop`);
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    // Click near a corner, not the (Playwright-default) center: the backdrop
    // spans the full viewport and the dialog pane is centered, so a
    // default-position click lands on the pane's own content, not the
    // backdrop — correctly not closing anything, but not exercising this
    // test's actual behavior either.
    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0, {
      timeout: 500,
    });
  });

  test('close-on-escape: pressing Escape detaches the container', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/close-on-escape`);
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0, {
      timeout: 500,
    });
  });

  test('disable-close: Escape does not close the dialog', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/disable-close`);
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.keyboard.press('Escape');

    // Dialog must still be open after Escape.
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });

  test('disable-close: backdrop click does not close the dialog', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/disable-close`);
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true});

    // Dialog must still be open after backdrop click.
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });
});
