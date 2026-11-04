import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/** See the `mat-tooltip/repeat-show-delay` scenario's doc comment. */
test('a tooltip with a show delay shows on every hover, not just the first', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-tooltip/repeat-show-delay/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  const box = (await page.locator('[data-parity-root] button').boundingBox())!;
  const shown = page.locator('.mat-mdc-tooltip.mat-mdc-tooltip-show');
  for (let hover = 1; hover <= 3; hover++) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(shown, `hover ${hover}: shown`).toHaveCount(1, {timeout: 3000});
    await page.mouse.move(5, 5);
    await expect(page.locator('.mat-mdc-tooltip'), `hover ${hover}: detached`).toHaveCount(0, {
      timeout: 3000,
    });
  }
});
