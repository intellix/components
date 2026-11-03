import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * `input-error-state-matcher`'s whole point — a custom `ErrorStateMatcher` QRL that shows the
 * error the moment the field becomes DIRTY (a single keystroke), without waiting for `touched`
 * (blur) the way the DEFAULT `ErrorStateMatcher` (`form-field-error`'s own example) does. See
 * `qwik-material/core/error-state-matcher.ts`'s doc comment and `select/SYNC.md`'s `compareWith`
 * section (same QRL-resolution design) for the full write-up. Fresh `page.goto` per test, so
 * every interaction happens post-resume.
 */
async function load(page: Page) {
  await page.goto(`${BASE_URL}/examples/input-error-state-matcher/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

test('no error on first paint (pristine, untouched, invalid-but-not-yet-shown)', async ({
  page,
}) => {
  await load(page);
  await expect(page.locator('mat-error')).toHaveCount(0);
  await expect(page.locator('mat-form-field')).not.toHaveClass(/mat-form-field-invalid/);
});

test('typing a single character shows the error immediately — before any blur ("dirty" branch)', async ({
  page,
}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await input.pressSequentially('a');
  // Still focused — never blurred — yet the custom matcher's `dirty ||` branch already fires.
  await expect(page.locator('mat-error')).toHaveCount(1);
  await expect(page.locator('mat-error')).toHaveText('Please enter a valid email address');
  await expect(page.locator('mat-form-field')).toHaveClass(/mat-form-field-invalid/);
});

test('clearing back to empty shows the "required" error, still before any blur', async ({
  page,
}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await input.pressSequentially('a');
  await input.fill('');
  await expect(page.locator('mat-error')).toHaveText('Email is required');
});

test('a valid email clears the error without ever needing to blur', async ({page}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await input.fill('pat@example.com');
  await expect(page.locator('mat-error')).toHaveCount(0);
  await expect(page.locator('mat-form-field')).not.toHaveClass(/mat-form-field-invalid/);
});

test('blurring an untouched-but-still-pristine field shows nothing (dirty is what gates it here, not touched)', async ({
  page,
}) => {
  await load(page);
  // Focus then blur WITHOUT typing — `touched` becomes true, `dirty` stays false, but the field
  // was never actually invalid-and-dirty in the first place (empty + untyped is just as invalid
  // as it was on load) — this instead proves the matcher's `touched ||` branch independently:
  // the default ErrorStateMatcher would ALSO show this (touched && invalid), so this only
  // confirms this port's matcher didn't regress that half while adding the `dirty` one.
  await page.locator('input').click();
  await page.locator('body').click();
  await expect(page.locator('mat-error')).toHaveCount(1);
  await expect(page.locator('mat-form-field')).toHaveClass(/ng-touched/);
});
