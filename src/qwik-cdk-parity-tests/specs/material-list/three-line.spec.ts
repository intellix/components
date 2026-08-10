import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/three-line — item min-height ≈ 88px via :has() selector', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-list/three-line/`);
  await page.waitForSelector('[data-scenario-ready]');

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(3);

  const firstBox = await items.first().boundingBox();
  expect(firstBox).not.toBeNull();
  expect(Math.abs(firstBox!.height - 88)).toBeLessThan(4);
});
