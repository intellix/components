import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-sidenav';

/**
 * mat-drawer / mat-sidenav — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/sidenav.ts (exports
 * `SIDENAV_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-sidenav/<scenario>).
 * The Qwik side must render the same markup at http://localhost:4173/mat-sidenav/<scenario>/
 * inside its own `[data-parity-root]`. Every scenario's container has a fixed inline size
 * (`style="height: 300px; width: 600px"`) so the inline margins the container computes for its
 * content are deterministic pixel numbers.
 *
 * Shared structure, from src/material/sidenav/drawer.html, drawer-container.html,
 * sidenav-container.html and the `MatDrawer`/`MatDrawerContainer` host bindings in
 * src/material/sidenav/drawer.ts (the `mat-sidenav-*` tags add nothing structurally beyond an
 * extra class — see `fixed-in-viewport` below):
 *
 *   <mat-drawer-container class="mat-drawer-container [mat-drawer-transition]
 *                                [mat-drawer-container-has-open] [mat-drawer-container-explicit-backdrop]">
 *     [<div class="mat-drawer-backdrop [mat-drawer-shown]"></div>]   (see "backdrop presence" below)
 *     [<div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" [tabindex="0"]></div>]
 *     <mat-drawer class="mat-drawer [mat-drawer-end] [mat-drawer-over|-push|-side] [mat-drawer-opened]"
 *                 [tabindex="-1"]>              (tabindex="-1" present unless mode="side")
 *       <div class="mat-drawer-inner-container" cdkscrollable>
 *         …projected content…
 *       </div>
 *     </mat-drawer>
 *     [<div class="cdk-visually-hidden cdk-focus-trap-anchor" aria-hidden="true" [tabindex="0"]></div>]
 *     <mat-drawer-content class="mat-drawer-content"
 *                          [style="margin-left: Npx"] [style="margin-right: Npx"]>
 *       …projected content…
 *     </mat-drawer-content>
 *   </mat-drawer-container>
 *
 * At v21.2.14, `<mat-drawer-content>`/`<mat-sidenav-content>` never carries an `inert` attribute
 * — that's a newer-than-21.2.14 upstream feature (`MatDrawerContent._drawerToggled`'s
 * `delay(50)`-gated `setAttribute('inert', 'true')`), removed from the Qwik port during the
 * v21.2.14 rebaseline (see sidenav/SYNC.md).
 *
 * Each `<mat-drawer>`/`<mat-sidenav>` is always flanked by its own pair of CDK focus-trap anchor
 * `<div>`s (`FocusTrapFactory.create` in `ngAfterViewInit`, before paint — never racy), inserted
 * as its immediate siblings in the container, i.e. one *inside* the container's child list right
 * before the drawer and one right after (NOT inside the drawer). The anchors never carry
 * `tabindex` unless the drawer is BOTH opened AND actually showing a backdrop
 * (`FocusTrap.enabled = opened && container._isShowingBackdrop()`); when that's true both anchors
 * get `tabindex="0"`, otherwise neither has a `tabindex` attribute at all (not `tabindex="-1"` —
 * fully absent). A `mode="side"` drawer's anchors therefore never get a `tabindex`, because a
 * side-mode drawer has no backdrop by default (see below) — confirmed live via `mode-side`.
 *
 * Backdrop presence vs. visibility — two different things, easy to conflate:
 *   - The `<div class="mat-drawer-backdrop">` element itself is only rendered AT ALL
 *     (`@if (hasBackdrop)`) when `hasBackdrop` is true, i.e. `_backdropOverride ?? (mode !== 'side')`.
 *     Default (no `[hasBackdrop]` binding): present for `over`/`push`, ABSENT ENTIRELY (not
 *     hidden — not in the DOM) for `side`. An explicit `[hasBackdrop]="false"` removes it for
 *     EVERY mode, including `over`/`push` (see `has-backdrop-false`).
 *   - Given the element exists, `mat-drawer-shown` (and thus actual visibility) is additionally
 *     gated on at least one drawer being open (`_isShowingBackdrop()`).
 *   - `mat-drawer-container-explicit-backdrop` on the container is added only when `hasBackdrop`
 *     was explicitly bound to exactly `true` — `[class.mat-drawer-container-explicit-backdrop]`
 *     binds the raw (possibly-null) override value directly, so an explicit `false` does NOT add
 *     the class (confirmed live: `has-backdrop-false` carries neither the backdrop div nor this
 *     class).
 *   - `mat-drawer-container-has-open` on the container toggles only for drawers whose
 *     `mode !== 'side'` (`MatDrawerContainer._watchDrawerToggle`) — it's independent of whether a
 *     backdrop is actually showing, so it's present on `has-backdrop-false` while open even
 *     though that scenario never shows (or even renders) a backdrop.
 *
 * Timing (every scenario's spec steps below account for this via the shared `settle`/
 * `waitSettled` helpers — see their doc comments):
 *   - `MatDrawerContainer` adds `mat-drawer-transition` to itself ~200ms after init (skipped only
 *     to avoid animating a drawer that's open by default) — this is itself part of the compared
 *     DOM (a class on the container), so every scenario's spec waits for it before ANY
 *     comparison, including the very first one (`skipInitialCompare: true` + a `settle` step,
 *     same pattern as mat-expansion's `mat-expansion-panel-animations-enabled` wait).
 *   - After that point, opening/closing runs a real 400ms CSS transform transition, during which
 *     the drawer carries a transient `mat-drawer-animating` class. `openedChange` (and so any
 *     `(opened)`/`(closed)` output, e.g. the `<p>Opened: …</p>` scenarios) only fires once that
 *     transition's `transitionend` lands — content margins, however, update essentially
 *     immediately on click (before the transition finishes), since they're driven by
 *     `_animationStarted`, not `_animationEnd`. Waiting for `.mat-drawer-animating` to clear
 *     safely covers all of it, exactly like mat-checkbox's `mdc-checkbox--anim-*` wait.
 *   - A drawer that starts `[opened]="true"` (no user interaction) never gets the
 *     `mat-drawer-animating` class at all and its margin/opened-output updates land on the very
 *     next tick (well under the 200ms above) — `initially-opened` and `two-drawers` confirm this
 *     live (no steps beyond the shared initial `settle`).
 *
 * Focus behavior (verified live; NOT directly asserted by the structural DOM diff itself — which
 * node currently has browser focus isn't part of the compared tree — except indirectly through
 * the focus-trap anchors' `tabindex` above, but still real behavior the Qwik port must reproduce,
 * and exercised by every click step below so a divergent implementation would at minimum leave
 * stray focus-reachable elements):
 *   - Opening a drawer moves focus into it per `autoFocus` (default: `'first-tabbable'` unless
 *     `mode === 'side'`, where it defaults to `'dialog'`, i.e. no auto-focus) — moving focus into
 *     the drawer happens independently of whether the focus trap is actually `enabled`
 *     (`_takeFocus` doesn't check it), so `has-backdrop-false` still auto-focuses the "Close"
 *     button even though its anchors never gain a `tabindex`. If the drawer has no focusable
 *     descendant at all, focus lands on the drawer host itself (`disable-close`, confirmed live —
 *     this is why that drawer has no "Close" button: it is intentionally unclosable, so there's
 *     nothing in it to focus).
 *   - Closing a drawer restores focus to whatever was focused right before it opened — the
 *     "Toggle"/"Open" button in every scenario here — whether the close was triggered by clicking
 *     a button inside the drawer, Escape, or a backdrop click.
 *
 * Per-scenario render contract (see src/dev-app/qwik-parity/sidenav.ts for the exact templates):
 *
 * - **mode-over**: `<mat-drawer-container>` holding one `[mode]="'over'"` drawer (`<p>Drawer
 *   content</p>` + a "Close" button that calls `drawer.close()`) and a `<mat-drawer-content>`
 *   with a "Toggle" button (`drawer.toggle()`) and `<p>Opened: {{opened}}</p>` fed by
 *   `(opened)`/`(closed)`. Backdrop div present (over ⇒ `hasBackdrop` true by default), not shown
 *   while closed. The most exhaustively-exercised scenario — steps: (1) click "Toggle" → opens:
 *   backdrop becomes `mat-drawer-shown`, drawer gains `mat-drawer-opened`, container gains
 *   `mat-drawer-container-has-open`, both focus-trap anchors gain
 *   `tabindex="0"`, focus lands on "Close" (first tabbable in the drawer), text becomes "Opened:
 *   true"; (2) click "Close" (inside the drawer) → closes, all of the above reverts, focus
 *   restores to "Toggle"; (3) click "Toggle" → opens again; (4) press `Escape` (focus is on
 *   "Close", inside the drawer, so the drawer's own keydown listener catches it) → closes, focus
 *   restores to "Toggle"; (5) click "Toggle" → opens again; (6) click the backdrop → closes via
 *   `_closeViaBackdropClick`, focus restores to "Toggle".
 * - **mode-push**: one `[mode]="'push'" style="width: 200px"` drawer (just `<p>Push drawer</p>`,
 *   no close button) + content with "Toggle" + `<p>Opened: …</p>`. Backdrop present (push also
 *   defaults `hasBackdrop` true — easy to assume otherwise). Steps: (1) click "Toggle" → opens:
 *   same backdrop/open/has-open/anchor changes as `mode-over`, PLUS `<mat-drawer-content>`
 *   gets BOTH `margin-left: 200px` AND `margin-right: -200px` simultaneously (push shifts without
 *   resizing — it adds to one side and subtracts the same amount from the other;
 *   `MatDrawerContainer.updateContentMargins`); drawer has no focusable content so focus lands on
 *   the drawer host itself (no `[disableClose]` here — this is just because the drawer's only
 *   content is a `<p>`); (2) click "Toggle" again → closes, margins clear (reverts to no `style`
 *   attribute with meaningful declarations — Angular's style bindings can leave a stale empty
 *   `style=""` attribute behind, which is harmless: the harness only compares *parsed
 *   declarations*, and an empty style has none).
 * - **mode-side**: one `[mode]="'side'" style="width: 180px"` drawer + content with "Toggle" +
 *   `<p>Opened: …</p>`. NO backdrop div in the DOM at all (`side` ⇒ `hasBackdrop` false by
 *   default). Steps: (1) click "Toggle" → opens: drawer gains `mat-drawer-opened`, content gains
 *   `margin-left: 180px` only (no `margin-right`), container does NOT gain
 *   `mat-drawer-container-has-open` (side mode is explicitly excluded from that subscription),
 *   anchors stay without `tabindex` (no backdrop ⇒
 *   trap never enabled), focus stays on "Toggle" (side mode's `autoFocus` default is `'dialog'`
 *   ⇒ no auto-focus) and `<p>Opened: …</p>` never changes from `false` because this scenario's
 *   `(opened)`/`(closed)` aren't wired to anything (the `<p>` always reads a fixed `opened = false`
 *   field) — only the structural classes/attributes matter here, not that text; (2) click
 *   "Toggle" again → closes, margin clears.
 * - **initially-opened**: `[mode]="'side'" [opened]="true" style="width: 220px"` drawer (`<p>
 *   Already open</p>`) + plain content `<p>Always open on load</p>`. No steps beyond the shared
 *   `settle` — this checks the synchronous-at-load render only: drawer already carries
 *   `mat-drawer-opened` and content already has `margin-left: 220px`, with NO
 *   `mat-drawer-animating` ever having appeared (the open-on-init path is simulated instantly,
 *   not via the real CSS transition — see the timing note above).
 * - **position-end**: one `[position]="'end'" [mode]="'over'"` drawer ("End drawer" + "Close"
 *   button) + content with "Toggle". DOM ORDER (not just visual position) differs from a
 *   start-position drawer: children of `<mat-drawer-container>` are, in order: backdrop div,
 *   `<mat-drawer-content>`, the drawer's leading focus-trap anchor, `<mat-drawer>`, the drawer's
 *   trailing focus-trap anchor — the drawer is physically the LAST element child, moved there by
 *   `MatDrawer._updatePositionInParent('end')` in `ngAfterViewInit` (synchronous, before paint —
 *   stable from the very first render, confirmed live over repeated loads). Steps: (1) click
 *   "Toggle" → opens (same backdrop/anchor/focus behavior as `mode-over`); (2) click
 *   "Close" → closes, focus restores to "Toggle".
 * - **two-drawers**: two side-mode drawers, both `[opened]="true"`: `[position]="'start'"
 *   style="width: 150px"` ("Start") and `[position]="'end'" style="width: 120px"` ("End"), plus
 *   plain content `<p>Content between two side drawers</p>`. No steps beyond `settle`. DOM order:
 *   start-drawer's leading anchor, `<mat-drawer>` (start, `mat-drawer-opened mat-drawer-side`),
 *   start-drawer's trailing anchor, `<mat-drawer-content>`, end-drawer's leading anchor,
 *   `<mat-drawer>` (end, `mat-drawer-opened mat-drawer-end mat-drawer-side`), end-drawer's
 *   trailing anchor — NO backdrop div (both side, no override). Content gets BOTH
 *   `margin-left: 150px` AND `margin-right: 120px` simultaneously (independent per-side
 *   contributions in `side` mode — unlike `push`, there's no subtraction from the other side).
 * - **has-backdrop-false**: `<mat-drawer-container [hasBackdrop]="false">` with one
 *   `[mode]="'over'"` drawer ("Drawer without backdrop" + "Close" button) + content with
 *   "Toggle". No backdrop div at all, and never `mat-drawer-container-explicit-backdrop` (see the
 *   "backdrop presence" note above — explicit `false` doesn't add that class). Steps: (1) click
 *   "Toggle" → opens: drawer gains `mat-drawer-opened`, container STILL gains
 *   `mat-drawer-container-has-open` (that class only cares about `mode !== 'side'`, not backdrop),
 *   anchors stay without `tabindex`, but focus STILL auto-moves to
 *   "Close" (auto-focus-on-open doesn't check whether the trap is enabled); (2) click "Close" →
 *   closes, focus restores to "Toggle".
 * - **disable-close**: one `[mode]="'over'" [disableClose]="true"` drawer containing only
 *   `<p>Cannot be closed via escape/backdrop</p>` (deliberately no focusable content/buttons) +
 *   content with an "Open" button (`drawer.open()` — there is no toggle, since this scenario
 *   only ever opens). Backdrop div present (over's default). Steps: (1) click "Open" → opens
 *   (backdrop shown, `mat-drawer-opened`, `has-open`, anchors `tabindex="0"`); because
 *   the drawer has NO focusable descendant, focus lands on the `<mat-drawer>` HOST element itself
 *   (`FocusTrap.focusInitialElement()` returns false ⇒ `MatDrawer._takeFocus` falls back to
 *   `element.focus()` — this is why `<mat-drawer>` always carries `tabindex="-1"` outside `side`
 *   mode, so it's itself focusable); (2) press `Escape` → NO CHANGE AT ALL (the keydown listener
 *   on the drawer sees `disableClose` and does nothing — DOM must be byte-identical to before
 *   this step); (3) click the backdrop → also NO CHANGE (`_closeModalDrawersViaBackdrop` filters
 *   out any drawer with `disableClose`).
 * - **autosize**: `<mat-drawer-container [autosize]="true">` with one `[mode]="'push'"
 *   [opened]="true" style="width: auto"` drawer: `<p>Autosizing drawer</p>`, a filler
 *   `<div [style.width.px]="fillerWidth" style="height: 20px">` (starts `fillerWidth = 0`), and a
 *   "Toggle extra width" button that flips `fillerWidth` between `0` and `150`; content is a
 *   plain `<p>Main content</p>`. The drawer's own `width` is overridden to `auto` (the compiled
 *   M3 theme otherwise gives `.mat-drawer` a FIXED `width: 360px`, which would make content
 *   growth a no-op) so its measured `offsetWidth` genuinely tracks content — confirmed live: at
 *   rest (filler width 0) the drawer's natural content (the "Autosizing drawer" text + button)
 *   already measures 128px, so initial content margins are `margin-left: 128px; margin-right:
 *   -128px` (push), backdrop already shown, already focus-trap-enabled (this
 *   drawer starts open). Steps: (1) click "Toggle extra width" → filler grows to 150px wide,
 *   `ngDoCheck`'s 10ms-debounced autosize reflow recalculates: margins become `margin-left:
 *   150px; margin-right: -150px` — no CSS-transition class is involved here (nothing opens or
 *   closes), so the same `waitSettled` helper used everywhere else (which also tolerates "nothing
 *   to wait for") covers the debounce with room to spare; (2) click "Toggle extra width" again →
 *   filler back to 0, margins back to 128/-128.
 * - **fixed-in-viewport**: uses the `<mat-sidenav-container>`/`<mat-sidenav>`/
 *   `<mat-sidenav-content>` tags instead of the `mat-drawer-*` ones (the only scenario that
 *   does) specifically to prove those tags add nothing beyond one extra class each —
 *   `mat-sidenav-container` class alongside `mat-drawer-container`, `mat-sidenav` alongside
 *   `mat-drawer`, `mat-sidenav-content` alongside `mat-drawer-content`; everything else
 *   (backdrop rules, margins, anchors) works identically to the `mat-drawer-*` scenarios above.
 *   One `[mode]="'side'" [opened]="true" [fixedInViewport]="true" [fixedTopGap]="64"
 *   [fixedBottomGap]="32" style="width: 200px"` sidenav (`fixedInViewport`/`fixedTopGap`/
 *   `fixedBottomGap` exist only on `MatSidenav`, not `MatDrawer`) + plain
 *   `<mat-sidenav-content><p>Content</p></mat-sidenav-content>`. No steps beyond `settle`.
 *   Renders with class `mat-sidenav-fixed` and inline `style="top: 64px; bottom: 32px"` on the
 *   `<mat-sidenav>` (separate from its `width: 200px`), plus `margin-left: 200px` on the content
 *   (side mode, opened).
 */

