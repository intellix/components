import {test, expect, type Page} from '@playwright/test';

const BASE_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

/**
 * Verifies rule 7 of the DOM-parity remediation design (no per-instance
 * `useVisibleTask$` for interaction plumbing — focus monitoring, ripple
 * loading, keyboard handling, measuring — in components that appear many
 * times per page): the chunks backing `useFocusOrigin()` (qwik-cdk/a11y),
 * `useRippleLoader()` (qwik-material/button/internal/ripple-loader.ts) and
 * `MatProgressBar`'s `transitionend` handler must not EXECUTE before the
 * user actually interacts, even after the page has settled (loaded + qwik
 * idle + a grace period during which qwikloader's own speculative
 * prefetching has every opportunity to run).
 *
 * "Not execute" is the right bar, not "not requested": qwikloader (and its
 * optional preloader) may legitimately *fetch* (and even warm/parse) a
 * symbol's chunk ahead of time as a performance optimization, but it must
 * not *run* the handler inside it. Qwik's own `qsymbol` event is the
 * correct signal for "ran": looking at qwikloader's source
 * (`processDocumentEvent` → `dispatch()`), `emitEvent("qsymbol", ...)` is
 * only ever called from inside the handler that responds to a REAL DOM
 * event reaching an element with a matching `on:<event>` attribute — a
 * speculative prefetch/import never reaches that code path on its own.
 * Network-request inspection would conflate "fetched for prefetch" with
 * "executed", which is exactly the ambiguity this test must not have.
 *
 * Correlating *which* qsymbol belongs to *which* hook is done by reading
 * the actual `on:<event>="<chunk>#<symbol>[...]"` attribute values Qwik's
 * SSR renders onto the element in question, rather than hard-coding symbol
 * names (those are content-hashed and would break on every rebuild).
 */

/**
 * Extracts the bare `s_xxxxxxx` symbol name of the lazy (chunk-backed) QRL in a serialized
 * `on:*` attribute value. An attribute can list several QRLs (newline-separated); inline `sync$`
 * handlers (e.g. useRippleLoader's synchronous init flag) serialize as a chunk-less `#<n>` entry
 * and are skipped — they load no code, so they're outside this laziness contract.
 */
