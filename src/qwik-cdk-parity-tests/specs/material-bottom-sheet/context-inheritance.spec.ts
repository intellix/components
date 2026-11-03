import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/** Bottom-sheet counterpart of material-dialog/context-inheritance.spec.ts. */
test.describe('Material Bottom Sheet — context reaches overlay content', () => {
  test('a form field inside the sheet picks up appearance from a provider placed inside QwikCdkRoot', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-bottom-sheet/context-inheritance`);
    await page.locator('.open-button').click();

    const formField = page.locator('mat-bottom-sheet-container mat-form-field');
    await expect(formField).toBeVisible();
    await expect(formField).toHaveClass(/mat-form-field-appearance-outline/);
    await expect(formField).not.toHaveClass(/mat-form-field-appearance-fill/);
  });
});
