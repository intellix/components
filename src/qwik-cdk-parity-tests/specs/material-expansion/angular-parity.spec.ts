import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-expansion';

/**
 * Angular DOM reference: src/dev-app/qwik-parity/expansion.ts (route `mat-expansion`).
 * Every scenario renders inside `<div data-parity-root>`. Ids are auto-generated
 * (`mat-expansion-panel-header-N` on headers, `cdk-accordion-child-N` on the matching
 * content region) — the harness squashes digits, but the *cross-references* must still
 * line up: a header's `id`/`aria-controls` pair with the content region's
 * `aria-labelledby`/`id`. Framework bookkeeping comments (Angular's `@if`/control-flow
 * anchors, the `cdkPortalOutlet` anchor) appear as `<!--container-->` nodes; the harness
 * only walks Elements, so these never need to be reproduced.
 *
 * Shared structure (`MatExpansionPanel` + `MatExpansionPanelHeader`), from
 * src/material/expansion/expansion-panel.html and expansion-panel-header.html:
 *   <mat-expansion-panel class="mat-expansion-panel [mat-expanded] [mat-expansion-panel-spacing]
 *                                mat-expansion-panel-animations-enabled">
 *     <mat-expansion-panel-header role="button" class="mat-expansion-panel-header
 *         mat-focus-indicator [mat-expanded]
 *         [mat-expansion-toggle-indicator-after|mat-expansion-toggle-indicator-before]"
 *         id="mat-expansion-panel-header-N" tabindex="0|-1"
 *         aria-controls="cdk-accordion-child-N" aria-expanded="true|false" aria-disabled="true|false">
 *       <span class="mat-content [mat-content-hide-toggle]">
 *         <mat-panel-title class="mat-expansion-panel-header-title">…</mat-panel-title>   (optional)
 *         <mat-panel-description class="mat-expansion-panel-header-description">…</mat-panel-description>  (optional)
 *       </span>
 *       <span class="mat-expansion-indicator">  (omitted when hideToggle OR disabled)
 *         <svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false"><path d="…"/></svg>
 *       </span>
 *     </mat-expansion-panel-header>
 *     <div class="mat-expansion-panel-content-wrapper" [inert=""]>   (inert present while collapsed)
 *       <div role="region" class="mat-expansion-panel-content" id="cdk-accordion-child-N"
 *            aria-labelledby="mat-expansion-panel-header-N">
 *         <div class="mat-expansion-panel-body">
 *           …panel content…
 *         </div>
 *         <mat-action-row class="mat-action-row">…</mat-action-row>   (optional, always present in DOM)
 *       </div>
 *     </div>
 *   </mat-expansion-panel>
 *
 * Key, easy-to-miss behaviors a from-scratch read of the Angular source would miss:
 *
 * - `mat-expansion-panel-animations-enabled` is added to the panel host ~200ms after init
 *   (whenever animations are enabled, which is the dev-app's default) — see
 *   `_setupAnimationEvents` in expansion-panel.ts. It never goes away. All scenarios wait
 *   for it on every `.mat-expansion-panel` before the first comparison (the `settle` step
 *   below); the Qwik port must add the same class on the same ~200ms delay.
 * - All OTHER expand/collapse-driven DOM changes (classes, `aria-*`, the wrapper's `inert`,
 *   header height) happen synchronously with the click/keydown that caused them — they do
 *   NOT wait for the CSS transition (225ms grid-template-rows on the content wrapper, 190ms
 *   visibility on the content region, both gated on `.mat-expansion-panel-animations-enabled`
 *   being present) to finish. Structural parity does not depend on that transition completing.
 * - The toggle-position class is driven by `panel.togglePosition`, which falls back from the
 *   panel's own input to `panel.accordion?.togglePosition` — and is `undefined` (no class at
 *   all) for a standalone panel that sets neither. So a bare `<mat-expansion-panel>` with no
 *   `togglePosition` input and no accordion gets NEITHER `mat-expansion-toggle-indicator-after`
 *   NOR `-before`, while the exact same panel placed inside a `<mat-accordion>` (default
 *   `togglePosition="after"`) gets `mat-expansion-toggle-indicator-after` for free. See 'basic'
 *   (no class) vs 'accordion-single'/'accordion-multi'/'accordion-flat' (class present).
 * - `disabled` implies hidden toggle too: `_showToggle()` is `!hideToggle && !disabled`, so a
 *   disabled panel gets `mat-content-hide-toggle` and no `<span class="mat-expansion-indicator">`
 *   even though `hideToggle` itself is `false`. See 'disabled'.
 * - Clicking (or otherwise focusing) a *disabled* header still runs through `FocusMonitor`
 *   (`tabindex="-1"` only removes it from the Tab order, it doesn't block focus) — the header
 *   still gains `cdk-focused`/`cdk-mouse-focused` etc. Only the toggle itself is a no-op.
 * - Closing a panel while focus was inside its body moves focus back to the header, via
 *   `FocusMonitor.focusVia(header, 'program')` (`panel.closed` + `_containsFocus()` in
 *   expansion-panel-header.ts) — so the header ends up with `cdk-focused cdk-program-focused`
 *   even though nothing clicked the header itself. See 'action-row'.
 * - Arrow-key / Home / End navigation inside an accordion (`MatAccordion._handleHeaderKeydown`)
 *   moves focus via `FocusKeyManager`, whose default focus origin is `'program'` (accordion.ts
 *   never calls `setFocusOrigin('keyboard')`) — so headers reached via arrow keys get
 *   `cdk-focused cdk-program-focused`, NOT `cdk-keyboard-focused`. Only a real Tab keypress
 *   (browser-native, not key-manager-driven) produces `cdk-keyboard-focused`. `withWrap()` is
 *   NOT used for Home/End — End on the last header / Home on the first header is a no-op.
 * - Lazy content (`<ng-template matExpansionPanelContent>`) renders nothing until the panel
 *   is opened for the first time (`take(1)` on `panel.opened`), and then stays rendered even
 *   if the panel is closed again — it is never torn down.
 * - Click/keydown steps below include a short settle wait: the dev-app's zone-coalesced change
 *   detection can otherwise render one event behind the next when the same page is hit with
 *   back-to-back interactions with no intervening async work, which doesn't reflect a real
 *   difference between Angular and Qwik — just needs a tick to flush.
 *
 * Scenarios (Type → EXPANSION_SCENARIOS key):
 *
 * - **basic**: standalone `<mat-expansion-panel>`, not in an accordion, collapsed. Header has
 *   a `<mat-panel-title>` ("Personal data") and `<mat-panel-description>` ("Type your name and
 *   age"); body has one `<p>` of content. A `<p>Opened: false</p>` below the panel reflects the
 *   panel's `(opened)`/`(closed)` outputs. No `togglePosition` class (see above). Steps: click
 *   header → opens (`Opened: true`); click again → closes; Tab from a sentinel before the root
 *   into the header (keyboard focus) then press Enter → opens; press Space → closes.
 * - **initially-expanded**: standalone panel, `[(expanded)]` bound and starts `true`. Header
 *   has only a title ("Billing address"); a `<p>Expanded: true</p>` below reflects the bound
 *   value. No steps beyond settle — this checks the initial-expanded render only.
 * - **disabled**: standalone panel with `[disabled]="true"`. Header title "Destination" +
 *   description "Type the country name"; `tabindex="-1"`, `aria-disabled="true"`,
 *   `mat-content-hide-toggle` present, no indicator `<span>`. Step: click the header (force,
 *   since Playwright treats `aria-disabled="true"` as non-actionable) — expect NO toggle (still
 *   collapsed, `inert` still present) but the header does still pick up `cdk-focused`/
 *   `cdk-mouse-focused` from FocusMonitor.
 * - **hide-toggle**: standalone panel with `[hideToggle]="true"`. Header title "No indicator";
 *   no indicator `<span>`, `mat-content-hide-toggle` present, but (unlike 'disabled')
 *   `tabindex="0"` and toggling still works. Step: click header → opens; click again → closes.
 * - **toggle-position-before**: standalone panel with `[togglePosition]="'before'"`. Header
 *   title "Indicator before the title"; header has `mat-expansion-toggle-indicator-before`
 *   (indicator `<span>` still renders, CSS alone repositions it). Step: click header → opens
 *   (class persists through the toggle).
 * - **header-heights**: standalone panel, `[(expanded)]` starts `false`. The *header* (not the
 *   panel) has `[expandedHeight]="'64px'"` and `[collapsedHeight]="'32px'"`, producing an inline
 *   `style="height: 32px"` while collapsed. Title "Custom header heights". Steps: click header
 *   → opens, inline height becomes `64px`; click again → closes, height back to `32px`.
 * - **action-row**: standalone panel, `[(expanded)]` starts `true`. Header title "Confirm
 *   changes"; body has one `<p>` of content followed by `<mat-action-row>` with two plain
 *   `<button type="button">` ("CANCEL", "SAVE" — no `matButton`, deliberately, to keep this
 *   scenario decoupled from the button component), each wired to set `expanded = false`. The
 *   action row is always in the DOM (visibility, not presence, is what CSS collapses). Step:
 *   click the CANCEL button → panel closes (`inert` reappears) AND — because focus was inside
 *   the body when it closed — the header regains focus as `cdk-focused cdk-program-focused`
 *   (see behavior note above).
 * - **lazy-content**: standalone panel, `[(expanded)]` starts `false`. Header title
 *   "Lazy-rendered content"; body uses `<ng-template matExpansionPanelContent>` wrapping one
 *   `<p>` — initially nothing renders inside `.mat-expansion-panel-body` but comment anchors.
 *   Steps: click header → opens, the `<p>` now renders inside the body; click again → closes,
 *   the `<p>` remains in the DOM (lazy content renders once, is never torn down).
 * - **accordion-single**: `<mat-accordion>` (default: `multi=false`, `displayMode="default"`,
 *   `togglePosition="after"`) with two panels, each with only a `<mat-panel-title>` ("Section
 *   1" / "Section 2") and one `<p>` of content. Panel 1 starts expanded (`mat-expanded` +
 *   `mat-expansion-panel-spacing` on panel 1 only), panel 2 collapsed. Both headers get
 *   `mat-expansion-toggle-indicator-after` (inherited from the accordion). Steps: click header
 *   1 (index 1 = "Section 2") → panel 2 opens AND panel 1 auto-closes (unique-selection
 *   dispatcher, since `multi=false`); click header 0 → panel 1 reopens and panel 2 auto-closes.
 * - **accordion-multi**: `<mat-accordion [multi]="true">` (adds `mat-accordion-multi` class)
 *   with three panels ("Alpha"/"Beta"/"Gamma"), all collapsed initially. Steps: click header 0,
 *   then header 1 → BOTH end up expanded simultaneously (no auto-close, confirming `multi`);
 *   then — to exercise accordion keyboard navigation — Tab from a sentinel into header 0 (real
 *   keyboard focus → `cdk-keyboard-focused`); press ArrowDown → focus moves to header 1 (origin
 *   `program`, per the behavior note above — header 0 loses its focus classes); press
 *   ArrowDown again → focus moves to header 2; press End → no-op, focus stays on header 2 (no
 *   wrap); press Home → focus moves to header 0.
 * - **accordion-flat**: `<mat-accordion [displayMode]="'flat'">` with two panels ("Flat section
 *   1" / "Flat section 2"), both collapsed. Step: click header 0 → panel 1 expands
 *   (`mat-expanded` on the panel) but — unlike 'accordion-single' — `mat-expansion-panel-spacing`
 *   is NEVER added, because that class requires `displayMode === 'default'`.
 */

