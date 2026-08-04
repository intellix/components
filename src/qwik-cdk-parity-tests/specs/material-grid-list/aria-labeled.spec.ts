import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-grid-list/aria-labeled — role="list" on container + role="listitem" + aria-label on tiles', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-grid-list/aria-labeled/`);
  await page.waitForSelector('[data-scenario-ready]');

  const list = page.locator('mat-grid-list');
  await expect(list).toHaveAttribute('role', 'list');
  await expect(list).toHaveAttribute('aria-label', 'Photo grid');

  const tiles = page.locator('mat-grid-tile');
  await expect(tiles).toHaveCount(3);
  await expect(tiles.nth(0)).toHaveAttribute('role', 'listitem');
  await expect(tiles.nth(0)).toHaveAttribute('aria-label', 'Photo 1');
  await expect(tiles.nth(1)).toHaveAttribute('role', 'listitem');
  await expect(tiles.nth(2)).toHaveAttribute('role', 'listitem');
});
