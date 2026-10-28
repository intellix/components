import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-slider';

/**
 * mat-slider — Angular DOM parity.
 *
 * Source of truth for every scenario: src/dev-app/qwik-parity/slider.ts (exports
 * `SLIDER_SCENARIOS`, served at http://localhost:4200/qwik-parity/mat-slider/<scenario>). The
 * Qwik side must render the same markup at http://localhost:4173/mat-slider/<scenario>/ inside
 * its own `[data-parity-root]`.
 *
 * Every `<mat-slider>` is given a fixed inline `style="width: …px"` (a plain DOM attribute, not
 * a Material input) so the measured track width — and therefore every thumb/track-active
 * transform and tick-mark position — is identical regardless of the surrounding dev-app chrome.
 *
 * ========================================================================================
 * SHARED STRUCTURE (src/material/slider/slider.html, slider-thumb.html; classes/host bindings
 * from slider.ts, slider-input.ts, slider-thumb.ts). Single-thumb slider:
 *
 *   <mat-slider class="mat-mdc-slider mdc-slider mat-{primary|accent|warn}
 *                      [mdc-slider--range] [mdc-slider--disabled] [mdc-slider--discrete]
 *                      [mdc-slider--tick-marks] [_mat-animation-noopable]
 *                      [mat-mdc-slider-with-animation]"      (see note 2 — sticky, not timed)
 *              style="width: …px">
 *     <input class="mdc-slider__input" type="range" matSliderThumb
 *            aria-valuetext="…" [disabled] [required-equivalents-n/a]
 *            step="N" min="N" max="N"                         (see note 1 — ALWAYS literal attrs)
 *            style="padding: 0 16px; width: calc(100% + 10px); left: -21px;">
 *            <!-- NO `value` attribute, ever — see note 1 -->
 *     <div class="mdc-slider__track">
 *       <div class="mdc-slider__track--inactive"></div>
 *       <div class="mdc-slider__track--active">
 *         <div class="mdc-slider__track--active_fill"
 *              style="left: 0px; right: auto; transform-origin: left center;
 *                     transform: scaleX(fillPercentage);"></div>   (see note 3)
 *       </div>
 *       @if (showTickMarks) {
 *         <div class="mdc-slider__tick-marks">
 *           <div class="mdc-slider__tick-mark--active|--inactive"
 *                style="transform: translateX(Npx);"></div>       (see note 4)
 *           …
 *         </div>
 *       }
 *     </div>
 *     <mat-slider-visual-thumb class="mdc-slider__thumb mat-mdc-slider-visual-thumb
 *                                      [mdc-slider__thumb--short-value] [mdc-slider__thumb--
 *                                      with-indicator] [mdc-slider__thumb--focused]"
 *                               style="transform: translateX(Npx);">
 *       @if (discrete) {
 *         <div class="mdc-slider__value-indicator-container">
 *           <div class="mdc-slider__value-indicator">
 *             <span class="mdc-slider__value-indicator-text">{{ displayWith(value) }}</span>
 *           </div>
 *         </div>
 *       }
 *       <div class="mdc-slider__thumb-knob"></div>
 *       <div class="mat-ripple mat-focus-indicator" matRipple>     (matRippleDisabled — see note 5)
 *         <!-- transient/persistent .mat-ripple-element nodes land here, see note 5 -->
 *       </div>
 *     </mat-slider-visual-thumb>
 *   </mat-slider>
 *
 * Range slider: an extra `mat-slider-visual-thumb` (for the START thumb) renders FIRST, before
 * the END one; host gains `mdc-slider--range`; the two native inputs use `matSliderStartThumb`/
 * `matSliderEndThumb` instead of `matSliderThumb`, the END one additionally gets class
 * `mat-slider__right-input` (sic — not `mdc-`/`mat-mdc-`, a literal upstream class name) when it
 * is the right-hand thumb (true in LTR). See note 6 for range-specific min/max/track/indicator
 * behavior.
 *
 * NON-OBVIOUS BEHAVIORS VERIFIED LIVE (not something a from-scratch reading of the source would
 * reliably predict):
 *
 * 1. **The native `<input type="range">` never carries a literal `value` ATTRIBUTE, in any
 *    scenario, at any time** — confirmed across every scenario below, initially and after every
 *    value-changing step. `MatSliderThumb`'s `value` setter only ever does
 *    `this._hostElement.value = stringValue` (a DOM PROPERTY write); `value` is a
 *    *non-reflected* IDL attribute on `<input>` (same category as `checked` on a checkbox/radio
 *    — see `material-parity.ts`'s existing special-case for those), so the browser never syncs
 *    it back to the content attribute. By contrast, `min`/`max`/`step` ARE browser-auto-reflected
 *    content attributes for `<input>` — `MatSliderThumb`'s setters for those ALSO only assign the
 *    DOM property (`this._hostElement.min = v + ''`, etc.), but the browser itself keeps the
 *    literal attribute in sync for free, so `min`/`max`/`step` always appear as real, current
 *    attributes while `value` never does. **Recommendation for the harness** (not changed here —
 *    out of scope for this file set): a Qwik SSR port will likely need to bake a literal `value`
 *    attribute into the native range input for it to have correct initial state before hydration
 *    (the same reason Qwik's checkbox/radio SSR bakes `checked`) — if so, `material-parity.ts`'s
 *    `snapshotParityRoot` will need the same treatment it already gives `checked`: compare the
 *    live `.value` PROPERTY for `input[type="range"]`, not the (Angular-side always-absent)
 *    attribute, else every scenario here would false-positive-diff the instant Qwik's SSR writes
 *    one.
 * 2. **`mat-mdc-slider-with-animation`** (host class, driven by `MatSlider._setTransition`) is
 *    STICKY state, not a timed/transient class like checkbox's `mdc-checkbox--anim-*` — it is
 *    simply toggled synchronously based on the most recent interaction (`true` after a step/arrow
 *    key changes the value via the native `input` event with a nonzero `step`; `false` on focus
 *    or on a pointer-driven drag with no `step`). None of the scenarios below assert its exact
 *    value (it isn't load-bearing for the comparison — both apps reach the same steady DOM
 *    regardless), but a Qwik port should still implement the same `_hasAnimation`/`_setTransition`
 *    rule rather than hard-coding the class, since nothing here special-cases or ignores it.
 * 3. **`fillPercentage` is never exactly 0, even at the minimum value** — `_calcTranslateXByValue`
 *    clamps `translateX` between `tickMarkOffset` (3px) and `cachedWidth - tickMarkOffset`, so a
 *    slider sitting at its minimum still has `translateX = 3`, giving `fillPercentage =
 *    3/cachedWidth` — confirmed live: a 300px-wide slider at value 0 renders
 *    `transform: scaleX(0.01)`, NOT `scaleX(0)`. Don't special-case "value === min" to zero.
 * 4. **Tick marks**: only rendered once `_cachedWidth` has been measured (`@if (_cachedWidth)` in
 *    the template) — in every scenario tested, this is already true by the time
 *    `[data-parity-root]` is attached and settled (no flash-of-absence observed in this harness).
 *    Count/split: `numActive = max(round((value-min)/step), 0) + 1`, `numInactive =
 *    max(round((max-value)/step), 0) - 1`, then (LTR) `numInactive++` — confirmed for
 *    `tick-marks` (min 0, max 100, step 20, value 40 → 3 active + 3 inactive = 6 marks at
 *    `translateX` 0/58.8/117.6px (active) and 176.4/235.2/294px (inactive); after ArrowRight to
 *    60 → 4 active + 2 inactive, still 6 marks total). See `_updateTickMarkTrackUI`/
 *    `_calcTickMarkTransform` in slider.ts for the exact per-mark transform formula.
 * 5. **Every thumb ripple (hover/focus/active) is launched with `persistent: true`**
 *    (`MatSliderVisualThumb._showRipple` always passes it, regardless of which kind), so NONE of
 *    them auto-remove themselves after their animation duration — each one is only removed when
 *    its owning event's complementary hide call runs (`_onBlur` / `_onMouseLeave` / `_onDragEnd`).
 *    The `[matRippleDisabled]="true"` binding on the template's ripple host div (see
 *    `slider-thumb.html`) only suppresses that `MatRipple` instance's own AUTOMATIC
 *    click-triggered launching — it has no effect on these manual `.launch()` calls, which is why
 *    a real ripple div still appears here despite the binding. Concretely, confirmed live:
 *      - Clicking a thumb (pointerdown+pointerup) launches an ACTIVE ripple
 *        (`mat-ripple-element mat-mdc-slider-active-ripple`, 225ms enter / 400ms exit) that IS
 *        removed from the DOM roughly 400ms after pointerup (`_onDragEnd` calls `fadeOut()`
 *        immediately on pointerup; "persistent" only suppresses auto-fade-after-enterDuration, it
 *        doesn't block an explicit `fadeOut()` call's own exit-duration-driven removal).
 *      - The SAME click also leaves a FOCUS ripple (`mat-ripple-element
 *        mat-mdc-slider-focus-ripple`, 0ms enter/exit) that stays indefinitely, because clicking
 *        the native input also focuses it and nothing then blurs it. Plain Tab-focus (no click)
 *        produces the identical focus ripple with no active ripple at all.
 *      - **Harness consequence** (`material-parity.ts`'s `snapshotParityRoot`, which waits for
 *        `.mat-ripple-element:not([class*="persistent-ripple"])` to disappear before every
 *        compare): neither `mat-mdc-slider-focus-ripple` nor `mat-mdc-slider-active-ripple`
 *        contains the substring `persistent-ripple`, so the focus ripple left behind by ANY
 *        focusing interaction below is subject to that wait and NEVER actually disappears —
 *        every `compare()` call after such a step burns the full ~3s timeout (caught, then
 *        proceeds comparing the DOM with the ripple div still present) on EACH app. This is
 *        expected/harmless given the existing harness (not edited here), just slower; `basic`
 *        below deliberately batches its keyboard presses into one step (see note 8) to keep the
 *        total well under Playwright's per-test timeout.
 *      - Blurring (moving focus elsewhere) removes the focus ripple and its `--focused` class
 *        within a couple hundred ms, confirmed live.
 * 6. **Range-slider specifics**, all confirmed live on `disabled`/`range`:
 *      - `MatSliderRangeThumb._updateMinMax()` continuously re-clamps each thumb's reachable
 *        `min`/`max` ATTRIBUTE to its sibling's live value, not the slider's own `[min]`/`[max]`:
 *        for a 0–100 range slider with start=30/end=70, the start input renders
 *        `min="0" max="70"` and the end input renders `min="30" max="100"` — i.e. each thumb's
 *        far bound is clamped to wherever the other thumb currently sits. Moving the start thumb
 *        to 31 immediately updates the end thumb's live `min` attribute to `"31"`.
 *      - Showing a ripple (hover/focus/active) on EITHER thumb also shows the value-indicator
 *        class (`mdc-slider__thumb--with-indicator`) on its SIBLING thumb
 *        (`MatSliderVisualThumb._showRipple`: `if (this._slider._isRange) { sibling.
 *        _showValueIndicator(); }`) — both labels appear together, matching Material's documented
 *        range-slider UX — but only the interacted thumb gets its own ripple element/`--focused`
 *        class. Moving focus from one range thumb directly to the other (Tab/click) keeps BOTH
 *        thumbs' `--with-indicator` class present throughout the hand-off, because
 *        `_hideRipple`'s "is anyone still showing a ripple" check (which gates hiding either
 *        side's indicator) sees the newly-focused sibling's ripple and never clears either one.
 *      - The active-track fill's positioning branch in `MatSlider._updateTrackUIRange` is keyed
 *        on `source._isLeftThumb`, but the SETTLED (observed, final) style on load and after
 *        every change always lands on the START thumb's branch in LTR (`left: auto; right:
 *        ${cachedWidth - endThumb.translateX}px; transform-origin: right center`) — confirmed on
 *        every range scenario below. This falls out of execution order (`ngAfterViewInit` updates
 *        the end thumb's UI then the start thumb's, so the start thumb's call wins; a
 *        `ResizeObserver` fired once asynchronously right after mount, per spec, even with no
 *        actual size change, repeats the same end-then-start order) rather than being arbitrary —
 *        a Qwik port only needs to land on the same settled formula, not reproduce the ordering.
 * 7. `displayWith` feeds `aria-valuetext` on the native input UNCONDITIONALLY, independent of
 *    `discrete` (`MatSlider._updateValueIndicatorUI` always computes `this.displayWith(value)` and
 *    sets it via `[attr.aria-valuetext]`) — confirmed: every NON-discrete scenario below
 *    (`basic`, `min-max-step`, `tick-marks`) still carries a live, identity-formatted
 *    `aria-valuetext` on its input. `discrete` only additionally renders the visible
 *    `.mdc-slider__value-indicator-container` markup, fed by the SAME formatted string.
 *    Likewise, `mdc-slider__thumb--with-indicator` (the class, not the markup — see note 5) is
 *    added whenever a ripple shows REGARDLESS of `discrete`; confirmed on `tick-marks` (not
 *    discrete): focusing its thumb adds the class with no visible indicator element, since
 *    `@if (discrete)` gates only the markup.
 * 8. `mdc-slider__thumb--short-value` toggles on `displayWith(value).length < 3` — a STRING-length
 *    check on the FORMATTED label, not the raw number. Confirmed: `discrete` (value 40, label
 *    "40", length 2 → class present) and `display-with` (value 3000, label "3k", length 2 → class
 *    present); a 3+ character label would lose the class.
 * 9. **Keyboard (Arrow/Home/End/PageUp/PageDown) and click/drag-to-seek are all native
 *    `<input type="range">` BROWSER behavior — Material adds no keydown handler and no
 *    click/track handler of its own**; it only reacts afterward to the native `input`/`change`
 *    events the browser fires. Confirmed live in Chromium on a 0–100, step-1 slider: ArrowRight/
 *    ArrowLeft move by exactly `step`; Home/End jump to `min`/`max`; PageUp/PageDown move by 10%
 *    of the `min`–`max` range, clamped at the ends (`End`→100, then `PageDown`→90, `PageUp`→100
 *    again). Click-to-seek works because `_updateWidthInactive`/`_updateWidthActive` size the
 *    invisible native input to cover almost the FULL visible track (plus ripple-radius overflow
 *    at both ends) — so a click anywhere on the visible track is really a click on the native
 *    input, and the browser's own slider-click/drag implementation does the rest. Confirmed: a
 *    click at 75% of a 0–100 track sets the value to exactly 75; a click at ~42% of a 10–50/
 *    step-5 track (raw ≈26.8) snaps to 25, the nearest multiple of 5 (`MatSliderThumb._fixValue`).
 *    Dragging rides the same native mechanism once the pointer is down inside the input.
 * 10. The default `color` is **`primary`**, not `accent` — unlike `mat-checkbox`, whose default
 *     is `accent`. Confirmed: a `<mat-slider>` with no `[color]` binding renders host class
 *     `mat-primary`, identical to an explicit `[color]="'primary'"`.
 * 11. `matSliderThumb`, `matSliderStartThumb` and `matSliderEndThumb` are directive SELECTORS
 *     (`input[matSliderThumb]`, `input[matSliderStartThumb], input[matSliderEndThumb]`), not
 *     `@Input`s — a consumer can only ever write them as bare attributes, same category as
 *     `matButton`/`mat-tab-link` elsewhere in this file set. Report these three for
 *     `CONSUMER_SELECTOR_ATTRS` (not edited here).
 *
 * ========================================================================================
 * Per-scenario render contract (`SLIDER_SCENARIOS` key → class):
 *
 * - **basic**: one `<mat-slider style="width: 300px">`, single `matSliderThumb`, no other inputs
 *   bound — min 0 / max 100 / step 1 (component defaults), starts at `value = 0`. `<p>Value:
 *   0</p>`. Not discrete, no tick marks, no `--with-indicator` markup ever renders (markup only
 *   exists when `discrete`), host class `mat-primary`. Steps: Tab into the thumb from a sentinel
 *   (focus only, value unchanged at 0 — gains `mdc-slider__thumb--with-indicator
 *   mdc-slider__thumb--focused` + a lone `mat-mdc-slider-focus-ripple` div, see note 5); click the
 *   track at 75% of its measured width (native click-to-seek → value jumps straight to 75, see
 *   note 9 — also transiently shows then auto-removes an active ripple, per note 5); ONE combined
 *   keyboard step pressing ArrowRight, ArrowLeft, Home, End, PageDown, PageUp in sequence with no
 *   intermediate DOM comparison (75→76→75→0→100→90→100 — see note 8 on why this is batched into a
 *   single step rather than six); drag the thumb (native pointer-drag) to 60% of the track width
 *   (→ value 60, regardless of where it started, since native dragging computes value from the
 *   live pointer position, not a delta).
 * - **initial-value**: identical to `basic` except `value = 30` initially (`<p>Value: 30</p>`,
 *   thumb/track-active positioned accordingly). Step: focus the thumb, then ArrowRight → 31.
 * - **min-max-step**: one slider, `[min]="10" [max]="50" [step]="5"`, starts at `value = 25`.
 *   `<p>Value: 25</p>`. Native input renders `min="10" max="50" step="5"`. Steps: click the track
 *   at ~42% of its width → raw position ≈26.8, which SNAPS to 25 (nearest multiple of step 5) —
 *   value is unchanged numerically but the click still produces the full focus+active ripple
 *   sequence (note 9's "click resolves to the same value" branch in `_fixValue` still runs the UI
 *   update path, it just never emits `valueChange`); then ArrowRight → 30 (moves by the full
 *   `step`, not by 1).
 * - **discrete**: `[discrete]="true"`, single thumb, starts at `value = 40`. `<p>Value: 40</p>`.
 *   Host gains `mdc-slider--discrete`. The thumb ALWAYS renders the
 *   `.mdc-slider__value-indicator-container` markup now (gated by `discrete`, not by whether a
 *   ripple is showing) with text "40" inside `.mdc-slider__value-indicator-text`; thumb starts
 *   with `mdc-slider__thumb--short-value` (label length 2 < 3) but NOT `--with-indicator`/
 *   `--focused` (no ripple yet). Steps: focus the thumb (gains `--with-indicator --focused` + a
 *   `mat-mdc-slider-focus-ripple` div, indicator text unchanged "40"); ArrowRight → value 41,
 *   indicator text updates to "41" (still short-value); blur to a sentinel button → `--focused`
 *   and the ripple div are removed, `--with-indicator` is ALSO removed now (non-range: nothing is
 *   showing a ripple anymore so `_hideValueIndicator()` runs), `--short-value` and the visible
 *   indicator markup (still showing "41") remain.
 * - **tick-marks**: `[showTickMarks]="true" [min]="0" [max]="100" [step]="20"`, single thumb,
 *   starts at `value = 40` (NOT discrete — no indicator markup ever renders). `<p>Value: 40</p>`.
 *   Host gains `mdc-slider--tick-marks`. 6 tick marks total: 3 `--active` (translateX 0/58.8/
 *   117.6px) + 3 `--inactive` (176.4/235.2/294px) — see note 4. Steps: focus the thumb (adds
 *   `--with-indicator --focused` class + ripple div, per note 7 — no visible indicator element);
 *   ArrowRight → value 60 (moves by the full `step`, 20), tick-mark split becomes 4 active + 2
 *   inactive (same 6 marks, boundary shifts), "Value: 60".
 * - **display-with**: `[discrete]="true" [displayWith]="formatLabel" [min]="0" [max]="100000"
 *   [step]="1000"`, single thumb, starts at `value = 3000`; `formatLabel` renders `"Nk"` for
 *   values ≥ 1000, else the bare number (same formatter as upstream's
 *   `slider-formatting-example`). `<p>Value: 3000</p>`. Native input's `aria-valuetext="3k"`,
 *   visible indicator text "3k", thumb starts with `--short-value` (length 2). Step: focus the
 *   thumb, then ArrowRight → value 4000, `aria-valuetext="4k"`, indicator text "4k" (still
 *   short-value).
 * - **disabled**: two independent `<mat-slider style="width: 300px" [disabled]="true">`s, each in
 *   its own wrapping `<div>`: #0 a single `matSliderThumb` with `[value]="50"` (one-way, since
 *   it's disabled and never changes); #1 a range slider with `matSliderStartThumb [value]="30"`
 *   and `matSliderEndThumb [value]="70"`. No `<p>` readout. Both hosts gain `mdc-slider--disabled`
 *   (and #1 additionally `mdc-slider--range`); every native input gets the `disabled` attribute.
 *   Steps: force-click the #0 thumb's input (`{force: true}`, required since Playwright refuses a
 *   plain click on a `disabled` element), then force-click the #1 range slider's START thumb
 *   input — BOTH are complete no-ops (browsers never dispatch any pointer/click/input behavior on
 *   a disabled native range input): DOM is byte-identical to the initial snapshot after each,
 *   confirmed live (no ripple, no value change, no class change whatsoever).
 * - **range**: one `<mat-slider style="width: 300px">` with `matSliderStartThumb`/
 *   `matSliderEndThumb`, starting values 30/70 (default 0–100 range). `<p>Value: 30 : 70</p>`.
 *   Host gains `mdc-slider--range`; see note 6 for the min/max-clamping, shared-indicator, and
 *   active-track specifics, all exercised by the steps below. Steps: focus the START thumb (input
 *   index 0), ArrowRight → start becomes 31 (`<p>Value: 31 : 70</p>`; END thumb's live `min`
 *   attribute updates to `"31"`; END thumb also gains `--with-indicator` via note 6's sibling
 *   rule, without its own ripple/`--focused`); focus the END thumb (input index 1), ArrowLeft →
 *   end becomes 69 (`<p>Value: 31 : 69</p>`; START thumb's live `max` attribute updates to
 *   `"69"`; START thumb keeps `--with-indicator` throughout the hand-off per note 6, loses
 *   `--focused`/ripple as focus moves away).
 * - **colors**: four single-thumb `<mat-slider style="width: 150px">`s, `value = 50` each, no
 *   `<p>` readout: #0 no `[color]` binding → host class `mat-primary` (the component's own
 *   default, see note 10); #1 `[color]="'primary'"` → `mat-primary` (byte-identical DOM to #0
 *   apart from binding provenance, proving default ≡ explicit `'primary'`); #2
 *   `[color]="'accent'"` → `mat-accent`; #3 `[color]="'warn'"` → `mat-warn`. Step: focus thumb #1
 *   (the explicit-primary slider), then ArrowRight → value 51 on that slider only; the other
 *   three are untouched.
 */

