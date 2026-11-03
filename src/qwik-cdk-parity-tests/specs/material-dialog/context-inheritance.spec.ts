import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Covers context reaching overlay content: qwik-material configuration
 * contexts visible where `useMatDialog()` is called (inside a
 * `<QwikMaterialProvider>` placed anywhere inside `<QwikCdkRoot>`) are
 * automatically carried into the dialog's own content, which otherwise
 * renders as a SIBLING of the opener under `<QwikCdkRoot>`, not a
 * descendant of that provider.
 */
test.describe('Material Dialog — context reaches overlay content', () => {
  test('a form field inside the dialog picks up appearance from a provider placed inside QwikCdkRoot', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/mat-dialog/context-inheritance`);
    await page.locator('.open-button').click();

    const formField = page.locator('mat-dialog-container mat-form-field');
    await expect(formField).toBeVisible();
    await expect(formField).toHaveClass(/mat-form-field-appearance-outline/);
    await expect(formField).not.toHaveClass(/mat-form-field-appearance-fill/);
  });

  test('config.context opts in an app context into the dialog content', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/custom-context-opt-in`);
    await page.locator('.open-button').click();

    await expect(page.locator('[data-theme-label]')).toHaveText('dark');
  });
});
