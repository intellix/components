import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Clicks fired back-to-back right after load, while the handler chunks are
 * still loading, can resume out of order. Upstream updates synchronously, so
 * the outcome must match it: every multi-select click counts, and in
 * single-select mode the last click wins. Several fresh loads per test because
 * the race only shows up some of the time.
 */
async function load(page: Page, scenario: string) {
  await page.goto(`${BASE_URL}/mat-button-toggle/${scenario}/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  return page.locator('mat-button-toggle button.mat-button-toggle-button');
}

test('multi-select keeps every rapid click', async ({page}) => {
  for (let i = 0; i < 5; i++) {
    const buttons = await load(page, 'multi');
    await buttons.nth(0).click({force: true});
    await buttons.nth(1).click({force: true});
    await expect(buttons.nth(0)).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.nth(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'false');
  }
});

test('single-select ends on the last rapid click', async ({page}) => {
  for (let i = 0; i < 5; i++) {
    const buttons = await load(page, 'basic');
    await buttons.nth(0).click({force: true});
    await buttons.nth(2).click({force: true});
    await expect(buttons.nth(2)).toHaveAttribute('aria-checked', 'true');
    await expect(buttons.nth(0)).toHaveAttribute('aria-checked', 'false');
    await expect(page.locator('p')).toHaveText('Selected: underline');
  }
});
