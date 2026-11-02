import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-header — <mat-card-header> + avatar + text-wrapper', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-header/`);
  await page.waitForSelector('[data-scenario-ready]');

  const header = page.locator('mat-card-header');
  await expect(header).toBeVisible();
  await expect(header).toHaveClass(/mat-mdc-card-header/);

  // Avatar renders as <img> with the avatar class
  const avatar = header.locator('img.mat-mdc-card-avatar');
  await expect(avatar).toBeVisible();
  await expect(avatar).toHaveAttribute('src', /placehold\.co/);

  // Title + subtitle wrapped in .mat-mdc-card-header-text div
  const wrapper = header.locator('div.mat-mdc-card-header-text');
  await expect(wrapper).toBeVisible();
  await expect(wrapper.locator('mat-card-title')).toHaveText('With header');
  await expect(wrapper.locator('mat-card-subtitle')).toHaveText(/Avatar/);
});