const SETTLE_MS = 150;

/** Waits for the one-time, time-delayed `.mat-expansion-panel-animations-enabled` class (see
 * the big comment above) on every panel, so the first comparison isn't racing that timer. */
const settle: ParityStep = {
  name: 'settle (post-init animation class)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.mat-expansion-panel')).every(el =>
          el.classList.contains('mat-expansion-panel-animations-enabled'),
        ),
      undefined,
      {timeout: 3000},
    );
  },
};

const clickHeader = (index: number): ParityStep => ({
  name: `click header ${index}`,
  run: async (page: Page) => {
    await page.locator('.mat-expansion-panel-header').nth(index).click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

const clickActionButton = (index: number): ParityStep => ({
  name: `click action-row button ${index}`,
  run: async (page: Page) => {
    await page.locator('.mat-action-row button').nth(index).click({force: true});
    await page.waitForTimeout(SETTLE_MS);
  },
});

const pressKey = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(SETTLE_MS);
  },
});

/** Tabs into the first header from a sentinel placed just before the parity root (the dev-app
 * chrome differs between the two apps, so natural Tab order from the top of the page differs). */
const tabIntoFirstHeader: ParityStep = {
  name: 'Tab into first header',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(SETTLE_MS);
  },
};

test.describe('mat-expansion — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      skipInitialCompare: true,
      steps: [
        settle,
        clickHeader(0),
        clickHeader(0),
        tabIntoFirstHeader,
        pressKey('Enter'),
        pressKey('Space'),
      ],
    }));

  test('initially-expanded', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'initially-expanded',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0)],
    }));

  test('hide-toggle', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'hide-toggle',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0), clickHeader(0)],
    }));

  test('toggle-position-before', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'toggle-position-before',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0)],
    }));

  test('header-heights', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'header-heights',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0), clickHeader(0)],
    }));

  test('action-row', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'action-row',
      skipInitialCompare: true,
      steps: [settle, clickActionButton(0)],
    }));

  test('lazy-content', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'lazy-content',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0), clickHeader(0)],
    }));

  test('accordion-single', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'accordion-single',
      skipInitialCompare: true,
      steps: [settle, clickHeader(1), clickHeader(0)],
    }));

  test('accordion-multi', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'accordion-multi',
      skipInitialCompare: true,
      steps: [
        settle,
        clickHeader(0),
        clickHeader(1),
        tabIntoFirstHeader,
        pressKey('ArrowDown'),
        pressKey('ArrowDown'),
        pressKey('End'),
        pressKey('Home'),
      ],
    }));

  test('accordion-flat', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'accordion-flat',
      skipInitialCompare: true,
      steps: [settle, clickHeader(0)],
    }));
});
