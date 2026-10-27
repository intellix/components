import {test, expect} from '@playwright/test';

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Single-side DOM assertions against the qwik-material dev-app.
 * Covers the restoreFocus option: focus should move into the dialog on open and return
 * to the trigger element on close.
 */
test.describe('Material Dialog — restore focus', () => {
  test('focus enters the dialog on open and returns to the trigger on close', async ({page}) => {
    await page.goto(`${QWIK_URL}/mat-dialog/restore-focus`);

    // The route renders a manual trigger; wait for it to be ready.
    await page.waitForSelector('[data-scenario-ready]');

    const trigger = page.locator('button.restore-trigger');
    await expect(trigger).toBeVisible();

    // Open the dialog by clicking the trigger.
    await trigger.click();

    // Container must appear.
    const container = page.locator('mat-dialog-container.mat-mdc-dialog-container');
    await expect(container).toBeVisible();

    // Active element must be a descendant of the container.
    const focusInsideDialog = await page.evaluate(() => {
      const active = document.activeElement;
      const cont = document.querySelector('mat-dialog-container.mat-mdc-dialog-container');
      return cont !== null && cont.contains(active);
    });
    expect(focusInsideDialog).toBe(true);

    // Close via MatDialogClose, matched by its visible text. The real
    // MatDialogClose directive adds no class of its own (fixed 2026-10-27 —
    // see qwik-material/dialog/SYNC.md), so a class-based selector can't
    // disambiguate it from the "Focus me" button that appears first in the
    // body; text matching works regardless of binding/class details.
    await page.getByRole('button', {name: 'Close', exact: true}).click();

    // Container must detach.
    await expect(container).toHaveCount(0);

    // Focus must have returned to the trigger.
    const focusOnTrigger = await page.evaluate(() => {
      const active = document.activeElement;
      const trig = document.querySelector('button.restore-trigger');
      return active === trig;
    });
    expect(focusOnTrigger).toBe(true);
  });
});
