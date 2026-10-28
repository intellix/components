import {
  $,
  component$,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
  type QRL,
} from '@builder.io/qwik';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {computeRippleBox} from './slider-ripple';
import {
  TICK_MARK_OFFSET,
  calcTranslateXByValue,
  clampRange,
  clampSingle,
  fillPercentage,
  inactiveWidthStyleNonRange,
  isShortValue,
  rangeMinMax,
  rangeWidthActive,
  rangeWidthInactive,
  tickMarkCountsNonRange,
  tickMarkCountsRange,
  tickMarkTrackWidth,
  tickMarkTransform,
  trackActiveStyleNonRange,
  trackActiveStyleRange,
} from './slider-math';
import {
  createThumbStore,
  handleThumbBlur,
  handleThumbFocus,
  handleThumbInput,
  handleThumbPointerDown,
  handleThumbPointerLeave,
  handleThumbPointerMove,
  handleThumbPointerUp,
  isCursorOnSliderThumb,
  shouldAcceptExternalValue,
  siblingOf,
  thumbOf,
  thumbWithIndicator,
  type SliderStore,
  type ThumbKey,
} from './slider-thumb-state';

export type MatSliderColor = 'primary' | 'accent' | 'warn';

/**
 * Props for `<MatSlider>` — a single component covering both of upstream's
 * content-projected shapes (`src/material/slider/slider.ts` + `slider-
 * input.ts` + `slider-thumb.ts`):
 *
 *   <mat-slider><input matSliderThumb [(value)]="v"></mat-slider>
 *   <mat-slider><input matSliderStartThumb [(value)]="s">
 *               <input matSliderEndThumb [(value)]="e"></mat-slider>
 *
 * become:
 *
 *   <MatSlider value={v} onValueChange$={...} />
 *   <MatSlider startValue={s} endValue={e} onStartValueChange$={...} onEndValueChange$={...} />
 *
 * Range mode is selected by providing `startValue` and/or `endValue` (see
 * SYNC.md "single component, not three directives" for why — there is no
 * real content to project through a separate thumb component here, every
 * attribute on the native `<input>` is entirely controlled by the
 * directive, so collapsing the three-piece upstream API into one
 * component's props loses no migration-relevant surface while avoiding a
 * three-way context-coordination dance for what is, structurally, one
 * tightly-coupled unit upstream too — `MatSlider` already reaches directly
 * into both thumbs' internals).
 */
export interface MatSliderProps {
  min?: number;
  max?: number;
  step?: number;
  discrete?: boolean;
  showTickMarks?: boolean;
  disabled?: boolean;
  disableRipple?: boolean;
  /** M2-only theme color. Default `'primary'` (see angular-parity.spec.ts note 10 —
   *  unlike `mat-checkbox`'s default of `'accent'`). */
  color?: MatSliderColor;
  /** `MatSlider.displayWith`. A `QRL` (not a plain function): Qwik's
   *  serializer cannot serialize a raw function reference into the SSR
   *  payload — passing a plain function here breaks mid-stream with a 500
   *  (confirmed live, see SYNC.md "displayWith must be a QRL"). Resolved by
   *  `await`ing it for each thumb's current value; `MatSlider`'s own render
   *  function is therefore `async`. */
  displayWith?: QRL<(value: number) => string>;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number | undefined>;

  /** Single-thumb mode (`matSliderThumb`). Ignored once `startValue` and/or
   *  `endValue` is provided. */
  value?: number;
  onValueChange$?: QRL<(value: number) => void>;

  /** Range mode (`matSliderStartThumb` / `matSliderEndThumb`) — providing
   *  either prop switches the whole component into range mode. */
  startValue?: number;
  endValue?: number;
  onStartValueChange$?: QRL<(value: number) => void>;
  onEndValueChange$?: QRL<(value: number) => void>;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  disabled: boolean;
  discrete: boolean;
  showTickMarks: boolean;
  disableRipple: boolean;
  isRange: boolean;
}

/** Read fresh from `props` every call — never captured as an outer-scope
 *  const inside a `$()` handler (see qwik-material/checkbox's SYNC.md
 *  "stale QRL capture" pitfall, cited throughout this project). Excludes
 *  `displayWith` — unlike every other field here, it's never read inside an
 *  interaction handler (only at render time, where it needs `await`ing —
 *  see `computeValueText`), so it has no reason to be read "live" this way. */
