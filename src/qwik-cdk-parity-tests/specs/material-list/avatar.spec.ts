import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/avatar — avatar at grid column 1 (leftmost), title right of it, border-radius: 50%', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/avatar/`);
  await page.waitForSelector('[data-scenario-ready]');

  const firstItem = page.locator('mat-list-item').first();
  const avatar = firstItem.locator('.mat-mdc-list-item-avatar');
  const title = firstItem.locator('.mat-mdc-list-item-title');

  await expect(avatar).toBeVisible();
  await expect(title).toBeVisible();

  // Avatar computed border-radius = 50%.
  const borderRadius = await avatar.evaluate(el => getComputedStyle(el).borderRadius);
  expect(borderRadius).toMatch(/50%|20px/); // 50% may resolve to px based on size

  // Avatar bounding-box left of title (grid column 1 vs column 2).
  const avatarBox = await avatar.boundingBox();
  const titleBox = await title.boundingBox();
  expect(avatarBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(avatarBox!.x).toBeLessThan(titleBox!.x);
});
