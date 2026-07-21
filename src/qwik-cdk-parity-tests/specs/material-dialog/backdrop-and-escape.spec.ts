import {test, expect} from '@playwright/test';

/**
 * Single-side DOM assertions against the qwik-material dev-app at http://localhost:4173.
 * Covers backdrop-click close, Escape-key close, and the disableClose option.
 */
test.describe('Material Dialog — backdrop and escape', () => {
  test('close-on-backdrop: clicking the backdrop detaches the container', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/close-on-backdrop');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.locator('.cdk-overlay-backdrop').click();

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0, {
      timeout: 500,
    });
  });

  test('close-on-escape: pressing Escape detaches the container', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/close-on-escape');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toHaveCount(0, {
      timeout: 500,
    });
  });

  test('disable-close: Escape does not close the dialog', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/disable-close');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.keyboard.press('Escape');

    // Dialog must still be open after Escape.
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });

  test('disable-close: backdrop click does not close the dialog', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/disable-close');
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();

    await page.locator('.cdk-overlay-backdrop').click();

    // Dialog must still be open after backdrop click.
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });
});