function symbolOf(attr: string | null): string {
  if (!attr) throw new Error('expected a QRL-valued on:* attribute, found none');
  const qrl = attr.split(/\s+/).find(entry => /^[^#]+#/.test(entry));
  if (!qrl) throw new Error(`no chunk-backed QRL in: ${attr}`);
  const hash = qrl.split('#')[1];
  if (!hash) throw new Error(`QRL has no #symbol segment: ${qrl}`);
  return hash.replace(/^([^?[|]*).*$/, '$1');
}

/** Installs a `qsymbol` listener before any page script runs, returning a live array of fired symbol names. */
async function trackFiredSymbols(page: Page): Promise<{fired: () => Promise<string[]>}> {
  await page.addInitScript(() => {
    (window as unknown as {__firedSymbols: string[]}).__firedSymbols = [];
    document.addEventListener('qsymbol', ev => {
      (window as unknown as {__firedSymbols: string[]}).__firedSymbols.push(
        (ev as CustomEvent<{symbol: string}>).detail.symbol,
      );
    });
  });
  return {
    fired: () =>
      page.evaluate(() => (window as unknown as {__firedSymbols: string[]}).__firedSymbols),
  };
}

/** Navigates, waits for the scenario to be ready, then gives qwikloader's idle prefetching a window to run. */
async function openAndSettle(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForSelector('[data-scenario-ready]');
  await page
    .evaluate(
      () =>
        new Promise<void>(resolve => {
          document.addEventListener('qidle', () => resolve(), {once: true});
          setTimeout(resolve, 1500);
        }),
    )
    .catch(() => {});
  await page.waitForTimeout(500);
}

test.describe('lazy interaction handlers — no eager useVisibleTask$ (rule 7)', () => {
  test('mat-button: focus-origin + ripple-loader symbols stay unexecuted until the first interaction', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    await openAndSettle(page, '/mat-button/filled/');

    const button = page.locator('[data-parity-root] button, [data-parity-root] a').first();
    // All 7 events are attached to the SAME host element (the rendered
    // <button>/<a> itself — useFocusOrigin() and useRippleLoader() both
    // attach to "this component's own host").
    const allSymbols = new Set(
      await Promise.all(
        [
          'pointerdown',
          'focusin',
          'focusout',
          'focus',
          'mousedown',
          'mouseenter',
          'touchstart',
        ].map(async evt => symbolOf(await button.getAttribute(`on:${evt}`))),
      ),
    );
    // Sanity: both hooks are actually wired (useFocusOrigin + useRippleLoader
    // attach 3 + 1 distinct symbols respectively — fail loudly if the DOM
    // contract regresses instead of silently asserting an empty set).
    expect(allSymbols.size).toBeGreaterThanOrEqual(2);

    const beforeFired = new Set(await symbols.fired());
    for (const sym of allSymbols) {
      expect(beforeFired, `symbol ${sym} must not have executed before interaction`).not.toContain(
        sym,
      );
    }

    // A single real click exercises both hooks: it moves focus in
    // (useFocusOrigin's pointerdown + focusin) and fires focus/mousedown/
    // mouseenter (useRippleLoader) — but NOT focusout, since nothing moves
    // focus away afterward. Check only the symbols a plain click guarantees.
    await button.click();
    await page.waitForTimeout(300);

    const focusoutSymbol = symbolOf(await button.getAttribute('on:focusout'));
    const guaranteedByClick = [...allSymbols].filter(sym => sym !== focusoutSymbol);
    const afterFired = new Set(await symbols.fired());
    for (const sym of guaranteedByClick) {
      expect(afterFired, `symbol ${sym} must have executed after a click`).toContain(sym);
    }

    // focusout's own laziness is exercised separately: blur the button and
    // confirm ITS symbol now executes too (full round-trip, not just "it was
    // never required to"). `.blur()` fires a real (non-bubbling) blur AND a
    // bubbling focusout synchronously — more reliable than clicking some
    // other element and hoping it isn't itself focusable.
    await button.evaluate(el => (el as HTMLElement).blur());
    await page.waitForTimeout(300);
    const finalFired = new Set(await symbols.fired());
    expect(
      finalFired,
      `symbol ${focusoutSymbol} must execute once focus actually leaves`,
    ).toContain(focusoutSymbol);
  });

  test('mat-button-toggle: focus-origin symbols stay unexecuted until the first interaction', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    await openAndSettle(page, '/mat-button-toggle/basic/');

    // useFocusOrigin() attaches to MatButtonToggle's own host — the outer
    // <mat-button-toggle role="presentation">, not the inner <button> the
    // user actually clicks (focusin bubbles up from the inner button, so
    // the outer element still sees it).
    const toggleHost = page.locator('mat-button-toggle').first();
    const toggleButton = toggleHost.locator('button');
    const expectedSymbols = new Set(
      await Promise.all(
        ['pointerdown', 'focusin', 'focusout'].map(async evt =>
          symbolOf(await toggleHost.getAttribute(`on:${evt}`)),
        ),
      ),
    );
    expect(expectedSymbols.size).toBeGreaterThanOrEqual(1);

    const beforeFired = new Set(await symbols.fired());
    for (const sym of expectedSymbols) {
      expect(beforeFired, `symbol ${sym} must not have executed before interaction`).not.toContain(
        sym,
      );
    }

    await toggleButton.click({force: true});
    await page.waitForTimeout(300);

    const focusoutSymbol = symbolOf(await toggleHost.getAttribute('on:focusout'));
    const guaranteedByClick = [...expectedSymbols].filter(sym => sym !== focusoutSymbol);
    const afterFired = new Set(await symbols.fired());
    for (const sym of guaranteedByClick) {
      expect(afterFired, `symbol ${sym} must have executed after a click`).toContain(sym);
    }
  });

  test('mat-progress-bar: transitionend handler symbol stays unexecuted until a transition actually fires', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    // "query" mode never transitions (continuous indeterminate animation,
    // no determinate value) — the handler's chunk must never execute here.
    await openAndSettle(page, '/mat-progress-bar/query/');

    const bar = page.locator('mat-progress-bar').first();
    const transitionendAttr = await bar.getAttribute('on:transitionend');
    expect(transitionendAttr, 'expected an on:transitionend attribute').toBeTruthy();
    const symbol = symbolOf(transitionendAttr);

    const fired = new Set(await symbols.fired());
    expect(
      fired,
      `transitionend symbol ${symbol} must not execute for a query-mode bar`,
    ).not.toContain(symbol);
  });
});
