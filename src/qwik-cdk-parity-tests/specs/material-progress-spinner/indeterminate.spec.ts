import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/indeterminate — .mdc-circular-progress--indeterminate class + no aria-valuenow + determinate circle has no stroke-dashoffset', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/indeterminate/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toHaveClass(/mdc-circular-progress--indeterminate/);
  await expect(spinner).toHaveAttribute('mode', 'indeterminate');
  await expect(spinner).not.toHaveAttribute('aria-valuenow', /./);

  // Determinate container still renders (both containers always present).
  await expect(spinner.locator('.mdc-circular-progress__determinate-container')).toBeAttached();

  // Determinate circle's inline style OMITS stroke-dashoffset in indeterminate mode.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).not.toHaveAttribute('style', /stroke-dashoffset:/);

  // 3 clipper divs inside the indeterminate container.
  await expect(
    spinner.locator('.mdc-circular-progress__circle-clipper.mdc-circular-progress__circle-left'),
  ).toBeAttached();
  await expect(spinner.locator('.mdc-circular-progress__gap-patch')).toBeAttached();
  await expect(
    spinner.locator('.mdc-circular-progress__circle-clipper.mdc-circular-progress__circle-right'),
  ).toBeAttached();
});
