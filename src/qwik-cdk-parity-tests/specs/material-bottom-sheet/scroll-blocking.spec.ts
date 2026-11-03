import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/** Bottom-sheet counterpart of material-dialog/scroll-blocking.spec.ts. */
test.describe('Material Bottom Sheet — scroll blocking', () => {
  test('background scroll is blocked while the sheet is open (after a real page load)', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/scroll-blocking`);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);

    await page.locator('.open-button').click();
    await expect(page.locator('mat-bottom-sheet-container')).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/cdk-global-scrollblock/);

    await page.keyboard.press('Escape');
    await expect(page.locator('mat-bottom-sheet-container')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/cdk-global-scrollblock/);
  });
});
