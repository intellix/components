import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/determinate — mode="determinate" value=75, aria-valuenow=75, determinate circle has stroke-dashoffset inline style', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/determinate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toHaveAttribute('mode', 'determinate');
  await expect(spinner).toHaveAttribute('aria-valuenow', '75');
  await expect(spinner).not.toHaveClass(/mdc-circular-progress--indeterminate/);

  // Determinate circle carries a computed stroke-dashoffset value in its inline style.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).toBeAttached();
  await expect(determinateCircle).toHaveAttribute('style', /stroke-dashoffset:/);
});
