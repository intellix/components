# qwik-material/slider sync log

Tracks the sync state between this port and `src/material/slider/` upstream
(synced at commit `d4ac7c3a8b14d2a69e95b59277263a8c0d6d3787`). Every
deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/radio/SYNC.md`, `src/qwik-material/checkbox/SYNC.md`,
`src/qwik-material/form-field/SYNC.md`, and `src/qwik-material/core/SYNC.md`.

Ported 2026-10-28 against upstream, following
`docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 4). Gated from the start by
`specs/material-slider/angular-parity.spec.ts` — **8/9 scenarios pass**; the
one residual is a confirmed, deeply-investigated ambient-page floating-point
artifact in Angular's OWN rendering, not a logic gap in this port — see
"Residual: one sub-pixel style mismatch in `range`" below.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `slider/mat-slider.tsx` | `src/material/slider/slider.ts` (`MatSlider`) + `slider-input.ts` (`MatSliderThumb`/`MatSliderRangeThumb`) + `slider-thumb.ts` (`MatSliderVisualThumb`) + `slider.html` + `slider-thumb.html` | ported | A single component covering all three upstream directives/components at once — see "Single component, not three directives" below. Renders upstream's full template tree itself: native `<input type="range">` thumb(s), the `mdc-slider__track` structure (inactive/active-fill/tick-marks), and `<mat-slider-visual-thumb>` element(s) (value-indicator markup, knob, ripple container). All geometry (translateX, track-active style, tick marks, per-thumb native-input width/padding/left, range min/max) is PURE, derived fresh every render — see `slider-thumb-state.ts`'s header comment for why, and `slider-math.ts` for the formulas |
| `slider/slider-math.ts` | pure extraction of the geometry formulas scattered across `slider.ts`/`slider-input.ts` | new | `calcTranslateXByValue`, `clampSingle`/`clampRange`, `fillPercentage`, `trackActiveStyleNonRange`/`trackActiveStyleRange`, tick-mark counting + transform, native-input inactive/active width formulas, range min/max clamping, and `fixValueFromClientX` (the `_fixValue` click-correction snap). Framework-free, fully unit-tested (`slider-math.spec.ts`) against the exact numbers `angular-parity.spec.ts`'s header documents as verified live |
| `slider/slider-ripple.ts` | the manual-launch half of `MatRipple`/`RippleRenderer` (`src/material/core/ripple/ripple*.ts`) that `MatSliderVisualThumb._show*Ripple`/`_hideRipple` drive | new | A minimal three-slot (hover/focus/active) state machine, not a general ripple renderer (slider never needs click-auto-ripples or arbitrary coordinates). `showRippleKind`/`hideRippleKind`/`isRippleKindShown`/`isShowingAnyRipple`, plus `computeRippleBox` (unused by the component itself — see `RIPPLE_BOX`'s doc comment in mat-slider.tsx — but kept + unit-tested for the formula it documents) |
| `slider/slider-thumb-state.ts` | the rest of `MatSliderThumb`/`MatSliderRangeThumb`/`MatSliderVisualThumb`'s event-handling logic | new | Store shape (`SliderStore`/`ThumbStore`) plus plain (non-QRL) functions mat-slider.tsx's inline `$()` handlers call: `handleThumbFocus`/`handleThumbBlur`/`handleThumbPointerMove`/`handleThumbPointerLeave`/`handleThumbPointerDown`/`handleThumbPointerUp`/`handleThumbInput`, `thumbOf`/`siblingOf`, `thumbWithIndicator` (the value-indicator derivation), `isCursorOnSliderThumb`, `shouldAcceptExternalValue` (the stale-echo guard) |
| `scss/slider/slider.scss` | `src/material/slider/slider.scss` (385 LOC) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1), for the two `cdk.high-contrast` forced-colors blocks |
| `scss/slider/slider-thumb.scss` | `src/material/slider/slider-thumb.scss` | synced | byte-identical copy, zero `@angular/cdk` references |
| `scss/slider/_m2-slider.scss` | `src/material/slider/_m2-slider.scss` | synced | byte-identical copy |
| `scss/slider/_m3-slider.scss` | `src/material/slider/_m3-slider.scss` | synced | byte-identical copy; actually compiled (`slider.scss`'s `$fallbacks: m3-slider.get-tokens();`) |
| `scss/slider/_slider-theme.scss` | `src/material/slider/_slider-theme.scss` | synced | byte-identical copy; theme mixin inert on our end (no runtime theming system) but kept for `diff -q` parity |
| `scss/slider/slider-prebuilt.scss` | (qwik-material-specific) | new | `@use`s slider.scss + slider-thumb.scss, plus `:root` defaults for every `--mat-slider-*` / `--mat-sys-*` custom property the structural rules reference, including the first elevation-level (`--mat-sys-level1`) and label-medium typescale defaults any prior prebuilt file in this port has needed (computed via `elevation.get-box-shadow(1)` and the M3 typescale table — see the file itself for the exact values). `--mat-slider-{hover,focus}-state-layer-color` are `color-mix(primary 5%/20%)`, matching upstream's `color-with-opacity` (they were opaque primary until 2026-10-30) |

**A note on "synced" above**: an earlier pass in this same port ran
`prettier --write scss/slider/*.scss`, which reflowed several multi-line
Sass maps in `_m2-slider.scss`/`_m3-slider.scss`/`_slider-theme.scss` —
*prettier has no business touching byte-for-byte synced upstream SCSS* (the
design doc's only allowed edit is the cdk-stub import swap, and only in
`slider.scss`). Caught by re-diffing against upstream and fixed by
re-copying those three files fresh; `diff` against `src/material/slider/`
now confirms all four non-prebuilt files are byte-identical except that one
line. Lesson for future components: never glob SCSS into a `prettier --write`
call; format only the `.ts`/`.tsx` files you actually wrote.

## Single component, not three directives

Upstream splits the slider across three separate constructs a consumer
combines in a template:

```html
<mat-slider><input matSliderThumb [(value)]="v"></mat-slider>
<mat-slider><input matSliderStartThumb [(value)]="s">
            <input matSliderEndThumb [(value)]="e"></mat-slider>
```

This port collapses all three into one component's props:

```tsx
<MatSlider value={v} onValueChange$={...} />
<MatSlider startValue={s} endValue={e} onStartValueChange$={...} onEndValueChange$={...} />
```

Range mode is selected by providing `startValue` and/or `endValue`. This is
deliberate, not a corner cut: unlike a case where Angular puts a directive on
a *consumer-chosen* element (`matBadge`, `matListItemAvatar` — where design
doc rule 4's polymorphic `as` prop pattern applies), the thumb `<input>`
has no real consumer content to project — every attribute on it is entirely
controlled by the directive, and the DOM it renders is identical regardless
of which Qwik API shape wraps it. `MatSlider` itself already reaches
directly into both thumbs' internals upstream (`_getInput`/`_getThumb`), so
this is also the more faithful reflection of how tightly coupled the three
pieces actually are, not an invented simplification.

## Derived-render architecture (not a 1:1 field port)

Upstream stores translateX, track-active style, tick marks, value-indicator
text/short-value, per-thumb native-input width/padding/left, and range
min/max as mutable fields, each updated by a scattered set of methods
(`_updateThumbUIByValue`, `_updateTrackUI`, `_updateTickMarkUI`, …) called
from the many places any of those could go stale. This port stores only the
genuinely stateful, event-driven primitives (current value, focus/active/
hover flags, ripple slots, measured width/left, the range track-active
"source" thumb) in `SliderStore`/`ThumbStore`, and computes everything else
fresh every render directly from those primitives via `slider-math.ts`. This
is not a scope cut — it reproduces upstream's actual observed behavior
(confirmed while tracing `MatSliderRangeThumb._onInput`: it ends up
recomputing both thumbs' widths on every input, i.e. always from current
values, never a stale snapshot) while eliminating an entire category of
"forgot to also update the derived field" bugs upstream's imperative model
is prone to.

## Key findings from live investigation

Each of these was discovered by diffing against the real, running Angular
app — none was predictable from reading the TypeScript source alone.

1. **The native `<input type="range">` never carries a literal `value`
   attribute** (documented in angular-parity.spec.ts's note 1). `value` is
   rendered as a plain reactive JSX prop (property-only, confirmed by
   qwik-material/form-field's own finding that Qwik's SSR serializer never
   writes `value` as an attribute via the standard prop path) plus a
   `useTask$` that pushes it onto the native input's DOM property via a ref
   — the same "proven fix" pattern qwik-material/checkbox uses for
   `checked`/`indeterminate`.

2. **`displayWith` must be a `QRL`, not a plain function.** A plain function
   prop breaks SSR mid-stream with a 500 — confirmed by raw `curl`, which
   showed a well-formed partial HTML response with a malformed "500 Internal
   Server Error" page appended after it (Qwik's serializer cannot embed a
   raw function reference in the `qwik/json` resumability payload). Fixed
   by typing `displayWith` as `QRL<(value: number) => string>` and resolving
   it through a `useTask$` into a plain signal per thumb (`endValueText`/
   `startValueText` in mat-slider.tsx), not by making the component's own
   render function `async` — `OnRenderFn<PROPS>` is typed to return
   `JSXOutput`, not `Promise<JSXOutput>`, in this project's pinned Qwik 1.x,
   so `component$(async (props) => …)` doesn't type-check. A plain
   (non-visible) `useTask$` runs during SSR too (Qwik's SSR pipeline awaits
   pending tasks before serializing), so the initial render still carries
   the resolved text.

3. **Controlled-value echo race (Qwik-specific, no upstream equivalent).**
   A single click/drag gesture can emit two values in quick succession: the
   native, uncorrected `input` value, then the `_fixValue`-equivalent
   corrected one (upstream does this too — `_onChange` on native `change` +
   `_fixValue`, both call `valueChange.emit()`). In Angular, same-tick zone
   change detection means the second emission is always processed after the
   first, with no possibility of reordering. In this port, each emission
   round-trips through a QRL-resolved consumer callback and back down as a
   prop, and that round-trip has NO ordering guarantee — confirmed live: the
   `basic` scenario's click briefly had the stale, uncorrected `76` arrive
   at the consumer ~20ms *after* the correction had already told it `75`,
   flipping the displayed value back to the wrong one. Fixed by suppressing
   `handleThumbInput`'s own emission for the whole window a pointerdown's
   deferred correction is pending (`ThumbStore.correctionPending`), making
   the correction's `onSettled` call the gesture's sole emission; a
   `lastEmittedValue` field + `shouldAcceptExternalValue` guard on the
   "prop -> store" sync `useTask$`s is a defense-in-depth backstop for the
   same hazard in general.

4. **A `force: true` Playwright click still delivers `pointermove` to a
   disabled native input**, even though the browser suppresses
   `pointerdown`/`focus`/`input` for it (confirmed live via the `disabled`
   scenario's force-click step: it incorrectly started a hover ripple before
   this was fixed). `onPointerMove$` now has an explicit `disabled` guard;
   the others don't need one (defensive-only there, since a genuinely
   disabled input never dispatches those events for real).

5. **`MatSlider._hasAnimation` / the `mat-mdc-slider-with-animation` host
   class is never actually observable in Angular's rendered DOM**, despite
   `_setTransition` genuinely toggling it via a raw `classList.toggle()`
   call. `MatSlider`'s host metadata has a bare `'[class]': '"mat-" +
   (color || "primary")'` binding (not `[class.foo]`) alongside its other
   `[class.foo]` bindings; Angular's Ivy class-binding instructions for a
   host with any such binding own the entire computed class list and
   rewrite it from their own tracked state on every change-detection pass —
   which runs synchronously, via zone.js, immediately after the very event
   handler that called `_setTransition`. Confirmed by polling the real
   Angular app's rendered class list every 5ms through a keyboard-driven
   value change (`_setTransition(true)` definitely runs — the value itself
   changes): the class never appears, not even transiently. This port
   simply never renders it — no store field, no class-list entry.

6. **The range track-active fill's branch isn't always the start/left
   thumb's**, contrary to a first reading of angular-parity.spec.ts's note
   6 (which describes the *mount-settled* state, driven by a one-shot
   `ResizeObserver` callback that happens to update the end thumb then the
   start thumb). `MatSliderThumb._onFocus` ALSO calls `_updateTrackUI(this)`
   — not just a value-changing `input` — so focusing either thumb
   re-renders the track-active fill using THAT thumb as `source`, with no
   value change at all. Confirmed live on the `range` scenario: focusing
   the end thumb switches the fill's style from `left: auto; right: …px;
   transform-origin: right` to `left: …px; right: auto; transform-origin:
   left`, even though nothing else changed. Tracked via
   `SliderStore.rangeTrackSource`, defaulting to `'start'` (matching the
   mount-time settled state) and updated on both `handleThumbFocus` and
   `handleThumbInput`.

## Residual: one sub-pixel style mismatch in `range`

`specs/material-slider/angular-parity.spec.ts`'s `range` scenario fails at
its "focus thumb 1" step with:

```
mat-slider-visual-thumb[4]>div[1]>div[0]: attr 'style'
  'height: 48px; left: -7.6e-06px; top: 0px; ...'   (Angular)
  != 'height: 48px; left: 0px; top: 0px; ...'       (Qwik)
```

This is the END thumb's focus-ripple element (`transform: translateX
(208.8px)`, 300px-wide slider, start=31/end=70 at this point). Investigated
exhaustively and confirmed to be an Angular-dev-app-ambient rendering
artifact, not a logic gap in this component:

- A minimal, slider-unrelated repro (`position: absolute; height: 48px;
  width: 48px; transform: translateX(208.8px);`) reproduces the exact same
  `47.99998474121094` `getBoundingClientRect().width` in isolation —
  confirming it's about Chromium's floating-point handling of THIS
  transform value, not slider-specific CSS.
- But adding the slider's actual ancestor properties (`display: flex; left:
  -24px; position: absolute;`) to that same minimal repro made the artifact
  disappear again (clean `48`) — so it's not simply "this transform value
  always rounds this way" either.
- Decisively: cloning the real, currently-affected Angular thumb element to
  a fresh position under `<body>` measures a clean `48`; moving it back to
  its original spot inside `<mat-slider>` reproduces `47.99998...` again,
  reversibly, on the same node. This proves the artifact depends entirely
  on the ANCESTOR chain's own compositing/transform context (something in
  Angular's dev-app chrome above `<mat-slider>`, e.g. its router/animation
  host — not touchable per this task's rules, and not something this
  component's own CSS or logic controls), not on this element's own
  styling or history.
- This port's two dev-apps have different ambient chrome by design (see the
  remediation design doc's "out of scope: computed-style parity"), so this
  noise is independent for each. Confirmed empirically that trying to
  "fix" it by live-measuring the ripple container on the Qwik side (instead
  of the constant `computeRippleBox(48, 48)` this port actually uses — see
  `RIPPLE_BOX`'s doc comment in mat-slider.tsx) does make THIS one case
  match, but simultaneously REGRESSES `discrete`/`tick-marks` (translateX
  120.6px), whose Angular-side measurement is clean `0px` while live
  measuring on the Qwik side introduces noise Angular doesn't have for that
  value. A fixed nominal box is strictly better across the whole suite: 8/9
  scenarios clean vs. 7/9 either way, just a different one failing.

No further action taken — reproducing Angular's own ambient-page noise
would require either editing the shared Angular dev-app (out of scope) or
hand-tuning this component to a single hardcoded magic number that happens
to match today's exact browser/dev-app-chrome combination (fragile, not
principled, and liable to silently stop matching on an unrelated future
change to either app's chrome).

## Removed upstream files

- `slider-module.ts` — Qwik has no module concept
- `testing/` (`MatSliderHarness`) — Angular test harness surface; no
  equivalent needed
- Upstream `public-api.ts` — replaced with our own re-export shape
- `slider.html`/`slider-thumb.html` — inlined into `mat-slider.tsx`'s JSX
- `ControlValueAccessor` + `NG_VALUE_ACCESSOR` providers (both thumb
  directives) — Qwik has no forms system; replaced by the controlled-
  component `value`/`onValueChange$` (and `startValue`/`endValue`/
  `onStartValueChange$`/`onEndValueChange$`) props
- `MatSliderChange` (deprecated upstream already) — not ported
- `MatSliderDragEvent` / `dragStart`/`dragEnd` outputs — no scenario
  exercises them; dropped (see "Deviations" below)

## Deviations from upstream

1. **`ControlValueAccessor` removed entirely** — same rationale as every
   other interactive qwik-material component (no Forms API in Qwik).
2. **`dragStart`/`dragEnd` outputs not ported.** No parity scenario needs
   them, and this port's pointer handling doesn't have a clean seam to
   raise them from (upstream's native-pointerdown/pointerup handlers would
   need two more QRL props threaded through for no currently-tested
   benefit).
3. **No `ResizeObserver` equivalent.** No parity scenario resizes the
   slider after mount; `store.cachedWidth`/`cachedLeft` are measured once
   at mount (a justified `useVisibleTask$({strategy: 'document-ready'})`,
   same pattern as qwik-material/tabs's `usePaginatedHeader`) and again on
   every `pointerdown` (matching upstream's own `_updateDimensions()` call
   there), but never on a live resize.
4. **RTL not implemented.** `isRtl` is hardcoded `false` everywhere in
   `mat-slider.tsx`'s calls into `slider-math.ts` (whose functions all
   still take an `isRtl` parameter and are unit-tested for both branches —
   only the wiring is LTR-only). No scenario exercises RTL.
5. **`mdc-slider__thumb--top` (overlapping-thumb z-index class) not
   implemented.** Upstream's `_updateOverlappingThumbUI` is edge-triggered
   (whichever thumb's update most recently crossed the 20px-apart
   threshold "wins" the top class) in a way that isn't a pure function of
   current positions alone. No scenario here has range thumbs close enough
   to overlap (30/70 on a 0–100 range), so this is untested and unported.
6. **Range drag's `_updateWidthActive` left/right positions approximated.**
   Upstream's real `_updateWidthActive` (used only while a range thumb is
   mid-drag) never touches `left`/`right` at all, leaving them at whatever
   the last `_updateWidthInactive` call set — this port always recomputes
   `left`/`right` from the CURRENT (possibly mid-drag) values via the
   inactive formula and only swaps `width`/`padding` when active. No
   scenario drags a range thumb (only `focus`+arrow-key), so this is
   unverified either way; documented as a reasonable approximation of an
   untested path rather than a scope cut.
7. **`disableRipple` has no effect.** Prop exists on `MatSliderProps` for
   API-shape completeness, but nothing reads it yet — no scenario sets it,
   and upstream's own handling (skip `MatRipple.launch()` when
   `_globalRippleOptions?.disabled` is set, NOT the same as this per-
   instance `disableRipple` input, which only gates the directive's own
   automatic click-triggered ripple — itself already out of scope here)
   would need threading through every `showRippleKind` call site for no
   currently-tested behavior.
8. **No Qwik-only Playwright spec added.** `angular-parity.spec.ts` already
   exercises value-indicator text, `aria-valuetext`, ripple lifecycles
   (hover/focus/active show+hide, including the range cross-thumb
   indicator hand-off), tick marks, keyboard/click/drag value changes, and
   the disabled no-op path — there was no behavior left over that wasn't
   already covered by the DOM-parity gate itself.

## Class count

`grep -rnE "^export class" src/qwik-material/slider/` → 0 (no exported
classes on the consumer surface — `MatSlider` is a `component$`, everything
else is a plain function or interface).

## Pipeline

`pnpm -C src/qwik-material build && pnpm -C src/qwik-material test &&
pnpm -C src/qwik-material lint:no-ssr-leaks && pnpm -C src/qwik-material
typecheck` all pass for the whole qwik-material package (132 vitest files,
579 passing tests, 0 SSR leaks, 0 type errors) with slider included.
