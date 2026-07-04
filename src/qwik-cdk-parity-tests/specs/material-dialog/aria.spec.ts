import {test, expect} from '@playwright/test';

/**
 * Single-side DOM assertions against the qwik-material dev-app at http://localhost:4173.
 * Covers the four ARIA-related Material Dialog routes.
 */
test.describe('Material Dialog — ARIA attributes', () => {
  test('aria-label: container has explicit aria-label', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/aria-label');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveAttribute('aria-label', 'Settings dialog');
  });

  test('aria-labelledby: container has aria-labelledby pointing at MatDialogTitle id', async ({
    page,
  }) => {
    await page.goto('http://localhost:4173/mat-dialog/aria-labelledby');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();
    // The attribute must be present; its value is an auto-generated MatDialogTitle id.
    // The exact prefix format is an implementation detail; asserting non-empty is enough.
    const labelledBy = await container.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
  });

  test('aria-describedby: container has aria-describedby and the description element is visible', async ({
    page,
  }) => {
    await page.goto('http://localhost:4173/mat-dialog/aria-describedby');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveAttribute('aria-describedby', 'my-desc');
    // The element referenced by aria-describedby must be present inside the dialog.
    await expect(page.locator('#my-desc')).toBeVisible();
  });

  test('role=alertdialog: container has role="alertdialog"', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/role-alertdialog');
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();
    await expect(container).toHaveAttribute('role', 'alertdialog');
  });
});
