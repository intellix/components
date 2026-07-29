import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-icon/svg-literal — mat-icon in svg mode has data-mat-icon-type=svg, an inner <svg>, no fontIcon attribute, no data-mat-icon-name', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-icon/svg-literal/`);
  await page.waitForSelector('[data-scenario-ready]');

  const icon = page.locator('mat-icon');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute('data-mat-icon-type', 'svg');
  await expect(icon).not.toHaveAttribute('fontIcon', /./);
  await expect(icon).not.toHaveAttribute('data-mat-icon-name', /./);

  const inner = icon.locator('svg');
  await expect(inner).toBeAttached();
  await expect(inner).toHaveAttribute('viewBox', '0 0 24 24');
});
