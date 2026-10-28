import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-stepper';

/**
 * mat-stepper — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/stepper.ts (exports
 * `STEPPER_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-stepper/<scenario>). The
 * Qwik side must render the same markup at http://localhost:4173/mat-stepper/<scenario>/ inside
 * its own `[data-parity-root]`.
 *
 * Every `<mat-stepper>` is given a fixed inline `style="width: 480px"` (a plain DOM attribute,
 * not a Material input) so wrapping/line lengths don't depend on the surrounding dev-app chrome,
 * which differs between the Angular and Qwik dev-apps. Navigation buttons are plain
 * `<button matStepperNext>`/`<button matStepperPrevious>` — no `matButton` — so the comparison
 * stays scoped to the stepper's own DOM contract.
 *
 * ========================================================================================
 * SHARED STRUCTURE (src/material/stepper/stepper.html, step-header.html; classes/host bindings
 * from stepper.ts, step-header.ts, cdk/stepper/stepper.ts):
 *
 *   <mat-stepper class="mat-stepper-horizontal|mat-stepper-vertical
 *                       [mat-stepper-label-position-end|-bottom] [mat-stepper-header-position-bottom]
 *                       [mat-stepper-animating] mat-stepper-animations-enabled"
 *                style="width: 480px; --mat-stepper-animation-duration: 500ms|225ms;">
 *                                      (500ms horizontal / 225ms vertical — see note 1)
 *
 *     ===== horizontal =====
 *     <div class="mat-horizontal-stepper-wrapper">
 *       <div role="tablist" aria-orientation="horizontal" class="mat-horizontal-stepper-header-container">
 *         <mat-step-header role="tab" class="mat-step-header mat-horizontal-stepper-header
 *                                            mat-{primary|accent|warn} [cdk-focused cdk-*-focused]"
 *                          tabindex="0|-1" id="cdk-stepper-#-label-#"
 *                          aria-posinset="N" aria-setsize="N" aria-selected="true|false"
 *                          aria-controls="cdk-stepper-#-content-#"
 *                          [aria-disabled="true"]>            (see note 2 — isNavigable() only)
 *           <div matripple class="mat-ripple mat-step-header-ripple mat-focus-indicator"></div>
 *           <div class="mat-step-icon mat-step-icon-state-{number|edit|done|error}
 *                       [mat-step-icon-selected]">
 *             <div class="mat-step-icon-content">
 *               <!-- state=number: --> <span aria-hidden="true">N</span>
 *               <!-- state=done:   --> <span class="cdk-visually-hidden">Completed</span>
 *                                      <mat-icon aria-hidden="true">done</mat-icon>
 *               <!-- state=edit:   --> <span class="cdk-visually-hidden">Editable</span>
 *                                      <mat-icon aria-hidden="true">create</mat-icon>
 *               <!-- state=error:  --> <mat-icon aria-hidden="true">warning</mat-icon>  (no hidden span)
 *             </div>
 *           </div>
 *           <div class="mat-step-label [mat-step-label-active] [mat-step-label-selected]
 *                       [mat-step-label-error]">
 *             <div class="mat-step-text-label">…label text/portal…</div>   (see note 3)
 *             <div class="mat-step-optional">Optional</div>                 (optional && state!=error)
 *             <div class="mat-step-sub-label-error">…errorMessage…</div>    (state==error)
 *           </div>
 *         </mat-step-header>
 *         <div class="mat-stepper-horizontal-line"></div>     (between every pair of headers)
 *       </div>
 *       <div class="mat-horizontal-content-container">
 *         <div role="tabpanel" class="mat-horizontal-stepper-content
 *                                     mat-horizontal-stepper-content-{previous|current|next}"
 *                                     (see note 4 — NOT "-left/-right/-can-animate" like tabs)
 *              id="cdk-stepper-#-content-#" aria-labelledby="cdk-stepper-#-label-#"
 *              [inert]>                        (present on every non-current body)
 *           …step content (always attached — see note 5)…
 *         </div>
 *         …one per step, same order as the headers…
 *       </div>
 *     </div>
 *
 *     ===== vertical =====
 *     <div class="mat-vertical-stepper-wrapper">
 *       <div class="mat-step">
 *         <mat-step-header role="button" class="mat-step-header mat-vertical-stepper-header
 *                                               mat-{primary|accent|warn} [cdk-focused cdk-*-focused]"
 *                          tabindex="0|-1" id="cdk-stepper-#-label-#"
 *                          [aria-current="step"] [aria-expanded="true|false"]
 *                          aria-controls="cdk-stepper-#-content-#"
 *                          [aria-disabled="true"]>    (same isNavigable()-only rule — see note 2)
 *           …identical ripple/icon/label markup as horizontal…
 *         </mat-step-header>
 *         <div class="mat-vertical-content-container [mat-stepper-vertical-line]
 *                     [mat-vertical-content-container-active]" [inert]
 *                     [aria-label]="…stepper's own aria-label, not step-specific…">
 *           <div role="region" class="mat-vertical-stepper-content" id="cdk-stepper-#-content-#"
 *                aria-labelledby="cdk-stepper-#-label-#">
 *             <div class="mat-vertical-content">…step content…</div>
 *           </div>
 *         </div>
 *       </div>
 *       …one per step…
 *     </div>
 *
 * `<mat-step>` itself NEVER appears in the live (non-SSR) DOM, for the identical reason tabs'
 * `<mat-tab>` doesn't (see material-tabs spec note 9): `stepper.html` only renders its own
 * `<ng-content/>` projection point `@if (_isServer)`, and the dev-app is CSR, so `_isServer` is
 * always `false`. All step content reaches the DOM exclusively through the
 * `mat-horizontal-stepper-content`/`mat-vertical-stepper-content` wrappers via `ngTemplateOutlet`.
 *
 * NON-OBVIOUS BEHAVIORS VERIFIED LIVE:
 *
 * 1. **Default animation duration is 500ms for horizontal, 225ms for vertical**
 *    (`MatStepper._getAnimationDuration()`), surfaced as the `--mat-stepper-animation-duration`
 *    custom property on the host, which the SCSS's `transition` rules consume. The host also
 *    gains `mat-stepper-animations-enabled` ~200ms after content-init (`ngAfterContentInit`'s
 *    delayed `setTimeout`, to avoid animating the initial render) — confirmed always already
 *    present by the time any spec step below runs (page load + Playwright overhead exceeds
 *    200ms). Every `selectedIndex` change toggles a transient host class
 *    `mat-stepper-animating` (`_isAnimating` signal), cleared on the matching `transitionend`
 *    (~500ms/~225ms later, confirmed live within ~550ms for a horizontal switch). Every step
 *    below that changes the selection waits (`page.waitForFunction`) for
 *    `.mat-stepper-animating` to clear under `[data-parity-root]`, plus a small fixed buffer —
 *    see `waitForStepperSettled` below — before comparing.
 * 2. **`aria-disabled` is governed *solely* by `step.isNavigable()`** (`null` when navigable,
 *    `"true"` otherwise) — confirmed live in both orientations. The template
 *    (`stepper.html`) also contains a SECOND, earlier `[attr.aria-disabled]` binding tied to
 *    `orientation === 'vertical' && step.isSelected()`; it is fully superseded by the later
 *    binding on the same element and is **never observable** (confirmed live: a selected,
 *    vertical step-header has no `aria-disabled` attribute at all). `isNavigable()` is
 *    `completed || selected || !stepper.linear` — in **every non-linear scenario below,
 *    `aria-disabled` never appears**, regardless of `editable`, because `!linear` alone makes
 *    every step "navigable" for ARIA purposes. This is orthogonal to the separate,
 *    `editable`-driven backward-navigation block described in `editable-false` below: a step
 *    can be ARIA-enabled (navigable) yet still silently refuse to become selected on a
 *    backward click. `aria-disabled="true"` only actually appears in `linear-required` (the
 *    one linear scenario), on its not-yet-reachable second step.
 * 3. **Label rendering**: a `<ng-template matStepLabel>` with plain text renders as a LEAF
 *    `.mat-step-text-label` div (the harness captures its `textContent`); with nested markup
 *    (`custom-label`'s `<strong>Step two</strong> (custom)`) the div gets one element child
 *    (`<strong>`) PLUS a trailing text node — same accepted harness limitation as
 *    `material-tabs`' `custom-label` note (`structural-diff`'s walk only captures text on a
 *    LEAF element, so that trailing " (custom)" text is never compared on either side; only
 *    the `<strong>Step two</strong>` element and the overall structure are). A plain string
 *    `[label]="'…'"` input (no `<ng-template>`) renders through the *other* branch
 *    (`_stringLabel()`) producing the identical `.mat-step-text-label` leaf-with-text markup —
 *    confirmed byte-identical DOM to the template form for plain text (`custom-label`'s first
 *    step uses `[label]="'Step one'"` for exactly this contrast).
 * 4. **Horizontal body position classes are named `mat-horizontal-stepper-content-{previous|
 *    current|next}`** (`_getAnimationDirection`), NOT `-left/-right/-can-animate` like
 *    `mat-tabs`' tab bodies — a different naming scheme despite the visually analogous role.
 *    Direction is purely sign-based on `index - selectedIndex` (any step before the selected
 *    one is `previous`, any step after is `next`, regardless of distance — confirmed in
 *    `selected-index-initial`, where both steps 0 and 1 get `-previous` although neither is
 *    adjacent to the initially-selected step 2).
 * 5. **Step content is never detached**, unlike `mat-tabs`' lazy/leave-detach behavior: EVERY
 *    step's content div is always present in the DOM (only `[inert]` toggles), regardless of
 *    orientation or how many times you navigate away and back — there is no `preserveContent`-
 *    style distinction for plain (non-`matStepContent`) content. (None of the scenarios below
 *    use the `<ng-template matStepContent>` lazy-content directive, so that one-way-attach
 *    mechanism — attach-once-on-first-select, never detach — isn't exercised here.)
 * 6. **Programmatic vs. mouse focus origin**: advancing via a `matStepperNext`/
 *    `matStepperPrevious` button (or any other means that doesn't click the header itself)
 *    gives the newly-active header `cdk-focused cdk-program-focused` (confirmed live) — the
 *    stepper calls `FocusKeyManager.setActiveItem`/`updateActiveItem`, whose default focus
 *    origin is `'program'`. A direct mouse click on a step-header instead gives it
 *    `cdk-focused cdk-mouse-focused` (same category as `mat-tabs` note 13). Tab-ing into a
 *    header, or arrow-key navigation, gives `cdk-focused cdk-keyboard-focused`.
 * 7. **Keyboard navigation is "manual activation"**, same pattern as `mat-tabs`: ArrowRight/
 *    ArrowLeft move *focus* only (roving `tabindex`, `cdk-focused cdk-keyboard-focused`) —
 *    `aria-selected`/icon state/body visibility do NOT change. Only Enter or Space, when the
 *    focused header differs from the selected one, actually selects
 *    (`CdkStepper._onKeydown`). Navigation **wraps** (`.withWrap()`) — confirmed live:
 *    ArrowLeft from the first header moves focus to the last. Home/End do NOT wrap (confirmed:
 *    End→last, then one ArrowLeft→second-to-last, no wrap). **ArrowRight/ArrowLeft work in
 *    BOTH orientations** — confirmed live on `vertical-basic` — because `CdkStepper` always
 *    calls `.withHorizontalOrientation(dir)` (from a `Directionality` subscription that fires
 *    regardless of orientation), while `.withVerticalOrientation(…)` (enabling ArrowUp/ArrowDown)
 *    is only ever turned on for `orientation === 'vertical'`. So a vertical stepper's headers
 *    respond to all four arrow keys; a horizontal stepper's only to Left/Right.
 * 8. **Clicking a header that mouse-focuses it is independent of whether the resulting
 *    selection attempt succeeds.** In `editable-false`, clicking the (non-navigable-by-
 *    `editable`, but still ARIA-enabled per note 2) first header while step 2 is selected is a
 *    no-op for SELECTION (step 2 stays selected, `aria-selected`/icon states unchanged) but
 *    NOT a no-op for the clicked header's own focus classes — it still gains
 *    `cdk-focused cdk-mouse-focused` (confirmed live), because the click is a real, unblocked
 *    DOM click (the header isn't `aria-disabled`, so nothing stops the browser from focusing
 *    it) even though the stepper's internal `editable` check silently discards the resulting
 *    `select()` call before it reaches `_updateSelectedItemIndex` (so the roving `tabindex`
 *    stays on the still-selected header — only the clicked header's own FocusMonitor classes
 *    change). Clicking the *button* `matStepperPrevious` while blocked is simpler: the button
 *    itself is what receives native focus (not any header), so the previously-focused header
 *    simply loses its focus classes with no new header gaining them.
 * 9. Angular's reactive-forms status classes (`ng-untouched`/`ng-pristine`/`ng-invalid`/
 *    `ng-dirty`/`ng-valid`/`ng-touched`) appear on the plain `<input [formControl]>` used in
 *    `linear-required` and `error-state` — these come from `@angular/forms`' `NgControlStatus`
 *    directive, not from anything stepper- or Material-specific, and the harness's
 *    `IGNORE_CLASSES` list doesn't special-case them, so they ARE part of the compared DOM.
 *    They are present only because the task scope calls for a genuine
 *    `FormControl`+`Validators.required` to exercise `CdkStepper`'s own `linear`/`stepControl`
 *    gating logic; the Qwik side has no equivalent forms module and **must** toggle the same
 *    six classes by hand (based on the control's touched/dirty/valid state) to match —
 *    decision: reproduce them, don't special-case them away.
 * 10. `matStepperNext`/`matStepperPrevious` are consumer-written selector attributes (reported
 *     below for `CONSUMER_SELECTOR_ATTRS`, not edited here) — but the CLASS (`mat-stepper-next`/
 *     `mat-stepper-previous`) and the `type` attribute (`"submit"`/`"button"` respectively) on
 *     the plain `<button>` they decorate are the directives' OWN host bindings
 *     (`CdkStepperNext`/`CdkStepperPrevious` in `cdk/stepper/stepper-button.ts`), not
 *     consumer-chosen — same category as `matripple`, must be reproduced exactly. None of the
 *     scenarios below write an explicit `type` attribute, so the directive's default governs.
 *     `matStepLabel` never needs an entry (same reasoning as `mat-tabs`' `matTabLabel`): it
 *     decorates an `<ng-template>`, which never becomes a DOM element to compare.
 *
 * ========================================================================================
 * Per-scenario render contract (`STEPPER_SCENARIOS` key → class):
 *
 * - **horizontal-basic**: default orientation (horizontal), 3 steps ("Step one/two/three",
 *   bodies "Content for step N."), plain Next/Back buttons via `matStepperNext`/
 *   `matStepperPrevious`, no forms, not linear. `<p>Selected index: N</p>`. Starts on step 0
 *   (NUMBER icon "1", selected). Steps: Tab into header 0 from a sentinel (keyboard focus);
 *   ArrowRight (focus → header 1, no selection change); ArrowLeft ×2 (focus → header 0, then
 *   WRAPS to header 2, last); Home (focus → header 0); End (focus → header 2); ArrowLeft
 *   (focus → header 1, no wrap since not from an end); Enter (selects header 1 — "Selected
 *   index: 1", header 0 → EDIT icon since completed+editable, body position classes swap to
 *   `-previous`/`-current`/`-next` accordingly); click header 0 directly (mouse-selects it
 *   back, "Selected index: 0", header 0 gains `cdk-mouse-focused`).
 * - **vertical-basic**: `orientation="vertical"`, same 3 steps/buttons/labels as
 *   `horizontal-basic`. Headers get `role="button"`, `aria-current`/`aria-expanded` instead of
 *   `aria-posinset`/`aria-setsize`/`aria-selected`. Step 0's `.mat-vertical-content-container`
 *   starts `mat-vertical-content-container-active` (no `inert`); steps 1/2 have
 *   `mat-stepper-vertical-line` (all but the LAST step) and `inert`. Steps: Tab into header 0;
 *   ArrowDown (focus → header 1 — vertical-only key); ArrowRight (focus → header 2 — confirms
 *   horizontal arrows ALSO work in a vertical stepper, per note 7); click the Next button in
 *   the currently-active body (selects header 1, `--mat-stepper-animation-duration: 225ms`
 *   transition waited out, `mat-vertical-content-container-active` moves to step 1 along with
 *   `inert` moving onto step 0).
 * - **linear-required**: `[linear]="true"`, 2 steps: step 0 has `[stepControl]="nameCtrl"` (a
 *   `FormControl('', Validators.required)`) and a bare `<input [formControl]="nameCtrl">`
 *   (no `mat-form-field`/`matInput` — see task scope); step 1 ("Done") starts with
 *   `aria-disabled="true"` (not navigable — `linear` + step 0 incomplete, see note 2).
 *   `<p>Selected index: 0</p>`. Steps: click Next with the input still empty — BLOCKED
 *   no-op (`_anyControlsInvalidOrPending`), DOM unchanged except the input's reactive-forms
 *   classes are untouched (still `ng-untouched ng-pristine ng-invalid` — clicking Next does
 *   mark the step `interacted`, but that alone doesn't touch/dirty the control, so no class
 *   changes); fill the input with "Ada" (classes → `ng-dirty ng-valid ng-touched`, no
 *   selection change yet); click Next again — now succeeds: step 0 → EDIT icon (completed,
 *   editable, not selected), step 1 selected (NUMBER icon, `aria-disabled` gone), "Selected
 *   index: 1".
 * - **optional-step**: 3 steps, step 1 (`[optional]="true"`) gets an extra
 *   `.mat-step-optional` "Optional" div inside its label (sibling of `.mat-step-text-label`).
 *   Not linear. `<p>Selected index: 0</p>`. Step: click Next (selects step 1 — "Selected
 *   index: 1"; the `.mat-step-optional` div is unaffected by selection, it's present
 *   regardless of active/selected state as long as `optional` is set and state isn't `error`).
 * - **editable-false**: 3 steps, steps 0 AND 1 both `[editable]="false"`; step 2 default
 *   (editable). Not linear (so `aria-disabled` never appears on any header — note 2).
 *   `<p>Selected index: 0</p>`. Steps: click the current body's Next button (advances to step
 *   1 — step 0 is now completed+not-editable+not-selected → **DONE** icon, `cdk-visually-
 *   hidden`"Completed" + `<mat-icon>done</mat-icon>`); click Next again (advances to step 2 —
 *   step 1 also now DONE; "Selected index: 2"); click the current body's Back button — a
 *   complete selection no-op (step 2 stays selected: `previous()` tries index 1, but
 *   `steps[1].editable` is `false` so the backward move is silently discarded) — BUT the
 *   click still moves native DOM focus to the clicked `<button>` itself, which blurs whichever
 *   header previously held `cdk-program-focused`, so header 2 loses its focus classes (see
 *   note 8) even though it stays selected; click header 0 directly — also a selection no-op
 *   (same `editable` gate, reached via `step.select()` this time) but header 0 itself DOES
 *   gain `cdk-focused cdk-mouse-focused` since the click/focus on the header element itself is
 *   never blocked (see note 8) — header 2 remains selected/tabindex 0 throughout.
 * - **completed-step-icons**: 3 steps — step 0 default (`editable` true), step 1
 *   `[editable]="false"`, step 2 default. Not linear. `<p>Selected index: 0</p>`. Steps: click
 *   Next (step 0 → completed, not selected, editable → **EDIT** icon); click Next again (step
 *   1 → completed, not selected, NOT editable → **DONE** icon; step 0 remains EDIT). Final
 *   state shows all three icon variants side by side across the run: step 0 = EDIT (pencil),
 *   step 1 = DONE (check), step 2 = NUMBER "3" (selected).
 * - **custom-label**: 2 steps. Step 0 uses the plain string input `[label]="'Step one'"` (no
 *   `<ng-template>`) — renders through `_stringLabel()`'s branch, producing the same leaf
 *   `.mat-step-text-label` div as a template label would for plain text (see note 3). Step 1
 *   uses `<ng-template matStepLabel><strong>Step two</strong> (custom)</ng-template>` —
 *   renders `<strong>Step two</strong>` as an element child of `.mat-step-text-label` plus an
 *   un-compared trailing text node (note 3). `<p>Selected index: 0</p>`. Step: click header 1
 *   directly (mouse-selects it, "Selected index: 1").
 * - **label-position-bottom**: `[labelPosition]="'bottom'"`, 2 steps, step 1
 *   `[optional]="true"`. Host class `mat-stepper-label-position-bottom` instead of `-end`; no
 *   `labelposition`/`labelPosition` attribute of any kind on the host (bracket-bound inputs
 *   never echo — confirmed live). Purely a CSS/layout difference — no DOM reordering.
 *   `<p>Selected index: 0</p>`. Step: click Next (selects step 1, "Selected index: 1").
 * - **header-position-bottom**: `[headerPosition]="'bottom'"`, 2 steps. Host gains
 *   `mat-stepper-header-position-bottom` (CSS `order`/flex-direction flips the VISUAL position
 *   only — the header markup stays FIRST in DOM order ahead of
 *   `.mat-horizontal-content-container`, same non-reordering contract as `mat-tabs`'
 *   `headerPosition: 'below'`); no `headerposition`/`headerPosition` attribute on the host
 *   (confirmed live). `<p>Selected index: 0</p>`. Step: click Next (selects step 1, "Selected
 *   index: 1").
 * - **selected-index-initial**: `[selectedIndex]="2"`, 4 steps, not linear. Steps 0/1/2/3 all
 *   start with NUMBER icons (1/2/3/4) — jumping `selectedIndex` directly (not through
 *   `next()`/`previous()`) never marks earlier steps `interacted`, so NEITHER step 0 nor step 1
 *   is completed/EDIT despite being "before" the selected step (confirms note 5 of
 *   `CdkStepper.ngAfterViewInit`'s "mark previous steps interacted" logic only runs when
 *   `linear`, which this scenario isn't). Steps 0 AND 1 both get body class
 *   `mat-horizontal-stepper-content-previous` (sign-based, not distance-based — note 4); step 3
 *   gets `-next`. `<p>Selected index: 2</p>`. Step: click header 0 directly (mouse-selects it
 *   directly from index 2, crossing two positions in one jump — "Selected index: 0").
 * - **error-state**: provides `STEPPER_GLOBAL_OPTIONS` = `{showError: true}` (the ONLY
 *   scenario using this provider — see task scope). 2 steps: step 0 has
 *   `[stepControl]="nameCtrl"` (required `FormControl`) and `errorMessage="Name is required."`,
 *   with a bare `<input [formControl]="nameCtrl">`; step 1 plain. Not linear (non-linear lets
 *   you click away from an invalid step without the `linear` gate blocking you — this is what
 *   actually exposes the error state, since a step's error only shows while it's NOT selected).
 *   `<p>Selected index: 0</p>`. Steps: click header 1 directly (jumps away while step 0 is
 *   still invalid+now-interacted) → step 0 shows **ERROR** icon
 *   (`mat-step-icon-state-error`, `<mat-icon>warning</mat-icon>`, no hidden span — see shared
 *   structure above), its label gets `mat-step-label-error` + a `.mat-step-sub-label-error`
 *   "Name is required." div, "Selected index: 1"; click header 0 directly (navigates back —
 *   always allowed since step 0 defaults `editable: true`; error hides while selected, since
 *   the error check requires `!selected`); fill the input with "Ada" (now valid, no DOM change
 *   yet while still selected); click header 1 directly again — step 0 is now completed+valid
 *   → **EDIT** icon (not ERROR, not DONE — editable defaults true), "Selected index: 1".
 */

