import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * The FAB family renders its `icon` prop directly; the ripple loader initializes on first hover
 * and re-renders the button, which re-rendered that same `JSXOutput` a second time — Qwik v2 then
 * dropped the `<mat-icon>`'s text, so the icon vanished on hover (see core/jsx-reuse.ts).
 */
test('material-button — FAB and mini-FAB icons survive the hover-triggered ripple re-render', async ({
  page,
}) => {
  await page.goto(`${BASE_URL}/mat-button/example/`);
  await page.waitForSelector('[data-scenario-ready]');
  const fabs = page.locator(
    ':is(button, a):is(.mat-mdc-fab, .mat-mdc-mini-fab, .mat-mdc-extended-fab):not([disabled]):has(.mat-icon)',
  );
  const count = await fabs.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const fab = fabs.nth(i);
    const icon = fab.locator('.mat-icon');
    const ligature = (await icon.textContent())?.trim();
    expect(ligature, `FAB ${i} icon before hover`).toBeTruthy();

    await fab.hover();
    // The ripple loader swaps in its ripple span once initialized.
    await expect(fab.locator('.mat-mdc-button-ripple')).toHaveCount(1);
    await expect(icon, `FAB ${i} icon after hover`).toHaveText(ligature!);
  }
});
