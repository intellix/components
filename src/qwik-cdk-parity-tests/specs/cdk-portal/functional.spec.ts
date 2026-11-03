import {test, expect} from '@playwright/test';

/**
 * Functional coverage for `<CdkDomPortalOutlet>` — the specific risk `qwik-cdk/portal/
 * SYNC.md`'s "2026-11-03 — DomPortalOutlet re-evaluation" writeup needed real-browser
 * verification for, not just reasoning: does attaching Qwik-rendered content into an
 * arbitrary target DOM node (a) actually relocate the DOM, (b) preserve ancestor Qwik
 * context, and (c) keep reactivity working on the relocated content afterward.
 */
const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

test.describe('cdk-portal — CdkDomPortalOutlet functional', () => {
  test('relocates content into the target, preserves context, and stays reactive', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/cdk-portal/dom-outlet/`);
    await page.waitForSelector('[data-scenario-ready]');

    // (a) The portaled content is a genuine DOM descendant of the target container, not
    // just visually near it.
    const isInsideTarget = await page.evaluate(() => {
      const target = document.querySelector('[data-testid="target-container"]');
      const content = document.querySelector('[data-testid="portaled-content"]');
      return !!target && !!content && target.contains(content);
    });
    expect(isInsideTarget).toBe(true);

    // (b) Context provided by an ancestor ABOVE <CdkDomPortalOutlet> is visible inside the
    // relocated content — the specific requirement a context-less render() call would fail.
    await expect(page.getByTestId('context-message')).toHaveText('context-value-from-ancestor');

    // (c) A signal update inside the relocated content still patches the live DOM correctly
    // after the move (not just on first render).
    await expect(page.getByTestId('count')).toHaveText('Count: 0');
    await page.getByTestId('increment').click();
    await page.getByTestId('increment').click();
    await expect(page.getByTestId('count')).toHaveText('Count: 2');

    // Still inside the target after the reactive update (the move wasn't undone by the patch).
    const stillInsideTarget = await page.evaluate(() => {
      const target = document.querySelector('[data-testid="target-container"]');
      const content = document.querySelector('[data-testid="portaled-content"]');
      return !!target && !!content && target.contains(content);
    });
    expect(stillInsideTarget).toBe(true);
  });

  test('unmounting the outlet after relocation removes the content with no corruption', async ({
    page,
  }) => {
    await page.goto(`${QWIK_URL}/cdk-portal/dom-outlet/`);
    await page.waitForSelector('[data-scenario-ready]');

    // Let the initial relocation settle first.
    await expect(page.getByTestId('context-message')).toHaveText('context-value-from-ancestor');
    const insideTargetBeforeToggle = await page.evaluate(() => {
      const target = document.querySelector('[data-testid="target-container"]');
      return !!target && target.children.length > 0;
    });
    expect(insideTargetBeforeToggle).toBe(true);

    await page.getByTestId('toggle-outlet').click();

    // The relocated content is gone — no orphaned DOM left behind in the target.
    await expect(page.getByTestId('portaled-content')).toHaveCount(0);
    const targetEmptyAfterToggle = await page.evaluate(
      () => document.querySelector('[data-testid="target-container"]')?.children.length,
    );
    expect(targetEmptyAfterToggle).toBe(0);

    // The rest of the page (a sibling of the outlet, re-rendered by the same toggle) is
    // still intact — the unmount didn't corrupt anything else in the tree.
    await expect(page.getByTestId('other-content')).toBeVisible();

    // Re-attaching (toggle back on) relocates it again, from scratch. The relocation itself
    // is asynchronous (the outlet's `useVisibleTask$` fires after the content has already
    // rendered in place), so this polls rather than checking once immediately after the
    // click — confirmed live: checking synchronously right after the click is flaky (caught
    // by running this spec repeatedly), exactly because of that gap.
    await page.getByTestId('toggle-outlet').click();
    await expect(page.getByTestId('context-message')).toHaveText('context-value-from-ancestor');
    await expect
      .poll(() =>
        page.evaluate(() => {
          const target = document.querySelector('[data-testid="target-container"]');
          const content = document.querySelector('[data-testid="portaled-content"]');
          return !!target && !!content && target.contains(content);
        }),
      )
      .toBe(true);
  });
});
