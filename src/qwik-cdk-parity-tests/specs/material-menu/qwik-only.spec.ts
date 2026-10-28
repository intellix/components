import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: behaviour `angular-parity.spec.ts` doesn't exercise.
 *
 * - Typeahead (`createFocusKeyManager(...).withTypeAhead()`, wired up in
 *   `menu-runtime.ts`'s `openMenu`) — no Angular-mirrored scenario drives a
 *   letter key, since none of `angular-parity.spec.ts`'s own interactions
 *   need it.
 * - `restoreFocus={false}` (mirrors `[matMenuTriggerRestoreFocus]="false"`)
 *   — upstream's own menu.spec.ts covers this ("should be able to disable
 *   focus restoration"), but no Angular DOM-parity scenario does, since
 *   focus restoration isn't itself observable in static DOM structure.
 * - `onMenuOpened$`/`onMenuClosed$` callbacks.
 */
test.describe('material-menu — qwik-only', () => {
  test('typeahead: pressing a letter key after opening selects the matching item', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-menu/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const trigger = page.locator('[data-parity-root] .menu-trigger').nth(0);
    await trigger.click();
    await page.waitForSelector('.mat-mdc-menu-item');

    // Opening auto-focuses "Apple" (the first item). Typing "B" should move
    // the active item to "Banana" without opening/closing anything.
    await page.keyboard.press('B');
    await page.waitForFunction(() => document.activeElement?.textContent?.trim() === 'Banana');
    await expect(page.locator(':focus')).toHaveText('Banana');

    await page.keyboard.press('Escape');
  });

  test('restoreFocus={false}: closing the menu leaves focus wherever it already was', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-menu/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const trigger = page.locator('.no-restore-trigger');
    const elsewhere = page.locator('.focus-target');

    await trigger.click();
    await page.waitForSelector('.mat-mdc-menu-item');
    // Move focus away from the menu BEFORE closing it, same way the real
    // no-backdrop parity scenario's "click outside" step does — Escape
    // itself doesn't move focus, so without this the trigger would already
    // be focused regardless of restoreFocus.
    await elsewhere.focus();
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelectorAll('.mat-mdc-menu-panel').length === 0);

    await expect(elsewhere).toBeFocused();
    await expect(trigger).not.toBeFocused();
  });

  test('onMenuOpened$/onMenuClosed$ fire exactly once per open/close cycle', async ({page}) => {
    await page.goto(`${BASE_URL}/mat-menu/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const trigger = page.locator('.callbacks-trigger');
    const openedCount = page.locator('[data-opened-count]');
    const closedCount = page.locator('[data-closed-count]');

    await expect(openedCount).toHaveText('0');
    await expect(closedCount).toHaveText('0');

    await trigger.click();
    await page.waitForSelector('.mat-mdc-menu-item');
    await expect(openedCount).toHaveText('1');
    await expect(closedCount).toHaveText('0');

    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.querySelectorAll('.mat-mdc-menu-panel').length === 0);
    await expect(openedCount).toHaveText('1');
    await expect(closedCount).toHaveText('1');

    await trigger.click();
    await page.waitForSelector('.mat-mdc-menu-item');
    await expect(openedCount).toHaveText('2');
  });
});
