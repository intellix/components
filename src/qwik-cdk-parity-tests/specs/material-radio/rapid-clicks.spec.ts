import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Clicks fired back-to-back right after load, while the onChange$ handler
 * chunk is still loading, can have their *handler invocations* resume out
 * of order even though the browser already settled the native DOM
 * synchronously on the last click. Without `MatRadioGroup`'s event-time
 * guard, an out-of-order-resumed earlier click's handler would push a stale
 * `value` back down through context, forcibly re-checking the wrong radio.
 * The outcome must match upstream's synchronous model: the last click wins.
 * Several fresh loads per test because the race only shows up some of the
 * time. Mirrors `specs/material-button-toggle/rapid-clicks.spec.ts`.
 */
async function load(page: Page, scenario: string) {
  await page.goto(`${BASE_URL}/mat-radio/${scenario}/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  return page.locator('mat-radio-button input[type="radio"]');
}

test('single-select group ends on the last rapid click', async ({page}) => {
  for (let i = 0; i < 5; i++) {
    const inputs = await load(page, 'basic');
    await inputs.nth(0).click({force: true});
    await inputs.nth(2).click({force: true});
    await expect(page.locator('p')).toHaveText('Selected: summer');
    await expect(inputs.nth(2)).toHaveJSProperty('checked', true);
    await expect(inputs.nth(0)).toHaveJSProperty('checked', false);
  }
});

test('standalone buttons sharing a name end on the last rapid click', async ({page}) => {
  for (let i = 0; i < 5; i++) {
    const inputs = await load(page, 'standalone');
    await inputs.nth(1).click({force: true}); // chocolate
    await inputs.nth(0).click({force: true}); // vanilla
    await expect(page.locator('p')).toHaveText('Selected: vanilla');
    await expect(inputs.nth(0)).toHaveJSProperty('checked', true);
    await expect(inputs.nth(1)).toHaveJSProperty('checked', false);
  }
});
