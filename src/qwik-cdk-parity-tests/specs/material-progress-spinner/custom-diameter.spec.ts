import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/custom-diameter — diameter=40 reflected in inline width/height/CSS-custom-props', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/custom-diameter/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('style', /width:\s*40px/);
  await expect(spinner).toHaveAttribute('style', /height:\s*40px/);
  await expect(spinner).toHaveAttribute('style', /--mat-progress-spinner-size:\s*40px/);
  await expect(spinner).toHaveAttribute(
    'style',
    /--mat-progress-spinner-active-indicator-width:\s*40px/,
  );
});
