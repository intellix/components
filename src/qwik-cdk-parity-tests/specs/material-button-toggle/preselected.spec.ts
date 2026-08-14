import {test, expect} from '@playwright/test';

const BASE_URL = 'http://localhost:4173';

test('material-button-toggle/preselected — SSR renders italic as checked WITHOUT client-side flash', async ({
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
  // exact adjacency.
  const italicPattern =
    /<mat-button-toggle[^>]*mat-button-toggle-checked[^>]*>[\s\S]*?<button[^>]*>[\s\S]*?<span[^>]*>[\s\S]*?Italic[\s\S]*?<\/span>/;
  expect(html).toMatch(italicPattern);

  await page.waitForSelector('[data-scenario-ready]');

  // After hydration, italic still checked.
  const toggles = page.locator('mat-button-toggle');
  await expect(toggles.nth(1)).toHaveAttribute('aria-checked', 'true');
  await expect(toggles.nth(1)).toHaveClass(/mat-button-toggle-checked/);
});
