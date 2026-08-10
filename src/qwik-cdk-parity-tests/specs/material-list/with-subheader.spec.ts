import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-list/with-subheader — 2 subheaders + 1 divider + 4 items rendered in correct order', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-list/with-subheader/`);
  await page.waitForSelector('[data-scenario-ready]');

  const subheaders = page.locator('mat-subheader');
  await expect(subheaders).toHaveCount(2);
  await expect(subheaders.nth(0)).toHaveText('Inbox');
  await expect(subheaders.nth(1)).toHaveText('Archive');

  const dividers = page.locator('mat-divider');
  await expect(dividers).toHaveCount(1);

  const items = page.locator('mat-list-item');
  await expect(items).toHaveCount(4);
});
