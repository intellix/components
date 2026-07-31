import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-progress-spinner/custom-stroke — diameter=40 strokeWidth=3 reflected in inline style + SVG stroke-width%', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-progress-spinner/custom-stroke/`);
  await page.waitForSelector('[data-scenario-ready]');

  const spinner = page.locator('mat-progress-spinner');
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveAttribute('style', /width:\s*40px/);

  // Determinate circle carries the computed stroke-width%.
  // circleStrokeWidthPct(40, 3) = (3/40)*100 = 7.5%.
  const determinateCircle = spinner.locator('.mdc-circular-progress__determinate-circle');
  await expect(determinateCircle).toHaveAttribute('style', /stroke-width:\s*7\.5%/);
});