/** Scopes to the Nth `<mat-slider>` under the parity root (defaults to the only/first one). */
const sliderGroup = (page: Page, groupIndex = 0) =>
  page.locator('[data-parity-root] mat-slider').nth(groupIndex);

/** Scopes to the Nth native range input under the parity root, across all sliders in document
 * order (e.g. for `range`/`disabled`, index 0 is slider 0's thumb, 1/2 are slider 1's start/end). */
const thumbInput = (page: Page, index = 0) =>
  page.locator('[data-parity-root] input[type="range"]').nth(index);

/** Tabs into the first slider thumb from a sentinel placed just before the parity root (the
 * dev-app chrome differs between the two apps, so natural Tab order from the page top differs). */
const tabIntoFirstThumb: ParityStep = {
  name: 'Tab into first thumb',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
  },
};

const focusThumb = (index = 0): ParityStep => ({
  name: `focus thumb ${index}`,
  run: async (page: Page) => {
    await thumbInput(page, index).focus();
    await page.waitForTimeout(100);
  },
});

const forceClickThumb = (index = 0): ParityStep => ({
  name: `force-click thumb ${index}`,
  run: async (page: Page) => {
    await thumbInput(page, index).click({force: true});
    await page.waitForTimeout(100);
  },
});

const pressKey = (key: string): ParityStep => ({
  name: `press ${key}`,
  run: async (page: Page) => {
    await page.keyboard.press(key);
    await page.waitForTimeout(100);
  },
});

