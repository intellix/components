import {test, expect} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test('material-button-toggle/preselected — SSR renders italic as checked (+ tabindex=0) WITHOUT client-side flash', async ({
  page,
}) => {
  // Verify the SSR HTML already contains mat-button-toggle-checked on italic
  // BEFORE waiting for hydration signal. This catches the case where
  // initial checked state is only applied client-side.
  const response = await page.goto(`${BASE_URL}/mat-button-toggle/preselected/`);
  expect(response?.status()).toBe(200);
  const html = await response!.text();

  // The italic toggle's <mat-button-toggle> should carry mat-button-toggle-checked in the raw SSR HTML.
  // Qwik wraps projected <Slot/> content in `<!--qv-->...<!--/qv-->` comment markers, so the label
  // text is not immediately adjacent to the <span> tags — match loosely (but still structurally:
  // checked toggle -> its <button> -> its label <span> -> "Italic" -> </span>) rather than requiring
  // exact adjacency. The inner <button> also carries tabindex="0" directly in SSR output (roving
  // tabindex is SSR-rendered state, not added by a client-side task). Qwik's raw SSR source
  // spells the attribute `tabIndex` (camelCase); browsers lowercase it to `tabindex` when parsing
  // into the DOM (which is what the real parity diff reads) — match case-insensitively here since
  // this check works against the raw HTML string, not a parsed DOM.
  const italicPattern =
    /<mat-button-toggle[^>]*mat-button-toggle-checked[^>]*>[\s\S]*?<button[^>]*tabindex="0"[^>]*>[\s\S]*?<span[^>]*>[\s\S]*?Italic[\s\S]*?<\/span>/i;
  expect(html).toMatch(italicPattern);

  await page.waitForSelector('[data-scenario-ready]');

  // After hydration, italic still checked + tabbable; the others are not.
  const toggles = page.locator('mat-button-toggle');
  const buttons = page.locator('mat-button-toggle button.mat-button-toggle-button');
  await expect(buttons.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
  await expect(buttons.nth(1)).toHaveAttribute('tabindex', '0');
  await expect(buttons.nth(0)).toHaveAttribute('tabindex', '-1');
  await expect(buttons.nth(2)).toHaveAttribute('tabindex', '-1');
});
