import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Single-side DOM assertions against the qwik-material dev-app.
 * These tests do NOT cross-compare with Angular Material — MDC class structure diverges
 * enough from CDK that structural parity is not meaningful here.
 */
test.describe('Material Dialog — basic', () => {
  test('opens with the mat-dialog-container tag and the MDC container class', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/basic`);
    await expect(page.locator('mat-dialog-container.mat-mdc-dialog-container')).toBeVisible();
  });

  test('applies mdc-dialog--open once the enter animation completes', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/basic`);
    // Enter animation is ~150 ms; wait up to 500 ms for the open class to land.
    await expect(page.locator('.mdc-dialog--open')).toBeVisible({timeout: 500});
  });

  test('has aria-modal=false and role=dialog by default', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/basic`);
    const container = page.locator('mat-dialog-container.mat-mdc-dialog-container');
    // Matches upstream MatDialogConfig.ariaModal's default of `false` — see
    // qwik-material/dialog/SYNC.md's "DOM parity remediation" entry.
    await expect(container).toHaveAttribute('aria-modal', 'false');
    await expect(container).toHaveAttribute('role', 'dialog');
  });
});