/** Presses several keys back-to-back with no DOM comparison in between — see note 8/5 in the
 * header: every comparison on a scenario with a focused thumb burns the harness's full ~3s
 * non-persistent-ripple wait (the thumb's focus ripple never clears on its own), so a sequence
 * that only needs its END state checked is batched into one step instead of one-per-key. */
const keyboardNavigation = (keys: string[]): ParityStep => ({
  name: `keyboard navigation (${keys.join(', ')})`,
  run: async (page: Page) => {
    for (const key of keys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(40);
    }
  },
});

/** Clicks the Nth slider's track at a fractional position along its measured width. The
 * invisible native range input spans almost the full track (see header note 9), so this lands a
 * real native range-input click/seek, not a Material-specific handler. */
const clickTrackAt = (fraction: number, groupIndex = 0): ParityStep => ({
  name: `click track at ${Math.round(fraction * 100)}%`,
  run: async (page: Page) => {
    const box = (await sliderGroup(page, groupIndex).boundingBox())!;
    await page.mouse.click(box.x + box.width * fraction, box.y + box.height / 2);
    await page.waitForTimeout(100);
  },
});

/** Drags the Nth slider's thumb — via a native pointer-drag starting just inside the track and
 * ending at a target fractional position — to that position (see header note 9). */