function readSliderConfig(props: MatSliderProps): SliderConfig {
  return {
    min: props.min ?? 0,
    max: props.max ?? 100,
    step: props.step ?? 1,
    disabled: props.disabled ?? false,
    discrete: props.discrete ?? false,
    showTickMarks: props.showTickMarks ?? false,
    disableRipple: props.disableRipple ?? false,
    isRange: props.startValue !== undefined || props.endValue !== undefined,
  };
}

/** `MatSlider.displayWith`'s default (`(value: number) => \`${value}\``),
 *  applied when the consumer doesn't provide one. `displayWith` is a `QRL`
 *  (see `MatSliderProps.displayWith`'s doc comment for why), so resolving
 *  it always means `await`ing a call — this helper does that uniformly for
 *  both the provided-QRL and no-QRL-provided cases. */
async function computeValueText(
  displayWith: QRL<(value: number) => string> | undefined,
  value: number,
): Promise<string> {
  return displayWith ? await displayWith(value) : `${value}`;
}

/**
 * Every ripple element's box, computed ONCE from the container's nominal
 * 48x48 CSS size (see `computeRippleBox`'s doc comment for the formula) —
 * deliberately NOT a live `getBoundingClientRect()` measurement despite
 * that function existing to support one. Tried that first: measuring via a
 * ref on the `.mat-ripple` container. It does not reproduce upstream's
 * `left`/`top` more faithfully — confirmed live it makes things WORSE. A
 * `getBoundingClientRect()` on an element positioned via `transform:
 * translateX(Npx)` can return a width a few millionths of a pixel off 48
 * (e.g. `47.99998474121094`), and WHETHER it does depends on the ANCESTOR
 * chain's own compositing/transform context, not on this component's CSS:
 * proved by cloning a real, already-affected thumb element to a fresh
 * position under `<body>` (clean `48`) and back to its original spot
 * (reappears). Each of this port's two dev-apps has different ambient
 * chrome, so this noise is independent for each — live-measuring made the
 * `range` scenario's END thumb (translateX 208.8px) match Angular's noisy
 * `-7.6e-06px`, while simultaneously making `discrete`/`tick-marks`'s thumb
 * (translateX 120.6px) MISMATCH Angular's clean `0px`, because measuring
 * introduced noise Angular didn't have for THAT value. A fixed nominal box
 * is strictly better across every scenario here: it matches whichever side
 * happens to be clean (confirmed true for 8 of 9 scenarios) and only loses
 * to the one case where upstream's own ambient page happens to be the noisy
 * side. See SYNC.md "ripple element sub-pixel noise" for the full
 * investigation.
 */
const RIPPLE_BOX = computeRippleBox(48, 48);

