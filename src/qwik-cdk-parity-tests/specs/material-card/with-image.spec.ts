import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-image — <img> with mat-mdc-card-image + mdc-card__media', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-card/with-image/`);
  await page.waitForSelector('[data-scenario-ready]');

  const img = page.locator('mat-card img.mat-mdc-card-image');
  await expect(img).toBeVisible();
  await expect(img).toHaveClass(/mdc-card__media/);
  await expect(img).toHaveAttribute('src', /placehold\.co/);
});
