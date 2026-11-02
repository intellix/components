import {expect, test} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Qwik-only: behaviour `angular-parity.spec.ts` doesn't exercise — see
 * src/qwik-cdk-dev-app/src/routes/mat-table/qwik-only/index.tsx's header
 * comment for why none of these three things has an Angular-mirrored
 * scenario.
 */
test.describe('material-table — qwik-only', () => {
  test('a sticky footer row gets bottom:0 + the sticky class on every cell, and the always-sticky tfoot container quirk applies non-vacuously', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-table/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const footerCells = page.locator('.sticky-footer-table tfoot td');
    await expect(footerCells).toHaveCount(2);
    for (const cell of await footerCells.all()) {
      await expect(cell).toHaveClass(/mat-mdc-table-sticky/);
      await expect(cell).toHaveCSS('bottom', '0px');
    }
    // Single sticky footer row -> it IS the bordered row.
    await expect(footerCells.nth(0)).toHaveClass(/mat-mdc-table-sticky-border-elem-bottom/);

    const tfoot = page.locator('.sticky-footer-table tfoot');
    await expect(tfoot).toHaveClass(/mat-mdc-table-sticky/);
    await expect(tfoot).toHaveCSS('bottom', '0px');
  });

  test('matTextColumn() header/justify/footer overrides are honored (not just the auto-generated defaults)', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-table/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const table = page.locator('.text-column-override-table');
    await expect(table.locator('th').nth(0)).toHaveText('Element Name');
    await expect(table.locator('th').nth(0)).toHaveCSS('text-align', 'end');
    await expect(table.locator('th').nth(1)).toHaveText('Weight');
    await expect(table.locator('th').nth(1)).toHaveCSS('text-align', 'center');
    await expect(table.locator('tfoot td').nth(1)).toHaveText('Σ');
  });

  test('removing rows down to zero (client-side) shows the configured no-data row; restoring hides it again', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/mat-table/qwik-only/`);
    await page.waitForSelector('[data-scenario-ready]');

    const table = page.locator('.reactive-no-data-table');
    await expect(table.locator('tbody tr')).toHaveCount(2);
    await expect(table.locator('.mat-mdc-no-data-row')).toHaveCount(0);

    await page.locator('.remove-all').click();
    await expect(table.locator('.mat-mdc-no-data-row')).toHaveCount(1);
    await expect(table.locator('.mat-mdc-no-data-row td')).toHaveText('No data');
    await expect(table.locator('.mat-mdc-no-data-row td')).toHaveAttribute('colspan', '2');

    await page.locator('.restore').click();
    await expect(table.locator('.mat-mdc-no-data-row')).toHaveCount(0);
    await expect(table.locator('tbody tr')).toHaveCount(2);
  });
});