const dragThumbTo = (fraction: number, groupIndex = 0): ParityStep => ({
  name: `drag thumb to ${Math.round(fraction * 100)}%`,
  run: async (page: Page) => {
    const box = (await sliderGroup(page, groupIndex).boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + 5, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * fraction, y, {steps: 10});
    await page.mouse.up();
    await page.waitForTimeout(150);
  },
});

/** Moves focus to a freshly-created sentinel button, blurring whatever slider thumb had it. */
const blurToSentinel: ParityStep = {
  name: 'blur (focus sentinel)',
  run: async (page: Page) => {
    await page.evaluate(() => {
      const sentinel = document.createElement('button');
      document.body.prepend(sentinel);
      sentinel.focus();
    });
    await page.waitForTimeout(500);
  },
};

test.describe('mat-slider — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      steps: [
        tabIntoFirstThumb,
        clickTrackAt(0.75),
        keyboardNavigation(['ArrowRight', 'ArrowLeft', 'Home', 'End', 'PageDown', 'PageUp']),
        dragThumbTo(0.6),
      ],
    }));

  test('initial-value', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'initial-value',
      steps: [focusThumb(), pressKey('ArrowRight')],
    }));

  test('min-max-step', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'min-max-step',
      steps: [clickTrackAt(0.42), pressKey('ArrowRight')],
    }));

  test('discrete', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'discrete',
      steps: [focusThumb(), pressKey('ArrowRight'), blurToSentinel],
    }));

  test('tick-marks', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'tick-marks',
      steps: [focusThumb(), pressKey('ArrowRight')],
    }));

  test('display-with', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'display-with',
      steps: [focusThumb(), pressKey('ArrowRight')],
    }));

  test('disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled',
      steps: [forceClickThumb(0), forceClickThumb(1)],
    }));

  test('range', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'range',
      steps: [focusThumb(0), pressKey('ArrowRight'), focusThumb(1), pressKey('ArrowLeft')],
    }));

  test('colors', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'colors',
      steps: [focusThumb(1), pressKey('ArrowRight')],
    }));
});
