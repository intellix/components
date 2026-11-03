import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * A component passing `useMatFormControl()`'s QRLs to a control must still re-render when one of
 * its own signals changes — see the `mat-form-field/control-rerender` scenario's doc comment.
 */
test('a component using useMatFormControl() re-renders on its own signal changes', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-form-field/control-rerender/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  for (const expected of ['count 1', 'count 2', 'count 3']) {
    await page.click('#increment');
    await expect(page.locator('#count')).toHaveText(expected);
  }
});