/**
 * Waits for the one-time, time-delayed `mat-drawer-transition` class (see the big comment above)
 * on the container, so the first comparison isn't racing that 200ms timer — this is itself part
 * of the compared DOM (a class on `.mat-drawer-container`), so every scenario needs it before ANY
 * comparison, not just the first. Folds in `waitSettled` so an initially-opened drawer's
 * synchronous-at-load margin state (see the timing note above) is also settled.
 */
const settle: ParityStep = {
  name: 'settle (post-init: transition-enabled)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () => {
        const container = document.querySelector('[data-parity-root] .mat-drawer-container');
        return !!container && container.classList.contains('mat-drawer-transition');
      },
      undefined,
      {timeout: 3000},
    );
    await waitSettled(page);
  },
};

/**
 * Waits for upstream's transient `mat-drawer-animating` class (added for the duration of the
 * real 400ms open/close CSS transition, removed on `transitionend` — see the header comment)
 * to clear. A no-op wait (resolves immediately) when the preceding action never
 * added the class at all — e.g. `autosize`'s filler-width toggle, which doesn't open/close
 * anything. Using a condition wait rather than a fixed sleep means both apps settle on their own
 * schedule before the structural diff runs, so two independently-timed browser contexts can
 * never race each other into a false mismatch — the same pattern as mat-checkbox's
 * `mdc-checkbox--anim-*` wait.
 */