export const MatSlider = component$<MatSliderProps>(props => {
  const cfg = readSliderConfig(props);
  const noopAnimations = useAnimationsDisabled();

  const store = useStore<SliderStore>(
    () => ({
      cachedWidth: 0,
      cachedLeft: 0,
      end: createThumbStore(cfg.isRange ? (props.endValue ?? cfg.max) : (props.value ?? cfg.min)),
      start: cfg.isRange ? createThumbStore(props.startValue ?? cfg.min) : undefined,
      rangeTrackSource: 'start',
    }),
    {deep: true},
  );

  // `displayWith` is a QRL (see MatSliderProps's doc comment for why a
  // plain function can't be used here), so resolving it needs `await`ing —
  // but `component$`'s own render function can't be `async` (tried that
  // first: `OnRenderFn<PROPS>` is typed as returning `JSXOutput`, not
  // `Promise<JSXOutput>`, in this project's pinned Qwik 1.x). Resolving it
  // through a `useTask$` into a plain signal instead keeps `metricsFor`
  // (below) fully synchronous. A plain (non-visible) `useTask$` — unlike
  // `useVisibleTask$` — runs during SSR too (Qwik's SSR pipeline awaits
  // pending tasks before serializing), so the initial render still carries
  // the resolved text, not a placeholder.
  const endValueText = useSignal('');
  const startValueText = useSignal('');
  useTask$(async ({track}) => {
    const v = track(() => store.end.value);
    endValueText.value = await computeValueText(props.displayWith, v);
  });
  useTask$(async ({track}) => {
    const start = store.start;
    if (!start) return;
    const v = track(() => start.value);
    startValueText.value = await computeValueText(props.displayWith, v);
  });

  const hostRef = useSignal<HTMLElement>();
  const endInputRef = useSignal<HTMLInputElement>();
  const startInputRef = useSignal<HTMLInputElement>();
  const endThumbRef = useSignal<HTMLElement>();
  const startThumbRef = useSignal<HTMLElement>();

  // Mount-time measurement of the slider's own width/left — a justified,
  // commented exception to "no per-instance useVisibleTask$ for interaction
  // plumbing" (design doc rule 7's slider carve-out; same reasoning as
  // qwik-material/tabs's `usePaginatedHeader`): there is no user interaction
  // to lazily hang this on, and EVERY thumb/track-active transform and tick
  // mark position is derived from it (see the render body below) — it must
  // be correct before the harness's first comparison, not merely eventually.
  // No ResizeObserver equivalent — no parity scenario resizes the slider
  // after mount (see SYNC.md).
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    () => {
      const el = hostRef.value;
      if (!el) return;
      store.cachedWidth = el.offsetWidth;
      store.cachedLeft = el.getBoundingClientRect().left;
    },
    {strategy: 'document-ready'},
  );

  // Controlled-component prop -> store sync. Guarded by `isActive` exactly
  // like upstream's `MatSliderThumb.value` setter ("if (this._isActive)
  // return;") — an external value update mid-drag is dropped, matching
  // upstream's own behavior. ALSO guarded by `shouldAcceptExternalValue` —
  // see `ThumbStore.lastEmittedValue`'s doc comment for the stale-echo race
  // this rejects (a Qwik-specific hazard with no upstream equivalent: a
  // round-trip through a QRL-resolved consumer callback and back down as a
  // prop has latency Angular's same-tick zone change detection never does).
  useTask$(({track}) => {
    const v = track(() => props.value);
    if (v === undefined || store.start || store.end.isActive) return;
    if (shouldAcceptExternalValue(store.end, v)) store.end.value = v;
  });
  useTask$(({track}) => {
    if (!store.start) return;
    const v = track(() => props.startValue);
    if (v === undefined || store.start.isActive) return;
    if (shouldAcceptExternalValue(store.start, v)) store.start.value = v;
  });
  useTask$(({track}) => {
    const v = track(() => props.endValue);
    if (v === undefined || !store.start || store.end.isActive) return;
    if (shouldAcceptExternalValue(store.end, v)) store.end.value = v;
  });

  // Live DOM-PROPERTY sync (never the attribute — see slider-math.ts /
  // SYNC.md "no value attribute, ever"). A plain reactive `value={…}` JSX
  // prop alone does not reliably re-apply after resume; mirrors
  // qwik-material/checkbox's proven `checked`/`indeterminate` fix.
  useTask$(({track}) => {
    const v = track(() => store.end.value);
    const el = endInputRef.value;
    if (el && el.value !== String(v)) el.value = String(v);
  });
  useTask$(({track}) => {
    const start = store.start;
    if (!start) return;
    const v = track(() => start.value);
    const el = startInputRef.value;
    if (el && el.value !== String(v)) el.value = String(v);
  });

  const isRange = cfg.isRange;

  // Per-thumb derived geometry (see slider-thumb-state.ts's header comment
  // on why this is computed fresh every render instead of stored).
  const metricsFor = (which: ThumbKey) => {
    const thumb = thumbOf(store, which);
    const value = thumb.value;
    let ownMin = cfg.min;
    let ownMax = cfg.max;
    if (isRange) {
      const sibling = siblingOf(store, which);
      const mm = rangeMinMax(which === 'end', cfg.min, cfg.max, sibling.value);
      ownMin = mm.min;
      ownMax = mm.max;
    }
    const rawTranslateX = calcTranslateXByValue(value, cfg.min, cfg.max, store.cachedWidth, false);
    let translateX: number;
    if (isRange) {
      const isLeftThumb = which === 'start'; // LTR only — no RTL scenario is exercised.
      const sibling = siblingOf(store, which);
      // Bounded by the SIBLING's raw (unclamped) translateX, not its own
      // clamped result, to avoid a circular self/sibling dependency — a
      // no-op simplification for every value pair these scenarios use
      // (start/end always far enough apart that clamping never actually
      // engages; see slider-math.spec.ts's range translateX assertions).
      const siblingTranslateX = calcTranslateXByValue(
        sibling.value,
        cfg.min,
        cfg.max,
        store.cachedWidth,
        false,
      );
      const minPos = isLeftThumb ? TICK_MARK_OFFSET : siblingTranslateX;
      const maxPos = isLeftThumb ? siblingTranslateX : store.cachedWidth - TICK_MARK_OFFSET;
      translateX = clampRange(rawTranslateX, minPos, maxPos);
    } else {
      translateX = clampSingle(rawTranslateX, store.cachedWidth);
    }
    const valuetext = which === 'start' ? startValueText.value : endValueText.value;
    return {
      thumb,
      value,
      ownMin,
      ownMax,
      translateX,
      valuetext,
      shortValue: cfg.discrete && isShortValue(valuetext),
      withIndicator: thumbWithIndicator(store, which, isRange),
    };
  };

  const endMetrics = metricsFor('end');
  const startMetrics = isRange ? metricsFor('start') : undefined;

  // Track-active fill. Range: branches on `store.rangeTrackSource` — see
  // slider-math.ts's `trackActiveStyleRange` doc comment for why it isn't
  // always the start thumb (focusing either thumb re-renders this too, not
  // just a value change).
  const trackActiveStyle = isRange
    ? (() => {
        const sourceIsStart = store.rangeTrackSource === 'start';
        const sourceTranslateX = sourceIsStart ? startMetrics!.translateX : endMetrics.translateX;
        const siblingTranslateX = sourceIsStart ? endMetrics.translateX : startMetrics!.translateX;
        return trackActiveStyleRange(
          store.cachedWidth,
          sourceTranslateX,
          siblingTranslateX,
          sourceIsStart,
        );
      })()
    : trackActiveStyleNonRange(
        fillPercentage(endMetrics.translateX, store.cachedWidth, false),
        false,
      );

  // Tick marks — only once the width is known (matches upstream's `@if
  // (_cachedWidth)` gate inside the always-rendered `.mdc-slider__tick-marks`
  // container).
  let tickMarkFlags: boolean[] = [];
  let tickMarkWidthPx = 0;
  if (cfg.showTickMarks && store.cachedWidth) {
    tickMarkWidthPx = tickMarkTrackWidth(cfg.min, cfg.max, cfg.step, store.cachedWidth);
    if (isRange) {
      const {numInactiveBeforeStart, numActive, numInactiveAfterEnd} = tickMarkCountsRange(
        startMetrics!.value,
        endMetrics.value,
        cfg.min,
        cfg.max,
        cfg.step,
      );
      tickMarkFlags = [
        ...Array<boolean>(numInactiveBeforeStart).fill(false),
        ...Array<boolean>(numActive).fill(true),
        ...Array<boolean>(numInactiveAfterEnd).fill(false),
      ];
    } else {
      const {numActive, numInactive} = tickMarkCountsNonRange(
        endMetrics.value,
        cfg.min,
        cfg.max,
        cfg.step,
        false,
      );
      tickMarkFlags = [
        ...Array<boolean>(numActive).fill(true),
        ...Array<boolean>(numInactive).fill(false),
      ];
    }
  }

  // Native-input inactive/active width+padding+left/right. Single-thumb's
  // `_updateWidthActive` is a documented upstream no-op, so it always uses
  // the inactive formula. Range's `_updateWidthActive` (used only while
  // mid-drag) never touches left/right (upstream leaves them at whatever
  // the last inactive computation set) — no parity scenario drags a range
  // thumb, so this port always recomputes left/right from the current
  // (possibly mid-drag) values via the inactive formula and only swaps
  // width/padding when active, which is a reasonable, documented
  // approximation of that untested path (see SYNC.md).
  const inputStyleFor = (which: ThumbKey, metrics: ReturnType<typeof metricsFor>) => {
    if (!isRange) return inactiveWidthStyleNonRange();
    const isLeftThumb = which === 'start';
    const sibling = which === 'start' ? endMetrics : startMetrics!;
    const inactive = rangeWidthInactive(
      which === 'end',
      isLeftThumb,
      metrics.value,
      sibling.value,
      metrics.ownMin,
      metrics.ownMax,
      cfg.min,
      cfg.max,
      store.cachedWidth,
    );
    if (!metrics.thumb.isActive) return inactive;
    const active = rangeWidthActive(
      metrics.ownMin,
      metrics.ownMax,
      cfg.min,
      cfg.max,
      store.cachedWidth,
    );
    return {
      width: active.width,
      padding: active.padding,
      left: inactive.left,
      right: inactive.right,
    };
  };

  const hostClasses = [
    'mat-mdc-slider',
    'mdc-slider',
    `mat-${props.color ?? 'primary'}`,
    isRange && 'mdc-slider--range',
    cfg.disabled && 'mdc-slider--disabled',
    cfg.discrete && 'mdc-slider--discrete',
    cfg.showTickMarks && 'mdc-slider--tick-marks',
    noopAnimations.value && '_mat-animation-noopable',
    // No `mat-mdc-slider-with-animation` entry — see SliderStore's trailing
    // comment in slider-thumb-state.ts for why it's never rendered.
    props.class,
  ].filter(Boolean) as string[];

  // Lazy interaction handlers (design doc rule 7 — on*$ handlers, no
  // per-instance useVisibleTask$). Written as factories so the identical
  // logic serves both the single `end` thumb and (range mode) the `start`
  // thumb; each factory call still produces its own inline `$()` literal
  // (captures `which`, a plain string, plus the serializable `store`/
  // `props`/signals — never a function value from this closure).
  const onFocus$ = (which: ThumbKey) =>
    $(() => {
      // Defensive — a real disabled native input never dispatches `focus`
      // at all, so this never actually guards anything in a genuine user
      // interaction; kept for parity with the other handlers below (see
      // onPointerMove$'s comment for why THAT guard is load-bearing).
      if (props.disabled) return;
      handleThumbFocus(store, which, noopAnimations.value, RIPPLE_BOX);
    });

  const onBlur$ = (which: ThumbKey) =>
    $(() => {
      handleThumbBlur(store, which, noopAnimations.value, RIPPLE_BOX);
    });

  const onPointerMove$ = (which: ThumbKey, thumbRef: typeof endThumbRef) =>
    $((event: PointerEvent) => {
      // Load-bearing, unlike onFocus$'s: confirmed live (the `disabled`
      // scenario's force-click step) that a `force: true` Playwright click
      // still delivers a `pointermove` to a disabled native input even
      // though the browser suppresses `pointerdown`/`focus`/`input` for it
      // — without this guard the thumb would incorrectly start a hover
      // ripple.
      if (props.disabled) return;
      const thumb = thumbOf(store, which);
      if (thumb.isFocused) return;
      // The hover HIT-TEST uses the visual THUMB's own rect (matches
      // upstream's `_isCursorOnSliderThumb(event, this._hostElement.
      // getBoundingClientRect())`, where `_hostElement` is the thumb).
      const thumbRect = thumbRef.value?.getBoundingClientRect();
      if (!thumbRect) return;
      const hovered = isCursorOnSliderThumb(event.clientX, event.clientY, thumbRect);
      handleThumbPointerMove(store, which, hovered, noopAnimations.value, RIPPLE_BOX);
    });

  const onPointerLeave$ = (which: ThumbKey) =>
    $(() => {
      handleThumbPointerLeave(store, which);
    });

  const onPointerDown$ = (which: ThumbKey, inputRef: typeof endInputRef) =>
    $((event: PointerEvent) => {
      const liveCfg = readSliderConfig(props);
      handleThumbPointerDown(
        store,
        which,
        liveCfg,
        hostRef.value,
        inputRef.value,
        noopAnimations.value,
        RIPPLE_BOX,
        event,
        (value: number) => {
          // This gesture's single, authoritative emission — see
          // ThumbStore.correctionPending's doc comment. `handleThumbInput`'s
          // own emission (below) was suppressed for this exact value while
          // this correction was pending.
          if (which === 'start') props.onStartValueChange$?.(value);
          else if (liveCfg.isRange) props.onEndValueChange$?.(value);
          else props.onValueChange$?.(value);
        },
      );
    });

  const onPointerUp$ = (which: ThumbKey) =>
    $(() => {
      handleThumbPointerUp(store, which);
    });

  const onInput$ = (which: ThumbKey) =>
    $((event: Event) => {
      const el = event.target as HTMLInputElement;
      const newValue = Number(el.value);
      const liveCfg = readSliderConfig(props);
      const thumb = thumbOf(store, which);
      handleThumbInput(store, which, newValue);
      // Suppressed while a pointerdown's deferred correction is pending —
      // its own `onSettled` call above is this gesture's sole emission
      // (see ThumbStore.correctionPending's doc comment for the ordering
      // race this avoids). Still reached normally for every keyboard-driven
      // `input` (no pointerdown precedes those) and for continued dragging
      // once the initial correction has already settled.
      if (thumb.correctionPending) return;
      thumb.lastEmittedValue = newValue;
      if (which === 'start') props.onStartValueChange$?.(newValue);
      else if (liveCfg.isRange) props.onEndValueChange$?.(newValue);
      else props.onValueChange$?.(newValue);
    });

  // ── Rendering ────────────────────────────────────────────────────────

  const renderInput = (which: ThumbKey) => {
    const metrics = which === 'start' ? startMetrics! : endMetrics;
    const inputRef = which === 'start' ? startInputRef : endInputRef;
    const thumbRef = which === 'start' ? startThumbRef : endThumbRef;
    const style = inputStyleFor(which, metrics);
    const isLeftThumb = which === 'start';
    return (
      <input
        ref={inputRef}
        class={['mdc-slider__input', isRange && !isLeftThumb && 'mat-slider__right-input'].filter(
          Boolean,
        )}
        type="range"
        aria-valuetext={metrics.valuetext}
        disabled={cfg.disabled || undefined}
        min={metrics.ownMin}
        max={metrics.ownMax}
        step={cfg.step}
        value={metrics.value}
        style={style}
        onFocus$={onFocus$(which)}
        onBlur$={onBlur$(which)}
        onPointerMove$={onPointerMove$(which, thumbRef)}
        onPointerLeave$={onPointerLeave$(which)}
        onPointerDown$={onPointerDown$(which, inputRef)}
        onPointerUp$={onPointerUp$(which)}
        onInput$={onInput$(which)}
      />
    );
  };

  const renderVisualThumb = (which: ThumbKey) => {
    const metrics = which === 'start' ? startMetrics! : endMetrics;
    const thumbRef = which === 'start' ? startThumbRef : endThumbRef;
    const rippleSlots = (
      [metrics.thumb.hoverRipple, metrics.thumb.focusRipple, metrics.thumb.activeRipple].filter(
        Boolean,
      ) as NonNullable<typeof metrics.thumb.hoverRipple>[]
    ).sort((a, b) => a.token - b.token);
    return (
      <mat-slider-visual-thumb
        ref={thumbRef}
        class={[
          'mdc-slider__thumb',
          'mat-mdc-slider-visual-thumb',
          metrics.shortValue && 'mdc-slider__thumb--short-value',
          metrics.withIndicator && 'mdc-slider__thumb--with-indicator',
          metrics.thumb.isFocused && 'mdc-slider__thumb--focused',
        ].filter(Boolean)}
        style={{transform: `translateX(${metrics.translateX}px)`}}
      >
        {cfg.discrete && (
          <div class="mdc-slider__value-indicator-container">
            <div class="mdc-slider__value-indicator">
              <span class="mdc-slider__value-indicator-text">{metrics.valuetext}</span>
            </div>
          </div>
        )}
        <div class="mdc-slider__thumb-knob" />
        <div
          {...({matripple: ''} as Record<string, string>)}
          class="mat-ripple mat-focus-indicator"
        >
          {rippleSlots.map(slot => (
            <div
              key={slot.token}
              class={['mat-ripple-element', slot.extraClass]}
              style={{
                ...slot.box,
                transitionDuration: `${slot.exiting ? slot.exitDuration : slot.enterDuration}ms`,
                transform: 'scale3d(1, 1, 1)',
                ...(slot.exiting ? {opacity: '0'} : {}),
              }}
            />
          ))}
        </div>
      </mat-slider-visual-thumb>
    );
  };

  return (
    <mat-slider ref={hostRef} class={hostClasses} style={props.style}>
      {isRange && renderInput('start')}
      {renderInput('end')}
      <div class="mdc-slider__track">
        <div class="mdc-slider__track--inactive" />
        <div class="mdc-slider__track--active">
          <div
            class="mdc-slider__track--active_fill"
            style={{
              left: trackActiveStyle.left,
              right: trackActiveStyle.right,
              transformOrigin: trackActiveStyle.transformOrigin,
              transform: trackActiveStyle.transform,
            }}
          />
        </div>
        {cfg.showTickMarks && (
          <div class="mdc-slider__tick-marks">
            {store.cachedWidth
              ? tickMarkFlags.map((active, index) => (
                  <div
                    key={index}
                    class={
                      active ? 'mdc-slider__tick-mark--active' : 'mdc-slider__tick-mark--inactive'
                    }
                    style={{
                      transform: tickMarkTransform(
                        index,
                        tickMarkFlags.length,
                        tickMarkWidthPx,
                        store.cachedWidth,
                        false,
                      ),
                    }}
                  />
                ))
              : null}
          </div>
        )}
      </div>
      {isRange && renderVisualThumb('start')}
      {renderVisualThumb('end')}
    </mat-slider>
  );
});
