import {test, expect} from '@playwright/test';

/**
 * Single-side DOM assertions against the qwik-material dev-app at http://localhost:4173.
 * Covers the restoreFocus option: focus should move into the dialog on open and return
 * to the trigger element on close.
 */
test.describe('Material Dialog — restore focus', () => {
  test('focus enters the dialog on open and returns to the trigger on close', async ({page}) => {
    await page.goto('http://localhost:4173/mat-dialog/restore-focus');

    // The route renders a manual trigger; wait for it to be ready.
    await page.waitForSelector('[data-scenario-ready]');

    const trigger = page.locator('button.restore-trigger');
    await expect(trigger).toBeVisible();

    // Open the dialog by clicking the trigger.
    await trigger.click();

    // Container must appear.
    const container = page.locator('.mat-mdc-dialog-container');
    await expect(container).toBeVisible();

    // Active element must be a descendant of the container.
    const focusInsideDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const cont = document.querySelector('.mat-mdc-dialog-container');
      return cont !== null && cont.contains(active);
    });
    expect(focusInsideDialog).toBe(true);

    // Close via MatDialogClose button (rendered as a <button> inside the body).
    await page.locator('.mat-mdc-dialog-container button').first().click();

    // Container must detach.
    await expect(container).toHaveCount(0, {timeout: 1000});

    // Focus must have returned to the trigger.
    const focusOnTrigger = await page.evaluate(() => {
      const active = document.activeElement;
      const trig = document.querySelector('button.restore-trigger');
      return active === trig;
    });
    expect(focusOnTrigger).toBe(true);
  });
});
