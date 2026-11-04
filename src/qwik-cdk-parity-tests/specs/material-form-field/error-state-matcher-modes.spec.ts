import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * The two BUILT-IN `ErrorStateMatcher` string modes (`'touched'`/`'dirty'`) plus the app-wide
 * `useMatErrorStateMatcherProvider({...})` default vs. a per-control override. See
 * `qwik-material/core/error-state-matcher.ts`'s doc comment. No matching upstream docs example
 * (that's `input-error-state-matcher`'s own QRL-custom-matcher case, covered separately by
 * `specs/examples-forms/error-state-matcher.spec.ts`) — bespoke functional spec, fresh
 * `page.goto` per test.
 */
async function load(page: Page) {
  await page.goto(`${BASE_URL}/mat-form-field/error-state-matcher-modes/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

test("app-wide 'dirty' default: a field with no errorStateMatcher of its own shows invalid as soon as it's dirty — before any blur", async ({
  page,
}) => {
  await load(page);
  const field = page.locator('[data-testid="app-default"]');
  const input = field.locator('input');
  await input.focus();
  await expect(field.locator('mat-form-field')).not.toHaveClass(/mat-form-field-invalid/);
  await input.pressSequentially('a');
  await input.fill('');
  // Still focused, never blurred — the 'dirty' mode already flags it invalid.
  await expect(field.locator('mat-form-field')).toHaveClass(/mat-form-field-invalid/);
});

test("per-control errorStateMatcher=\"touched\" overrides the provider's 'dirty' default — waits for blur", async ({
  page,
}) => {
  await load(page);
  const field = page.locator('[data-testid="override-touched"]');
  const input = field.locator('input');
  await input.focus();
  await input.pressSequentially('a');
  await input.fill('');
  // Dirty, but NOT yet touched — the override means this must NOT show invalid yet.
  await expect(field.locator('mat-form-field')).not.toHaveClass(/mat-form-field-invalid/);
  await page.locator('body').click();
  // Blurred now — touched — the override's own mode fires.
  await expect(field.locator('mat-form-field')).toHaveClass(/mat-form-field-invalid/);
});
