import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-bar/determinate — mode="determinate" value=75, aria-valuenow=75, primary bar transform scaleX(0.75)', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-bar/determinate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const bar = page.locator('mat-progress-bar');
  await expect(bar).toHaveAttribute('mode', 'determinate');
  await expect(bar).toHaveAttribute('aria-valuenow', '75');
  await expect(bar).not.toHaveClass(/mdc-linear-progress--indeterminate/);

  const primary = bar.locator('.mdc-linear-progress__primary-bar');
  await expect(primary).toHaveAttribute('style', /scaleX\(0\.75\)/);
});
