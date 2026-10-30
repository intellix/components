import {test, expect, type Browser, type Page} from '@playwright/test';

/**
 * Targeted check for a ripple CAPTURED MID-FLIGHT (while the pointer is still
 * held down, before the enter transition has settled) — the
 * `angular-parity.spec.ts` suite can't cover this: `expectMaterialParity`'s
 * underlying `snapshotParityRoot` deliberately WAITS for every transient
 * `.mat-ripple-element` to disappear before comparing (see
 * `lib/material-parity.ts`'s doc comment and the parity-tests README's
 * "Normalization" section) — the contract there is the settled DOM, which by
 * definition never includes an in-progress ripple. A *mid-flight* comparison
 * therefore needs its own, narrower harness that does NOT wait for
 * settlement and release the pointer before reading.
 *
 * Not run through `expectMaterialParity`/`snapshotParityRoot` for exactly
 * that reason — this opens both pages directly, holds `mousedown` on both
 * (via `page.mouse.down()`, no matching `mouseup` until the assertions are
 * done), and reads the live `.mat-ripple-element`'s classes + inline style
 * directly.
 *
 * Deterministic, not flaky, despite comparing a CSS-animated element: the
 * properties compared here (`left`/`top`/`height`/`width`/
 * `transition-duration`/`transform`, plus the class list) are all set ONCE,
 * synchronously, by `fadeInRipple` (`src/material/core/ripple/
 * ripple-renderer.ts` upstream; `core/ripple/ripple-renderer.ts` in this
 * port) at ripple-creation time and never rewritten again until `fadeOut()`
 * runs (which only happens on pointer-up or settlement) — the *computed*,
 * rendered appearance interpolates every frame while the transition plays,
 * but the literal inline `style` ATTRIBUTE TEXT does not change at all
 * during that window. Reading it a short, fixed delay after `mousedown`
 * (comfortably inside the 225ms enter duration, confirmed well clear of
 * both apps' own event-chunk-load/render latency) is therefore safe to
 * compare byte-for-byte, with no settle-polling needed.
 */

const ANGULAR_URL = `${process.env['ANGULAR_URL'] ?? 'http://localhost:4200'}/qwik-parity`;
const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/** Mirrors `fadeInRipple`'s own inline-style set — read back for comparison. */
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

async function openButtonPage(browser: Browser, url: string): Promise<Page> {
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('[data-parity-root]', {state: 'attached'});
  return page;
}

async function pressAndReadRipple(page: Page): Promise<RippleSnapshot> {
  const button = page.locator('[data-parity-root] button, [data-parity-root] a').first();
  const box = await button.boundingBox();
  if (!box) throw new Error('button has no bounding box');
  // A non-centered, off-middle point so the ripple's own geometry math
  // (offset from the click point, not just the container's center) is
  // actually exercised identically on both sides.
  const x = box.x + box.width * 0.3;
  const y = box.y + box.height * 0.7;

  // Hover BEFORE pressing, exactly like a real pointer (and Playwright's own
  // `.click()`) always does: on the Qwik side, the ripple's lazy bootstrap
  // (`useRippleLoader()`) only creates the `.mat-ripple` container the
  // FIRST time one of focus/mousedown/mouseenter/touchstart fires, and that
  // very first (bootstrapping) event never itself gets a ripple — mirroring
  // upstream's own `MatRippleLoader`, whose document-level capture listener
  // registers the real trigger listener too late to catch the SAME event
  // that triggered it (see `core/SYNC.md`'s ripple section). A short wait
  // after the hover lets that bootstrap's signal write/re-render land
  // before the press, so the press itself is the one that actually shows a
  // ripple — on both apps alike (Angular's own real `MatRippleLoader` has
  // the identical bootstrap-on-first-interaction contract).
  await page.mouse.move(x, y);
  await page.waitForTimeout(100);
  await page.mouse.down();
  // Comfortably inside the 225ms enter duration, past both apps' own
  // event-chunk-load/render latency.
  await page.waitForTimeout(120);

  return page
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
}

test.describe('mat-button — ripple captured mid-flight (pointer still held)', () => {
  test('a .mat-ripple-element launched by a real mousedown matches Angular byte-for-byte while still animating', async ({
    browser,
  }) => {
    const angular = await openButtonPage(browser, `${ANGULAR_URL}/mat-button/text`);
    const qwik = await openButtonPage(browser, `${QWIK_URL}/mat-button/text/`);

    try {
      // Angular first, then Qwik — same sequencing convention
      // `expectMaterialParity` itself uses, so Qwik's own (potentially
      // slower, first-ever-interaction, cold-chunk) handling gets no extra
      // head start relative to Angular.
      const angularRipple = await pressAndReadRipple(angular);
      const qwikRipple = await pressAndReadRipple(qwik);

      expect(angularRipple.count, 'exactly one ripple element while held').toBe(1);
      expect(qwikRipple.count, 'exactly one ripple element while held').toBe(1);
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
    } finally {
      // Release what we pressed, then close — leaves neither page's pointer
      // state dangling even though each context is about to be torn down.
      await angular.mouse.up();
      await qwik.mouse.up();
      await angular.context().close();
      await qwik.context().close();
    }
  });
});
