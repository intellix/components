import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-card/with-actions-end — <mat-card-actions> with align-end class', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-card/with-actions-end/`);
  await page.waitForSelector('[data-scenario-ready]');

  const actions = page.locator('mat-card-actions');
  await expect(actions).toBeVisible();
  await expect(actions).toHaveClass(/mat-mdc-card-actions-align-end/);
});
