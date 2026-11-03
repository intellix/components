import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * `optionSelected`/`opened`/`closed`/`optionActivated` — see
 * `qwik-material/autocomplete/SYNC.md`'s dedicated section. No matching
 * upstream docs example exists for this combination, so this is a Qwik-only
 * functional spec (fresh `page.goto` per test, so every interaction happens
 * post-resume).
 */
async function load(page: Page) {
  await page.goto(`${BASE_URL}/mat-autocomplete/option-events/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

function logLines(page: Page) {
  return page.locator('[data-testid="event-log"] li');
}

test('optionSelected fires once on a real click selection, never while typing', async ({
  page,
}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await expect(logLines(page)).toHaveText(['opened']);

  await input.fill('an');
  // Typing alone must never fire optionSelected — only onValueChange$/onInput$ do.
  await expect(logLines(page)).not.toContainText(['optionSelected:Banana']);

  await page.locator('mat-option', {hasText: 'Banana'}).click();
  await expect(logLines(page)).toContainText(['optionSelected:Banana']);
  // Exactly one optionSelected entry — not one per keystroke.
  await expect(page.locator('[data-testid="event-log"] li', {hasText: 'optionSelected:'})).toHaveCount(1);
  await expect(page.locator('p')).toHaveText('Value: Banana');
});

test('optionSelected fires on Enter-commit too', async ({page}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await input.fill('Cherry');
  await expect(page.locator('mat-option')).toHaveCount(1);
  await input.press('ArrowDown');
  // Wait for ArrowDown's own handler/chunk to fully settle before firing Enter —
  // see the arrow-key-navigation test's matching comment for why.
  await expect(input).toHaveAttribute('aria-activedescendant', /.+/);
  await input.press('Enter');
  await expect(logLines(page)).toContainText(['optionSelected:Cherry']);
});

test('opened/closed fire once per open/close cycle', async ({page}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await expect(page.locator('[data-testid="event-log"] li', {hasText: 'opened'})).toHaveCount(1);
  await input.press('Escape');
  await expect(page.locator('[data-testid="event-log"] li', {hasText: 'closed'})).toHaveCount(1);
});

test('optionActivated fires on arrow-key navigation', async ({page}) => {
  await load(page);
  const input = page.locator('input');
  await input.click();
  await expect(logLines(page)).toContainText(['opened']);
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'mat-option-0');
  await expect(logLines(page)).toContainText(['optionActivated:Apple']);
  // Wait for the first press's handler chunk/effects to fully settle before firing
  // the next one — two keydowns fired back-to-back while a QRL chunk is still
  // loading can resolve out of order under Qwik v2 (the same class of first-
  // invocation race documented elsewhere in this project, e.g. select/SYNC.md's
  // "Qwik v2 regressions" section) and is unrelated to this event's own correctness.
  await input.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', 'mat-option-1');
  await expect(logLines(page)).toContainText(['optionActivated:Banana']);
});
