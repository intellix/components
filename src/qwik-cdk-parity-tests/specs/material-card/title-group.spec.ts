import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/title-group — <mat-card-title-group> with q:slot structure', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/title-group/`);
  await page.waitForSelector('[data-scenario-ready]');

  const group = page.locator('mat-card-title-group');
  await expect(group).toBeVisible();
  await expect(group).toHaveClass(/mat-mdc-card-title-group/);

  // Title + subtitle wrapped in an unclassed div (upstream template)
  const wrapper = group.locator('> div').first();
  await expect(wrapper.locator('mat-card-title')).toHaveText('Title group');
  await expect(wrapper.locator('mat-card-subtitle')).toHaveText(/Title \+ subtitle/);

  // Image renders directly as <img>
  await expect(group.locator('img.mat-mdc-card-image')).toBeVisible();
});
