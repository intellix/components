import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * mat-tooltip — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/tooltip.ts (exports
 * `TOOLTIP_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-tooltip/<scenario>).
 * The Qwik side must render the same markup at http://localhost:4173/mat-tooltip/<scenario>/.
 *
 * TWO roots per scenario, because the tooltip's own content never lives where its trigger
 * does:
 *
 *   - `[data-parity-root]` (the default root) — the trigger element(s) only. This is where
 *     `MatTooltip`'s host bindings/attributes live: the static `mat-mdc-tooltip-trigger`
 *     class, the conditional `mat-mdc-tooltip-disabled` class, and (via `AriaDescriber`) the
 *     `aria-describedby`/`cdk-describedby-host` attributes. Every trigger is a plain native
 *     `<button>` (not `matButton`) with a *static*, never-bound, fixed `position`/size inline
 *     style (see tooltip.ts), so the overlay's pixel geometry below is reproducible regardless
 *     of surrounding dev-app chrome.
 *   - `.cdk-overlay-container` (passed as `rootSelector`) — the floating tooltip panel, which
 *     CDK always renders under `<body>`, as a sibling of the page's own content. It does not
 *     exist in the DOM at all until the first tooltip anywhere on the page is shown; once
 *     created it persists (empty) for the rest of the page's life, so "hidden" states compare
 *     an existing-but-empty container, not an absent one.
 *
 * Every scenario below therefore has two `test()`s — `<scenario> (trigger)` and `<scenario>
 * (overlay)` — running the identical step sequence against the two different roots. This
 * mirrors the dual-root approach already used for dialogs (see material-dialog's and
 * cdk-dialog's angular-parity.spec.ts).
 *
 * OUTSIDE both roots entirely (a real, accepted gap — not a bug): `AriaDescriber` appends a
 * single hidden `<div class="cdk-describedby-message-container cdk-visually-hidden"
 * style="visibility:hidden">` directly to `<body>` (sibling of both roots above), containing
 * one `<div id="cdk-describedby-message-<APP_ID>-<n>" role="tooltip">` per distinct message
 * text, which is what the trigger's `aria-describedby` points at. Neither root selector
 * reaches it, so its own markup is never diffed — only the normalized, harness-ignored
 * *reference* to it (`cdk-describedby-message-ng-1-14` → `cdk-describedby-message`, see
 * `material-parity.ts`) is. No harness change is needed for this spec; documented here only so
 * a future reader isn't surprised that the message text itself is untested.
 *
 * VERIFIED LIVE (http://localhost:4200/qwik-parity/mat-tooltip/<scenario>, Chromium, repeated
 * runs) — the exact shape every scenario's overlay compare below depends on:
 *
 *   <div class="cdk-overlay-container">
 *     <div popover="manual" class="cdk-overlay-popover cdk-overlay-connected-position-bounding-box"
 *          dir="ltr" style="inset: 0px auto auto 0px; height: 100%; width: 100%;">
 *       <div id="cdk-overlay-#" class="cdk-overlay-pane mat-mdc-tooltip-panel mat-mdc-tooltip-panel-<pos>"
 *            style="top: ...px; left: ...px; transform: translateY(8px)|translateX(±8px);">
 *         <mat-tooltip-component aria-hidden="true">
 *           <div class="mdc-tooltip mat-mdc-tooltip mat-mdc-tooltip-show" style="transform-origin: ...">
 *             <div class="mat-mdc-tooltip-surface mdc-tooltip__surface">{{message}}</div>
 *           </div>
 *         </mat-tooltip-component>
 *       </div>
 *     </div>
 *   </div>
 *
 *   - The bounding-box `style` is a CONSTANT (`inset: 0px auto auto 0px; height: 100%; width:
 *     100%;`) regardless of trigger position — it is the pane's own `top`/`left`/`transform`
 *     that carries the actual computed geometry. Given this spec's fixed-position/fixed-size
 *     triggers and Playwright's default viewport, those pixel values were observed stable
 *     across repeated runs (e.g. the `basic` pane: `top: 168px; left: 132.539px;`).
 *   - `popover="manual"` + `cdk-overlay-popover`: this build of the CDK overlay backs its
 *     connected-position bounding box with the native Popover API. Not tooltip-specific, but
 *     worth flagging since tooltip is the first `FlexibleConnectedPositionStrategy`-based
 *     component to get a parity spec (dialog uses a global/centered strategy with no
 *     bounding-box element).
 *   - `id="cdk-overlay-#"` on the pane is harness-normalized (digits squashed; `id` is in
 *     `ID_ATTRS`).
 *   - The show/hide classes (`mat-mdc-tooltip-show` / `mat-mdc-tooltip-hide`) are toggled by
 *     `TooltipComponent._toggleVisibility` directly via `classList`, bypassing Angular's
 *     `[class]` binding entirely (upstream comment: "so that toggling the tooltip state isn't
 *     bound by change detection"). Unlike checkbox's `mdc-checkbox--anim-*` or dialog's
 *     `mdc-dialog--opening`, there is **no transient class that gets removed once an animation
 *     finishes** — the show/hide class IS the steady visible/hidden state, for as long as the
 *     tooltip stays that way. The waits below therefore don't wait out a transition; they wait
 *     for a stable "exactly one shown pane" / "zero panes" condition, which also absorbs the
 *     brief window where hovering directly from one trigger to the next can leave the old
 *     pane attached a render frame after the new one has already synchronously attached.
 *   - Resolved position classes: `_updateCurrentPositionClass` only ever produces one of
 *     `mat-mdc-tooltip-panel-{above,below,left,right}` — `matTooltipPosition="before"` and
 *     `"after"` do NOT produce `-panel-before`/`-panel-after`; in LTR they resolve to
 *     `-panel-left` and `-panel-right` respectively (confirmed live in the `positions`
 *     scenario below: before → `-panel-left`, after → `-panel-right`, identical to the
 *     dedicated `left`/`right` buttons).
 *   - `matTooltipPositionAtOrigin="true"`: `_createOverlay`'s reuse check
 *     (`(!positionAtOrigin || !origin) && existingStrategy._origin instanceof ElementRef`)
 *     is false whenever an origin point is supplied, so EVERY show while `positionAtOrigin` is
 *     true detaches and recreates a brand-new `OverlayRef` (a new `cdk-overlay-N` pane, not a
 *     reused one) — harmless here since the id is normalized away, but worth knowing.
 *   - `[matTooltipDisabled]="true"` from the very first render: the host gets
 *     `mat-mdc-tooltip-disabled`, but — confirmed live — it NEVER gets `aria-describedby` /
 *     `cdk-describedby-host` either. `MatTooltip._syncAriaDescription` is only ever scheduled
 *     once per describe/undescribe pair (guarded by `_ariaDescriptionPending`); the *first*
 *     call comes from the `message` input's setter (which runs before the `disabled` input's
 *     setter, per this scenario's attribute order), schedules a single `afterNextRender(write
 *     => …)`, and the second call (from the `disabled` setter) is a no-op because the guard is
 *     already set. By the time that scheduled callback finally runs, `this.disabled` is
 *     already `true`, so its `if (this.message && !this.disabled)` guard skips `describe()`
 *     entirely — no description is ever created. `hover`ing a disabled trigger is a complete
 *     no-op at the JS level too: `_setupPointerEnterEventsIfNeeded` returns immediately when
 *     `disabled` (no `mouseenter` listener is ever attached), so there is nothing async to
 *     wait for before comparing.
 *   - FocusMonitor side effects on the trigger (`[data-parity-root]`, not the overlay):
 *     tabbing onto it (keyboard origin) adds `cdk-focused cdk-keyboard-focused` AND calls
 *     `show()`; a plain scripted `.focus()` with no preceding key/pointer event resolves to
 *     origin `'program'`, adding `cdk-focused cdk-program-focused` instead and — since
 *     `'program' !== 'keyboard'` — does NOT call `show()`. Both sets of classes persist after
 *     the tooltip is later hidden (Escape/mouseleave never blur the trigger).
 *   - Escape: the overlay's own `_overlayEventPredicate` forwards a keydown to its
 *     `keydownEvents()` stream (which unconditionally calls `hide(0)`) ONLY when the tooltip
 *     is visible, the key is Escape, and there's no modifier; any other keydown is filtered
 *     out by `BaseOverlayDispatcher.canReceiveEvent` before it ever reaches that subscription —
 *     confirmed live that pressing a non-Escape key while the trigger is focused does not
 *     close the tooltip.
 *   - Outside-interaction-closes (Material spec behavior, confirmed live and the reason
 *     `message-change` below is built the way it is): `OverlayOutsideClickDispatcher` attaches
 *     a *capturing* `click` listener on `<body>`, which — for ANY click landing outside the
 *     tooltip's own pane, anywhere on the page — fires `outsidePointerEvents()` →
 *     `_handleBodyInteraction()` → `hide(0)`, and it does so during the CAPTURE phase, i.e.
 *     strictly before the clicked element's own (bubble-phase) click handler runs. A first
 *     attempt at `message-change` used a separate "Change message" button; clicking it
 *     scheduled the hide microtask-before the click handler that mutated the message, so the
 *     update and the hide landed on the DOM within the same couple of ticks — a race, not a
 *     stable state to snapshot. The scenario instead changes the message via `(keydown.m)` on
 *     the trigger itself: a non-Escape keydown never reaches the dismiss path (previous
 *     bullet), so the tooltip stays open and only its text/geometry change.
 *   - That longer replacement message did NOT trigger `mdc-tooltip--multiline` in practice
 *     (`TooltipComponent._isTooltipMultiline`'s rect check returned false for it) — confirmed
 *     live, so no multiline class appears in any scenario below.
 *
 * Per-scenario render contract:
 *
 * - `basic`: one trigger button ("Action", `aria-label="Button that displays a tooltip when
 *   hovered or focused"`, fixed at top:120/left:120/160×48), `matTooltip="Info about the
 *   action"`, default position (`below`). Steps: hover → shows (panel class
 *   `-panel-below`); mouse away → hides; Tab onto the trigger from a sentinel inserted just
 *   before `[data-parity-root]` (same technique as material-checkbox's `tabIn`) → keyboard
 *   origin → shows again AND leaves `cdk-focused cdk-keyboard-focused` on the trigger; Escape →
 *   hides (focus classes remain).
 *
 * - `positions`: five triggers ("above"/"left"/"right"/"before"/"after", same aria-label
 *   pattern, each fixed 160×48 at left:320 and a distinct non-overlapping `top` 80px apart),
 *   each with a static `[matTooltipPosition]`. Steps: hover each in turn (old pane fully gone,
 *   new one fully shown, before comparing) — resolved panel classes `-panel-above`,
 *   `-panel-left`, `-panel-right`, `-panel-left` (from `before`), `-panel-right` (from
 *   `after`) — then a final mouse-away leaves the overlay empty again.
 *
 * - `show-hide-delay`: one trigger, `matTooltipShowDelay="50"` + `matTooltipHideDelay="50"`.
 *   Steps: hover → waits for the single-shown condition (absorbing the 50ms delay) → compare;
 *   mouse away → waits for the zero-panes condition → compare.
 *
 * - `disabled`: one trigger, `[matTooltipDisabled]="true"`. Host carries
 *   `mat-mdc-tooltip-disabled` but, per the bullet above, no `aria-describedby`. Step: hover —
 *   a genuine no-op (no listener was ever attached) — DOM must stay byte-for-byte identical to
 *   the initial snapshot on both roots.
 *
 * - `tooltip-class`: one trigger, `[matTooltipClass]="{'custom-one': true, 'custom-two':
 *   true}"` (the same object-map form `BasicTooltipDemo` uses in tooltip.spec.ts). Steps:
 *   hover → shown, with `custom-one custom-two` merged into the tooltip surface's host div's
 *   class list (alongside `mdc-tooltip mat-mdc-tooltip mat-mdc-tooltip-show`); mouse away →
 *   hidden.
 *
 * - `touch-gestures-off`: one trigger, `[matTooltipTouchGestures]="'off'"`. On a non-touch
 *   desktop Chromium context (Playwright's default), `_isTouchPlatform()` is false regardless
 *   of this input, so `touchGestures` never changes any DOM (no host binding reflects it) —
 *   the rendered markup is structurally identical to `basic`'s hover/mouse-away pair. This
 *   scenario exists to prove the Qwik port accepts and ignores the prop exactly as Angular
 *   does, the same role `aria-label`/`aria-labelledby` scenarios play for material-checkbox.
 *
 * - `position-at-origin`: one larger trigger (200×200, fixed top:160/left:160),
 *   `[matTooltipPositionAtOrigin]="true"`. Step: hover with an explicit offset
 *   (`{position: {x: 20, y: 20}}`, i.e. near the top-left corner rather than Playwright's
 *   default center) — the tooltip anchors to that pointer coordinate instead of the element's
 *   geometric center, producing a pane `left` offset measurably different from a center-hover
 *   on the same element (confirmed live: corner-hover → `left: 114.539px`; center-hover on the
 *   same button → `left: 192.539px`, and a brand-new `OverlayRef`/pane per the bullet above).
 *
 * - `message-change`: one trigger, `[matTooltip]="message"` (initially "Info about the
 *   action") plus `(keydown.m)="changeMessage()"` on the SAME button. Steps: hover → shown;
 *   focus the trigger directly (`locator.focus()`, no click — origin `'program'`, adds
 *   `cdk-focused cdk-program-focused`, does NOT re-trigger `show()`) then press `m` → the
 *   surface text updates to "Updated tooltip text that is noticeably longer than before" and
 *   the pane repositions (confirmed live: `left` moves from `132.539px` to the viewport-margin-
 *   clamped `100px`), tooltip stays open throughout; mouse away → hides.
 */

const route = 'mat-tooltip';
const overlayRoot = '.cdk-overlay-container';

const trigger = (page: Page, index = 0) =>
  page.locator('[data-parity-root] .tooltip-trigger').nth(index);

/** Exactly one shown pane — robust against the old-pane-lingers-a-frame race described above. */
const waitForTooltipShown = (page: Page) =>
  page.waitForFunction(
    () => {
      const panes = document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel');
      return panes.length === 1 && !!panes[0].querySelector('.mat-mdc-tooltip-show');
    },
    undefined,
    {timeout: 5000},
  );

/** No panes at all — the (already-created) `.cdk-overlay-container` is left empty. */
const waitForTooltipHidden = (page: Page) =>
  page.waitForFunction(
    () => document.querySelectorAll('.cdk-overlay-pane.mat-mdc-tooltip-panel').length === 0,
    undefined,
    {timeout: 5000},
  );

const hover = (index = 0, position?: {x: number; y: number}): ParityStep => ({
  name: `hover trigger ${index}`,
  run: async (page: Page) => {
    await trigger(page, index).hover(position ? {position} : undefined);
    await waitForTooltipShown(page);
  },
});

/** For `disabled`: hovering never schedules anything async, so there is nothing to wait for. */
const hoverNoShow = (index = 0): ParityStep => ({
  name: `hover trigger ${index} (disabled, no-op)`,
  run: (page: Page) => trigger(page, index).hover(),
});

const leave: ParityStep = {
  name: 'mouse leave',
  run: async (page: Page) => {
    await page.mouse.move(0, 0);
    await waitForTooltipHidden(page);
  },
};

const escape: ParityStep = {
  name: 'press Escape',
  run: async (page: Page) => {
    await page.keyboard.press('Escape');
    await waitForTooltipHidden(page);
  },
};

/** Tabs into the trigger from a sentinel placed just before the root (dev-app chrome differs). */
const tabToTrigger: ParityStep = {
  name: 'Tab focus trigger (keyboard origin)',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      sentinel.className = 'tab-sentinel';
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await waitForTooltipShown(page);
  },
};

/** Focuses the trigger WITHOUT a click/pointer event (origin `'program'`), then types `m`. */
const changeMessageViaKeydown: ParityStep = {
  name: 'focus trigger + press "m" (change message while open)',
  run: async (page: Page) => {
    await trigger(page).focus();
    await page.keyboard.press('m');
    await page.waitForFunction(
      () =>
        document.querySelector('.mat-mdc-tooltip-surface')?.textContent?.trim() ===
        'Updated tooltip text that is noticeably longer than before',
      undefined,
      {timeout: 5000},
    );
  },
};

test.describe('mat-tooltip — Angular DOM parity', () => {
  const basicSteps = [hover(), leave, tabToTrigger, escape];

  test('basic (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: basicSteps}));

  test('basic (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector: overlayRoot,
      steps: basicSteps,
    }));

  const positionsSteps = [hover(0), hover(1), hover(2), hover(3), hover(4), leave];

  test('positions (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'positions', steps: positionsSteps}));

  test('positions (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'positions',
      rootSelector: overlayRoot,
      steps: positionsSteps,
    }));

  const showHideDelaySteps = [hover(), leave];

  test('show-hide-delay (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'show-hide-delay', steps: showHideDelaySteps}));

  test('show-hide-delay (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'show-hide-delay',
      rootSelector: overlayRoot,
      steps: showHideDelaySteps,
    }));

  const disabledSteps = [hoverNoShow()];

  test('disabled (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled', steps: disabledSteps}));

  test('disabled (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled',
      rootSelector: overlayRoot,
      steps: disabledSteps,
    }));

  const tooltipClassSteps = [hover(), leave];

  test('tooltip-class (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'tooltip-class', steps: tooltipClassSteps}));

  test('tooltip-class (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'tooltip-class',
      rootSelector: overlayRoot,
      steps: tooltipClassSteps,
    }));

  const touchGesturesOffSteps = [hover(), leave];

  test('touch-gestures-off (trigger)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'touch-gestures-off',
      steps: touchGesturesOffSteps,
    }));

  test('touch-gestures-off (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'touch-gestures-off',
      rootSelector: overlayRoot,
      steps: touchGesturesOffSteps,
    }));

  const positionAtOriginSteps = [hover(0, {x: 20, y: 20}), leave];

  test('position-at-origin (trigger)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'position-at-origin',
      steps: positionAtOriginSteps,
    }));

  test('position-at-origin (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'position-at-origin',
      rootSelector: overlayRoot,
      steps: positionAtOriginSteps,
    }));

  const messageChangeSteps = [hover(), changeMessageViaKeydown, leave];

  test('message-change (trigger)', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'message-change', steps: messageChangeSteps}));

  test('message-change (overlay)', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'message-change',
      rootSelector: overlayRoot,
      steps: messageChangeSteps,
    }));
});
