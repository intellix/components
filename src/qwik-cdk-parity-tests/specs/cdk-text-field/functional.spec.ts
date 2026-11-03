import {test, expect} from '@playwright/test';

/**
 * Functional (not Angular-DOM-parity) coverage for `useCdkTextareaAutosize()` — no Angular
 * reference scenario exists for this brand-new qwik-cdk entry point, so this exercises real
 * browser layout (typing grows the height up to `maxRows`, then stays capped) directly
 * against the qwik-cdk dev-app, per `qwik-cdk/text-field/SYNC.md`'s testing note.
 */
const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test.describe('cdk-text-field — functional', () => {
  test('textarea grows with typed content up to maxRows, then stops growing', async ({page}) => {
    await page.goto(`${QWIK_URL}/cdk-text-field/autosize/`);
    await page.waitForSelector('[data-scenario-ready]');

    const textarea = page.getByTestId('autosize-textarea');
    await expect(textarea).toHaveClass(/cdk-textarea-autosize/);
    await expect(textarea).toHaveAttribute('rows', '1');

    const initialHeight = await textarea.evaluate(el => el.getBoundingClientRect().height);

    await textarea.click();
    await textarea.fill('one\ntwo\ntrue');
    await page.waitForTimeout(50);
    const heightAfterFewLines = await textarea.evaluate(el => el.getBoundingClientRect().height);
    expect(heightAfterFewLines).toBeGreaterThan(initialHeight);

    // Type well past maxRows (4) worth of lines — height should stop growing once capped.
    await textarea.fill('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight');
    await page.waitForTimeout(50);
    const heightAtMax = await textarea.evaluate(el => el.getBoundingClientRect().height);

    await textarea.fill('one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\neleven');
    await page.waitForTimeout(50);
    const heightPastMax = await textarea.evaluate(el => el.getBoundingClientRect().height);

    expect(heightPastMax).toBe(heightAtMax);

    // Capped height should allow scrolling to the caret position (content overflows).
    const scrollHeight = await textarea.evaluate(el => el.scrollHeight);
    const clientHeight = await textarea.evaluate(el => el.clientHeight);
    expect(scrollHeight).toBeGreaterThan(clientHeight);
  });
});
