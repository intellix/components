import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/indeterminate — .mdc-linear-progress--indeterminate class + no aria-valuenow + mode attribute reflected', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/indeterminate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveClass(/mdc-linear-progress--indeterminate/);
  await expect(bar).toHaveAttribute('mode', 'indeterminate');
  await expect(bar).not.toHaveAttribute('aria-valuenow', /./);
});
