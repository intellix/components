import {test, expect, type ElementHandle, type Page} from '@playwright/test';

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
 * event reaching an element with a matching `q-e:<event>` attribute — a
 * speculative prefetch/import never reaches that code path on its own.
 * Network-request inspection would conflate "fetched for prefetch" with
 * "executed", which is exactly the ambiguity this test must not have.
 *
 * ---
 *
 * Qwik v2 upgrade (2026-11-01) — TWO changes, not one:
 *
 * 1. The attribute scheme renamed (the upgrade guide,
 *    https://next.qwik.dev/docs/upgrade/): v1's `on:<event>`/
 *    `on-document:<event>`/`on-window:<event>` became `q-e:<event>`
 *    (element-scoped — the only kind this file reads), `q-d:<event>`
 *    (`useOnDocument()`) and `q-w:<event>` (`useOnWindow()`), each with a
 *    `q-ep:`/`q-dp:`/`q-wp:` passive variant. Simple rename, handled below.
 *
 * 2. MUCH more significantly: `qsymbol`'s `detail.symbol` is no longer a
 *    content-hash uniquely identifying one handler. Verified live
 *    (`q-CDy632GO.js` is the SAME chunk `useFocusOrigin()`'s `focusin` AND
 *    `focusout` AND `useRippleLoader()`'s shared ripple handler all
 *    compile into): every one of them reports `detail.symbol === "_run"` —
 *    a generic per-chunk dispatcher name, not a per-handler one (the
 *    distinguishing bit, which capture-set to invoke, is a `#<n>` suffix
 *    on the ATTRIBUTE value that never reaches the `qsymbol` event at
 *    all). Worse: qwikloader's own per-(symbol, qBase, chunk) resolution
 *    cache means `qsymbol` for `("_run", qBase, "q-CDy632GO.js")` fires
 *    ONCE, on whichever of those three handlers happens to resolve it
 *    first — confirmed live, blurring the button after clicking it (which
 *    resolves `focusout`, sharing that exact chunk+symbol with the
 *    already-resolved `focusin`/ripple handler) produced NO new `"_run"`
 *    event at all. So "did `qsymbol` report symbol `S`" can no longer
 *    answer "did THIS SPECIFIC handler run" once a GROUP of handlers
 *    shares a chunk — only "did ANY handler in that group run yet".
 *
 * This file now asks only what v2's `qsymbol` can actually answer:
 * grouped by the DOM ELEMENT a `qsymbol` event's (non-serializable)
 * `detail.element` reference points at (`matchesElement()` below), "has
 * ANY handler on element E run yet" — still a fully faithful check of this
 * test's actual contract (no eager per-instance execution before
 * interaction; execution does happen once interacted with), just unable
 * to additionally prove the FINER claim "handler H specifically, out of
 * several sharing element E, stayed lazy independently of its siblings".
 * Where the original test used that finer claim (`focusout` deferring
 * past `focusin`'s own resolution), this version instead checks
 * `useFocusOrigin()`'s own OBSERVABLE effect — the `cdk-focused`/
 * `cdk-mouse-focused` classes it drives — appearing after focus and
 * clearing after blur, which still proves the full round trip (focus in,
 * then back out) actually executed, just via behavior instead of an
 * internal loader event.
 */

/** Everything this file needs from one fired `qsymbol` event. */
interface FiredSymbol {
  symbol: string;
  /** Opaque handle Playwright can resolve back to the real element — see `matchesElement()`. */
  elementHandle: unknown;
}

/**
 * Installs a `qsymbol` listener before any page script runs, returning a live array of fired
 * events (each carrying the resolved handler's target element, not serialized — compare it via
 * `matchesElement()`, which runs a real identity check inside the page instead of trying to
 * serialize a `Node` across the Playwright protocol boundary).
 */
async function trackFiredSymbols(page: Page): Promise<{all: () => Promise<FiredSymbol[]>}> {
  await page.addInitScript(() => {
    (window as unknown as {__fired: {symbol: string; element: unknown}[]}).__fired = [];
    document.addEventListener('qsymbol', ev => {
      const detail = (ev as CustomEvent<{symbol: string; element?: unknown}>).detail;
      (window as unknown as {__fired: {symbol: string; element: unknown}[]}).__fired.push({
        symbol: detail.symbol,
        element: detail.element,
      });
    });
  });
  return {
    all: async () => {
      const raw = await page.evaluateHandle(
        () => (window as unknown as {__fired: {symbol: string; element: unknown}[]}).__fired,
      );
      const length = await page.evaluate(arr => (arr as unknown[]).length, raw);
      const out: FiredSymbol[] = [];
      for (let i = 0; i < length; i++) {
        const symbol = await page.evaluate(
          ([arr, idx]) => (arr as {symbol: string}[])[idx as number].symbol,
          [raw, i] as const,
        );
        const elementHandle = await page.evaluateHandle(
          ([arr, idx]) => (arr as {element: unknown}[])[idx as number].element,
          [raw, i] as const,
        );
        out.push({symbol, elementHandle});
      }
      return out;
    },
  };
}

/** True if a fired event's target element is the SAME live DOM node as `target` (identity, not value). */
async function matchesElement(
  page: Page,
  fired: FiredSymbol,
  target: ElementHandle,
): Promise<boolean> {
  return page.evaluate(([a, b]) => a === b, [fired.elementHandle, target] as const);
}

/** Whether ANY fired `qsymbol` event's target element is `target` — see the module doc comment for why this file can no longer ask "which handler specifically", only "has this element's group of handlers started executing". */
async function anyFiredOn(
  page: Page,
  events: FiredSymbol[],
  target: ElementHandle,
): Promise<boolean> {
  for (const ev of events) {
    if (await matchesElement(page, ev, target)) return true;
  }
  return false;
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
  test('mat-button: focus-origin + ripple-loader stay unexecuted until the first interaction', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    await openAndSettle(page, '/mat-button/filled/');

    const button = page.locator('[data-parity-root] button, [data-parity-root] a').first();
    const buttonHandle = (await button.elementHandle())!;

    // Sanity: both hooks are actually wired to this host — fail loudly if
    // the DOM contract regresses instead of silently passing on an element
    // with no listeners at all. No `pointerdown` here any more
    // (2026-11-01, Qwik v2 upgrade): `useFocusOrigin()` used to attach its
    // own lazy `useOn('pointerdown', ...)` listener per-instance, but under
    // v2 that raced its own `focusin` handler's resolution for the SAME
    // gesture (two different QRLs, no longer guaranteed to resolve in
    // dispatch order) — fixed by moving pointer-modality tracking to
    // `<QwikCdkRoot>`'s eager, synchronous inline `<script>` instead (see
    // `qwik-cdk/a11y/SYNC.md`'s 2026-11-01 entry), which isn't a
    // per-component `q-e:pointerdown` attribute at all.
    for (const evt of ['focusin', 'focusout', 'focus', 'mousedown', 'mouseenter', 'touchstart']) {
      expect(await button.getAttribute(`q-e:${evt}`), `expected a q-e:${evt} attribute`).toBeTruthy();
    }

    expect(
      await anyFiredOn(page, await symbols.all(), buttonHandle),
      'no handler on this button must have executed before any interaction',
    ).toBe(false);
    await expect(button).not.toHaveClass(/cdk-focused/);

    // A real click exercises both hooks: it moves focus in (useFocusOrigin)
    // and fires focus/mousedown/mouseenter (useRippleLoader).
    await button.click();
    await page.waitForTimeout(300);

    expect(
      await anyFiredOn(page, await symbols.all(), buttonHandle),
      'at least one handler on this button must have executed after a click',
    ).toBe(true);
    // The observable effect of useFocusOrigin()'s `focusin` handler having
    // actually run — see the module doc comment for why this file checks
    // BEHAVIOR here rather than trying to isolate `focusin`'s own qsymbol
    // from the ripple handler's (both share a chunk+symbol under v2, so a
    // SINGLE qsymbol event covers either/both — it can no longer tell
    // them apart on its own).
    await expect(button).toHaveClass(/cdk-focused/);
    await expect(button).toHaveClass(/cdk-mouse-focused/);

    // `focusout`'s own round trip: blur the button and confirm its
    // BEHAVIORAL effect (origin clearing) actually happens — `.blur()`
    // fires a real (non-bubbling) blur AND a bubbling focusout
    // synchronously — more reliable than clicking some other element and
    // hoping it isn't itself focusable. (`qsymbol` can't be used for this
    // specific check: focusout shares `focusin`/the ripple handler's exact
    // chunk+symbol, and qwikloader's own per-chunk resolution cache means
    // no NEW qsymbol event fires once that chunk is already warm —
    // confirmed live.)
    await button.evaluate(el => (el as HTMLElement).blur());
    await page.waitForTimeout(300);
    await expect(button).not.toHaveClass(/cdk-focused/);
    await expect(button).not.toHaveClass(/cdk-mouse-focused/);
  });

  test('mat-button-toggle: focus-origin stays unexecuted until the first interaction', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    await openAndSettle(page, '/mat-button-toggle/basic/');

    // useFocusOrigin() attaches to MatButtonToggle's own host — the outer
    // <mat-button-toggle role="presentation">, not the inner <button> the
    // user actually clicks (focusin bubbles up from the inner button, so
    // the outer element still sees it). No `pointerdown` here any more —
    // see the `mat-button` test above's comment on why.
    const toggleHost = page.locator('mat-button-toggle').first();
    const toggleButton = toggleHost.locator('button');
    const toggleHostHandle = (await toggleHost.elementHandle())!;

    for (const evt of ['focusin', 'focusout']) {
      expect(
        await toggleHost.getAttribute(`q-e:${evt}`),
        `expected a q-e:${evt} attribute`,
      ).toBeTruthy();
    }

    expect(
      await anyFiredOn(page, await symbols.all(), toggleHostHandle),
      'no handler on this toggle must have executed before any interaction',
    ).toBe(false);
    await expect(toggleHost).not.toHaveClass(/cdk-focused/);

    await toggleButton.click({force: true});
    await page.waitForTimeout(300);

    expect(
      await anyFiredOn(page, await symbols.all(), toggleHostHandle),
      'the focusin handler must have executed after a click',
    ).toBe(true);
    await expect(toggleHost).toHaveClass(/cdk-focused/);
    await expect(toggleHost).toHaveClass(/cdk-mouse-focused/);
  });

  test('mat-progress-bar: transitionend handler stays unexecuted until a transition actually fires', async ({
    page,
  }) => {
    const symbols = await trackFiredSymbols(page);
    // "query" mode never transitions (continuous indeterminate animation,
    // no determinate value) — the handler must never execute here. This is
    // a pure negative check (nothing is ever expected to fire), so there is
    // no "which specific handler" ambiguity to worry about — see the
    // module doc comment's `qsymbol`-granularity caveat, which only bites
    // POSITIVE "did handler H specifically run" checks sharing a chunk with
    // an already-resolved sibling.
    await openAndSettle(page, '/mat-progress-bar/query/');

    const bar = page.locator('mat-progress-bar').first();
    const barHandle = (await bar.elementHandle())!;
    expect(
      await bar.getAttribute('q-e:transitionend'),
      'expected a q-e:transitionend attribute',
    ).toBeTruthy();

    expect(
      await anyFiredOn(page, await symbols.all(), barHandle),
      'no handler on a query-mode progress bar must ever execute (it never transitions)',
    ).toBe(false);
  });
});
