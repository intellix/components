import {test, expect} from '@playwright/test';

/**
 * Single-side DOM assertions against the qwik-material dev-app at http://localhost:4173.
 * These tests do NOT cross-compare with Angular Material — MDC class structure diverges
 * enough from CDK that structural parity is not meaningful here.
 */
test.describe('Material Dialog — basic', () => {
  test('opens with the MDC container class', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/basic');
    await expect(page.locator('.mat-mdc-dialog-container')).toBeVisible();
  });

  test('applies mdc-dialog--open once the enter animation completes', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/basic');
    // Enter animation is ~150 ms; wait up to 500 ms for the open class to land.
    await expect(page.locator('.mdc-dialog--open')).toBeVisible({timeout: 500});
  });

  test('has aria-modal=true and role=dialog by default', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/basic');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toHaveAttribute('aria-modal', 'true');
    await expect(container).toHaveAttribute('role', 'dialog');
  });
});