/** Waits for the one-time, time-delayed `mat-stepper-animating` class (see note 1 above) to
 * clear from the stepper host under the root, then a small fixed buffer for any
 * zone/signal-triggered follow-up change that lands in the same tick.
 *
 * First waits (bounded, best-effort) for the class to actually APPEAR, before waiting for it
 * to clear. Without that first wait, a step whose Qwik-side click handler hasn't finished
 * loading yet (first interaction on a fresh page, or the host under load) reads as "already
 * settled" — `.mat-stepper-animating` being absent is true for the wrong reason (nothing has
 * happened yet), not because the stepper already finished transitioning. Confirmed live on this
 * spec (100% reproducible on a fresh `error-state`/`vertical-basic` page load: the very first
 * selection-changing click settles in ~170ms instead of the real ~650ms, leaving the class
 * present a moment later when the next step's comparison runs) — the exact same class of race
 * already documented and fixed this way for `qwik-material/checkbox` (see that entry's
 * SYNC.md, "Known flakiness" / "First paint + handler timing": "Steps now wait for the input's
 * className to change ... before waiting the class out"). A step whose click is a genuine
 * no-op (blocked by linear/editable gating, or re-selecting the already-selected header) never
 * adds the class at all, so this first wait harmlessly times out and falls through. */
