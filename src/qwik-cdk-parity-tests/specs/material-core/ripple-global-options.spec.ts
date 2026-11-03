import {test, expect, type Page} from '@playwright/test';

/**
 * Functional (Qwik-only — no Angular comparison) coverage for
 * `MAT_RIPPLE_GLOBAL_OPTIONS`/`<QwikMaterialProvider matRippleConfig={...}>`
 * (`core/ripple/ripple-global-options.ts`). This is a brand-new port-only
 * API surface — upstream's own `MAT_RIPPLE_GLOBAL_OPTIONS` has no bearing on
 * the parity harness (it's an Angular DI token, not DOM), so there's no
 * `angular-parity.spec.ts` counterpart; the fixture itself
 * (`src/qwik-cdk-dev-app/src/routes/mat-ripple/global-options/`) is bespoke,
 * not a ported upstream example.
 *
 * Every assertion reads the live `.mat-ripple-element`'s presence/inline
 * `style.opacity` synchronously, right after the triggering pointer event —
 * same deterministic technique `specs/material-button/ripple-mid-flight.
 * spec.ts` already established: `fadeOutRipple` sets `opacity = '0'`
 * SYNCHRONOUSLY the moment it runs, regardless of how long the exit CSS
 * transition that follows takes, so checking it needs no transitionend/
 * settle polling.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';
const ROUTE = `${QWIK_URL}/mat-ripple/global-options/`;

async function openPage(page: Page): Promise<void> {
  await page.goto(ROUTE);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

/** Hovers (bootstrap, same `useRippleLoader()`/`MatButton` convention) then presses down. */
async function hoverAndPressDown(page: Page, selector: string): Promise<void> {
  const el = page.locator(selector).first();
  const box = await el.boundingBox();
  if (!box) throw new Error(`${selector} has no bounding box`);
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.waitForTimeout(50);
  await page.mouse.down();
}

test.describe('MAT_RIPPLE_GLOBAL_OPTIONS — functional (Qwik only)', () => {
  test('disabled: a real mousedown launches no ripple at all, on the standalone directive or a built-in button', async ({
    page,
  }) => {
    await openPage(page);

    await hoverAndPressDown(page, '.ripple-disabled-globally');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.ripple-disabled-globally .mat-ripple-element').count(),
      'standalone <MatRipple> under matRippleConfig={{disabled: true}}',
    ).toBe(0);
    await page.mouse.up();

    await hoverAndPressDown(page, '.button-disabled-globally');
    await page.waitForTimeout(100);
    expect(
      await page.locator('.button-disabled-globally .mat-ripple-element').count(),
      "a built-in MatButton's own internal ripple under the SAME provider",
    ).toBe(0);
    await page.mouse.up();
  });

  test('baseline (no provider): a mid-enter mouseup leaves the ripple fading in, not fading out', async ({
    page,
  }) => {
    await openPage(page);
    await hoverAndPressDown(page, '.ripple-baseline');
    // Well inside the 225ms default enter duration.
    await page.waitForTimeout(60);
    await page.mouse.up();
    const opacity = await page
      .locator('.ripple-baseline .mat-ripple-element')
      .first()
      .evaluate(el => (el as HTMLElement).style.opacity);
    // Never set to '0' by fadeInRipple itself — an empty string here means fadeOut() was NOT
    // invoked yet (the default "wait for the enter animation, then for pointer-up" contract).
    expect(opacity, 'fadeOut() not yet called while still mid-enter, by default').toBe('');
  });

  test('terminateOnPointerUp: a mid-enter mouseup fades the ripple out immediately instead of waiting', async ({
    page,
  }) => {
    await openPage(page);
    await hoverAndPressDown(page, '.ripple-terminate-on-pointer-up');
    // Same short, well-inside-225ms wait as the baseline test above.
    await page.waitForTimeout(60);
    await page.mouse.up();
    const opacity = await page
      .locator('.ripple-terminate-on-pointer-up .mat-ripple-element')
      .first()
      .evaluate(el => (el as HTMLElement).style.opacity);
    expect(opacity, 'fadeOut() called synchronously on pointer-up, even mid-enter').toBe('0');
  });

  test('exitDuration 0: the ripple element is removed synchronously on pointer-up once visible', async ({
    page,
  }) => {
    await openPage(page);
    await hoverAndPressDown(page, '.ripple-exit-duration-0');
    // Past the 225ms default enter duration — the ripple is fully VISIBLE (not still FADING_IN)
    // by the time we release, so `handlePointerUp` takes its ordinary `state === VISIBLE` branch.
    await page.waitForTimeout(300);
    expect(
      await page.locator('.ripple-exit-duration-0 .mat-ripple-element').count(),
      'ripple visible before release',
    ).toBe(1);
    await page.mouse.up();
    // No wait: `exitDuration: 0` makes `fadeOutRipple` finish the transition (and remove the
    // element) SYNCHRONOUSLY inside the same `mouseup` handler — see `ripple-renderer.ts`'s
    // `fadeOutRipple`/`_finishRippleTransition`/`_destroyRipple`.
    expect(
      await page.locator('.ripple-exit-duration-0 .mat-ripple-element').count(),
      'removed synchronously on pointer-up, no transitionend wait needed',
    ).toBe(0);
  });
});
