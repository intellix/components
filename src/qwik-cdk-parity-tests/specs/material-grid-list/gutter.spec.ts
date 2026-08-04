import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/gutter — gutterSize="16px" is applied as CSS gap', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/gutter/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  const gap = await list.evaluate(el => getComputedStyle(el).gap);
  // Computed gap may be reported as "16px" or "16px 16px" depending on browser.
  expect(gap).toContain('16px');
});