async function waitForStepperSettled(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => !!document.querySelector('[data-parity-root] .mat-stepper-animating'),
      undefined,
      {timeout: 1500},
    )
    .catch(() => {});
  await page.waitForFunction(
    () => !document.querySelector('[data-parity-root] .mat-stepper-animating'),
    undefined,
    {timeout: 5000},
  );
  await page.waitForTimeout(150);
}

/** Scopes to this scenario's step headers in document order. */
const stepHeader = (page: Page, index: number) =>
  page.locator('[data-parity-root] mat-step-header').nth(index);

/** The Next/Back button inside whichever body is currently active (current/active body only —
 * other bodies' buttons may be `inert` and therefore unclickable). */
const currentNextButton = (page: Page) =>
  page.locator(
    '[data-parity-root] .mat-horizontal-stepper-content-current button.mat-stepper-next, ' +
      '[data-parity-root] .mat-vertical-content-container-active button.mat-stepper-next',
  );
const currentPreviousButton = (page: Page) =>
  page.locator(
    '[data-parity-root] .mat-horizontal-stepper-content-current button.mat-stepper-previous, ' +
      '[data-parity-root] .mat-vertical-content-container-active button.mat-stepper-previous',
  );

const clickNext: ParityStep = {
  name: 'click Next',
  run: async (page: Page) => {
    await currentNextButton(page).click();
    await waitForStepperSettled(page);
  },
};

