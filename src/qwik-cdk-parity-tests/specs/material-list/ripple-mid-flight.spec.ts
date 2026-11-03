import {test, expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';
import type {ParityStep} from '../../lib/material-parity.js';

/**
 * Targeted ripple check for an INTERACTIVE list item (`<a mat-list-item>` inside
 * `<mat-nav-list>`) — the DOM shape `MatListItem`'s new ripple wiring is supposed to produce
 * (see `qwik-material/list/mat-list-item.tsx`'s `rippleEvent$`/`rippleProps`, and `list/SYNC.md`'s
 * "Ripple" section). Reuses the EXISTING `mat-list/nav` scenario both apps already serve for
 * `specs/material-list/angular-parity.spec.ts` — no new Angular mirror/dev-app route needed.
 *
 * Built on `expectMaterialParity` itself (one custom step) rather than the lower-level technique
 * `specs/material-button/ripple-mid-flight.spec.ts` uses, specifically so the "after" half gets
 * the harness's own `syncTheme`/`pinRoot`/settle handling for free:
 *
 * - `pinRoot: true` — a list item, unlike a button, stretches to fill its container's available
 *   width, which genuinely differs between the two dev-app shells (different surrounding
 *   toolbar/padding — see `list/SYNC.md`'s own "pixel geometry that doesn't even hold in the
 *   Angular reference" note). Pinning `[data-parity-root]` to an identical fixed box on both
 *   pages makes the item's actual pixel width identical too, so the ripple's geometry (computed
 *   from that width) is byte-comparable.
 * - `syncTheme` (always run by `expectMaterialParity`'s own `open()`) — without it, the two
 *   dev-apps' independent default themes produce a real (if cosmetic) computed-style diff on
 *   every element, unrelated to ripples, that would otherwise fail the post-step structural
 *   compare below for the wrong reason.
 *
 * The ONE step presses the first nav-list item ("Inbox", a plain non-activated `<a
 * mat-list-item>`), captures the live `.mat-ripple-element`'s classes + inline style while still
 * held — all properties `fadeInRipple` sets ONCE, synchronously, at ripple-creation time, so this
 * is deterministic despite comparing a CSS-animated element (same technique
 * `specs/material-button/ripple-mid-flight.spec.ts` already established) — then releases. Those
 * captured snapshots are compared AFTER `expectMaterialParity` returns (i.e. after it has already
 * asserted the settled DOM matches too, covering the "after" half structurally).
 *
 * Upstream's `<a href="...">` list items here are REAL navigational anchors (`/inbox`); an actual
 * click (down+up at the same point) would navigate the tab away on both apps. A capturing `click`
 * listener installed at the start of the step suppresses that default action without touching
 * ripple firing at all (ripples launch on `mousedown`, independent of `click`'s default action).
 */

interface RippleSnapshot {
  count: number;
  classList: string[];
  left: string;
  top: string;
  height: string;
  width: string;
  transitionDuration: string;
  transform: string;
}

async function preventAnchorNavigation(page: Page): Promise<void> {
  await page.evaluate(() => {
    const flag = '__parityNoNav';
    const w = window as unknown as Record<string, boolean>;
    if (w[flag]) return;
    w[flag] = true;
    document.addEventListener(
      'click',
      event => {
        const target = event.target as Element | null;
        if (target?.closest?.('a[href]')) event.preventDefault();
      },
      true,
    );
  });
}

async function pressReadRelease(page: Page): Promise<RippleSnapshot> {
  await preventAnchorNavigation(page);

  // The first nav-list item ("Inbox") — a plain, non-activated `<a mat-list-item>`.
  const item = page.locator('[data-parity-root] a').first();
  const box = await item.boundingBox();
  if (!box) throw new Error('nav-list item has no bounding box');
  const x = box.x + box.width * 0.3;
  const y = box.y + box.height * 0.5;

  await page.mouse.move(x, y);
  await page.waitForTimeout(100);
  await page.mouse.down();
  // Comfortably inside the 225ms default enter duration.
  await page.waitForTimeout(120);

  const snapshot = await page
    .locator('[data-parity-root] .mat-ripple-element')
    .first()
    .evaluate(el => ({
      count: document.querySelectorAll('.mat-ripple-element').length,
      classList: Array.from(el.classList),
      left: (el as HTMLElement).style.left,
      top: (el as HTMLElement).style.top,
      height: (el as HTMLElement).style.height,
      width: (el as HTMLElement).style.width,
      transitionDuration: (el as HTMLElement).style.transitionDuration,
      transform: (el as HTMLElement).style.transform,
    }));

  await page.mouse.up();
  return snapshot;
}

test.describe('mat-list — nav-list item ripple captured mid-flight (pointer still held)', () => {
  test('a .mat-ripple-element launched by a real mousedown matches Angular byte-for-byte while still animating, and the DOM matches again once it settles', async ({
    browser,
  }) => {
    // `expectMaterialParity` runs this step's `run()` once per page, Angular THEN Qwik, in that
    // exact order (same sequencing convention it uses throughout) — pushed in order, so
    // `readings[0]` is always Angular's and `readings[1]` always Qwik's.
    const readings: RippleSnapshot[] = [];
    const step: ParityStep = {
      name: 'press-and-release the first nav-list item (ripple captured mid-flight)',
      run: async page => {
        readings.push(await pressReadRelease(page));
      },
    };

    await expectMaterialParity(browser, {
      route: 'mat-list',
      scenario: 'nav',
      pinRoot: true,
      steps: [step],
    });

    const [angularRipple, qwikRipple] = readings;
    expect(angularRipple, 'Angular ripple reading captured').toBeDefined();
    expect(qwikRipple, 'Qwik ripple reading captured').toBeDefined();

    expect(angularRipple.count, 'exactly one ripple element while held (Angular)').toBe(1);
    expect(qwikRipple.count, 'exactly one ripple element while held (Qwik)').toBe(1);
    expect(qwikRipple.classList).toEqual(angularRipple.classList);
    expect(qwikRipple.transitionDuration, 'enter duration (225ms)').toBe(
      angularRipple.transitionDuration,
    );
    expect(qwikRipple.transform, 'scale3d(1, 1, 1) — enter animation already started').toBe(
      angularRipple.transform,
    );
    expect(qwikRipple.left).toBe(angularRipple.left);
    expect(qwikRipple.top).toBe(angularRipple.top);
    expect(qwikRipple.height).toBe(angularRipple.height);
    expect(qwikRipple.width).toBe(angularRipple.width);

    // `expectMaterialParity` itself already asserted the settled DOM (after the step released
    // the pointer and the ripple's enter+exit cycle finished) is structurally identical on both
    // sides — including that no stray `.mat-ripple-element` remains, since its own
    // `snapshotParityRoot` would otherwise have diffed it in. Nothing left to check here.
  });
});
