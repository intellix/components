import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Upstream's form field forwards a click anywhere in its text-field wrapper to
 * `_control.onContainerClick()`, which focuses the input — so clicking a field's padding (not the
 * text itself) focuses it, and for an autocomplete that focus opens the panel. Fresh page per
 * test: the wrapper's click handler is lazily loaded on that first click, which is when it used
 * to find no element to focus (`event.currentTarget` is already null by then).
 */
async function clickWrapperPadding(page: Page, index = 0) {
  const wrapper = page.locator('[data-parity-root] .mat-mdc-text-field-wrapper').nth(index);
  const box = (await wrapper.boundingBox())!;
  await page.mouse.click(box.x + 6, box.y + box.height / 2);
}

test('clicking a form field outside its input focuses the input', async ({page}) => {
  await page.goto(`${BASE_URL}/mat-form-field/outline-basic/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  await clickWrapperPadding(page);
  await expect(page.locator('[data-parity-root] input').first()).toBeFocused();
});

test('clicking an autocomplete field outside its input opens the panel', async ({page}) => {
  await page.goto(`${BASE_URL}/examples/autocomplete-filter/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
  await clickWrapperPadding(page);
  const input = page.locator('[data-parity-root] input').first();
  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
});