const clickPrevious: ParityStep = {
  name: 'click Back',
  run: async (page: Page) => {
    await currentPreviousButton(page).click();
    await waitForStepperSettled(page);
  },
};

const clickHeader = (index: number): ParityStep => ({
  name: `click header ${index}`,
  run: async (page: Page) => {
    await stepHeader(page, index).click();
    await waitForStepperSettled(page);
  },
});

/** Focus-only keyboard navigation: no selection change, so a short fixed wait is enough (no
 * body transition is ever triggered). */
const pressKeyFocusOnly = (key: string): ParityStep => ({
  name: `press ${key} (focus only)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(150);
  },
});

/** Enter/Space select the currently-focused header (when it differs from the selected one) —
 * waits out the same stepper transition as a click. */
const pressKeySelect = (key: string): ParityStep => ({
  name: `press ${key} (select)`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await waitForStepperSettled(page);
  },
});

/** Tabs into the first step header from a sentinel placed just before the parity root (the
 * dev-app chrome differs between the two apps, so natural Tab order from the page top differs). */
const tabIntoFirstHeader: ParityStep = {
  name: 'Tab into first header',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(150);
  },
};

const fillInput = (value: string): ParityStep => ({
  name: `fill input "${value}"`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] input').first().fill(value);
    await page.waitForTimeout(100);
  },
});

test.describe('mat-stepper — Angular DOM parity', () => {
  test('horizontal-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'horizontal-basic',
      steps: [
        tabIntoFirstHeader,
        pressKeyFocusOnly('ArrowRight'),
        pressKeyFocusOnly('ArrowLeft'),
        pressKeyFocusOnly('ArrowLeft'),
        pressKeyFocusOnly('Home'),
        pressKeyFocusOnly('End'),
        pressKeyFocusOnly('ArrowLeft'),
        pressKeySelect('Enter'),
        clickHeader(0),
      ],
    }));

  test('vertical-basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'vertical-basic',
      steps: [
        tabIntoFirstHeader,
        pressKeyFocusOnly('ArrowDown'),
        pressKeyFocusOnly('ArrowRight'),
        clickNext,
      ],
    }));

  test('linear-required', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'linear-required',
      steps: [clickNext, fillInput('Ada'), clickNext],
    }));

  test('optional-step', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'optional-step', steps: [clickNext]}));

  test('editable-false', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'editable-false',
      steps: [clickNext, clickNext, clickPrevious, clickHeader(0)],
    }));

  test('completed-step-icons', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'completed-step-icons',
      steps: [clickNext, clickNext],
    }));

  test('custom-label', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'custom-label', steps: [clickHeader(1)]}));

  test('label-position-bottom', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'label-position-bottom', steps: [clickNext]}));

  test('header-position-bottom', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'header-position-bottom',
      steps: [clickNext],
    }));

  test('selected-index-initial', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'selected-index-initial',
      steps: [clickHeader(0)],
    }));

  test('error-state', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'error-state',
      steps: [clickHeader(1), clickHeader(0), fillInput('Ada'), clickHeader(1)],
    }));
});