async function waitSettled(page: Page): Promise<void> {
  await page.waitForFunction(
    () => !document.querySelector('[data-parity-root] .mat-drawer-animating'),
    undefined,
    {timeout: 3000},
  );
  await page.waitForTimeout(150);
}

/** Scopes to this scenario's own drawer/content, never the dev-app's own chrome. */
const root = (page: Page) => page.locator('[data-parity-root]');

const click = (selector: string, name: string): ParityStep => ({
  name,
  run: async (page: Page) => {
    await root(page).locator(selector).click({force: true});
    await waitSettled(page);
  },
});

const pressKey = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitSettled(page);
  },
});

const clickToggle = click('.mat-drawer-content button:has-text("Toggle")', 'click Toggle');
const clickOpen = click('.mat-drawer-content button:has-text("Open")', 'click Open');
const clickClose = click('.mat-drawer button:has-text("Close")', 'click Close (inside drawer)');
const clickBackdrop = click('.mat-drawer-backdrop', 'click backdrop');
const clickToggleExtraWidth = click(
  '.mat-drawer button:has-text("Toggle extra width")',
  'click Toggle extra width',
);

test.describe('mat-sidenav — Angular DOM parity', () => {
  test('mode-over', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'mode-over',
      skipInitialCompare: true,
      steps: [
        settle,
        clickToggle,
        clickClose,
        clickToggle,
        pressKey('Escape'),
        clickToggle,
        clickBackdrop,
      ],
    }));

  test('mode-push', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'mode-push',
      skipInitialCompare: true,
      steps: [settle, clickToggle, clickToggle],
    }));

  test('mode-side', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'mode-side',
      skipInitialCompare: true,
      steps: [settle, clickToggle, clickToggle],
    }));

  test('initially-opened', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'initially-opened',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('position-end', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'position-end',
      skipInitialCompare: true,
      steps: [settle, clickToggle, clickClose],
    }));

  test('two-drawers', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'two-drawers',
      skipInitialCompare: true,
      steps: [settle],
    }));

  test('has-backdrop-false', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'has-backdrop-false',
      skipInitialCompare: true,
      steps: [settle, clickToggle, clickClose],
    }));

  test('disable-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disable-close',
      skipInitialCompare: true,
      steps: [settle, clickOpen, pressKey('Escape'), clickBackdrop],
    }));

  test('autosize', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'autosize',
      skipInitialCompare: true,
      steps: [settle, clickToggleExtraWidth, clickToggleExtraWidth],
    }));

  test('fixed-in-viewport', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'fixed-in-viewport',
      skipInitialCompare: true,
      steps: [settle],
    }));
});
