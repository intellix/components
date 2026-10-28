/**
 * Store shape + plain (non-QRL) event-handling logic shared by `mat-slider.
 * tsx`'s inline `$()` handlers. These are plain module-level functions, not
 * hooks or QRLs: `$()` handlers can call an imported plain function freely
 * (it ships in the same chunk), but they CANNOT call a closure captured
 * from the enclosing `component$` body — see this file's companion comment
 * in mat-slider.tsx for why the logic lives here instead of inline.
 *
 * Design choice (see SYNC.md "derived-render architecture"): only truly
 * stateful, event-driven fields live in the store below (current value,
 * focus/active/hover flags, ripple slots, measured width/left, the sticky
 * animation class). Everything else upstream stores as a field — translateX,
 * track-active style, tick marks, value-indicator text/short-value,
 * per-thumb native-input width/padding/left, range min/max — is PURE
 * geometry derived fresh every render from these primitives via
 * `slider-math.ts`, computed directly in mat-slider.tsx's JSX. This matches
 * upstream's actual observed behavior (confirmed while tracing
 * `MatSliderRangeThumb._onInput`: it recomputes BOTH its own and its
 * sibling's width on every input, i.e. always from current values, never a
 * stale snapshot) while avoiding an entire category of "forgot to also
 * update the derived field" bugs upstream's imperative model is prone to.
 */
import {
  hideRippleKind,
  isShowingAnyRipple,
  showRippleKind,
  type RippleBox,
  type RippleCapableThumb,
} from './slider-ripple';
import {fixValueFromClientX} from './slider-math';

export interface ThumbStore extends RippleCapableThumb {
  value: number;
  /** `MatSliderThumb._isFocused`. */
  isFocused: boolean;
  /** `MatSliderThumb._isActive` (mirrors `MatSliderVisualThumb._isActive` —
   *  both flip on the same native pointerdown/pointerup, see slider-interface.ts). */
  isActive: boolean;
  /** `MatSliderVisualThumb._isHovered`. */
  isHovered: boolean;
  /**
   * The last value THIS component told its `onValueChange$`/`onStartValue
   * Change$`/`onEndValueChange$` consumer about (`undefined` until the first
   * emission). Has no upstream equivalent — it exists purely to let
   * mat-slider.tsx's controlled "prop -> store" sync `useTask$` reject a
   * STALE echo of its own earlier emission, a defense-in-depth backstop for
   * the race `correctionPending` (below) is the primary fix for. See
   * SYNC.md "controlled-value echo race" for the full story; short version:
   * emitting twice in quick succession through a QRL-resolved consumer
   * callback — unlike Angular's synchronous, same-tick zone change
   * detection — has no ordering guarantee, so a naive double-emit can have
   * the consumer observe them in EITHER order.
   */
  lastEmittedValue?: number;
  /**
   * True from the moment a pointerdown schedules the `_fixValue`-equivalent
   * deferred correction (`handleThumbPointerDown`'s `setTimeout`) until that
   * correction actually runs. While true, `handleThumbInput` (the native
   * `input` event) still updates `value` locally (matching upstream's own
   * momentary "native, uncorrected position" flicker — see slider-input.ts:
   * `_onInput` always calls `_updateThumbUIByValue` immediately) but
   * mat-slider.tsx's `onInput$` handler SKIPS calling the external
   * `onValueChange$`-family callback for it, deferring to the correction's
   * own single, authoritative emission once it settles. Needed because a
   * naive "emit from both `input` and the correction" (upstream's actual
   * dual-emission shape: `_onChange` on native `change` + `_fixValue`) can
   * have the FIRST (now-stale) emission's own QRL resolution finish
   * AFTER the second — observed live: the "basic" scenario's click briefly
   * had the stale, uncorrected `76` arrive at the consumer ~20ms AFTER the
   * correction had already told it `75`, leaving the consumer's own state
   * stuck on the wrong value. Suppressing the first emission entirely
   * (rather than just racing to correct it) sidesteps the ordering problem.
   */
  correctionPending?: boolean;
}

export interface SliderStore {
  /** `MatSlider._cachedWidth`. 0 until the mount-time measurement runs. */
  cachedWidth: number;
  /** `MatSlider._cachedLeft`. */
  cachedLeft: number;
  end: ThumbStore;
  /** Only present for a range slider. */
  start?: ThumbStore;
  /**
   * Range mode only: which thumb most recently triggered `MatSlider.
   * _updateTrackUI` upstream — i.e. the last one to fire either a native
   * `input` (value change) or `focus` event (`MatSliderThumb._onFocus`
   * ALSO calls `_updateTrackUI(this)` — see `trackActiveStyleRange`'s doc
   * comment in slider-math.ts). Drives which branch mat-slider.tsx's
   * track-active style computation takes. Defaults to `'start'`, matching
   * upstream's mount-time settled state (not literally what `ngAfterViewInit`
   * itself computes last — see that same doc comment for why).
   */
  rangeTrackSource: ThumbKey;
}

// Note: `MatSlider._hasAnimation` / the `mat-mdc-slider-with-animation` host
// class it drives has NO corresponding field here — confirmed live it is
// NEVER actually observable in Angular's rendered DOM, despite `_setTransition`
// genuinely toggling it via a raw `classList.toggle()` call. `MatSlider`'s
// host metadata includes a bare `'[class]': '"mat-" + (color || "primary")'`
// binding (not `[class.foo]`) alongside its other `[class.foo]` bindings;
// Angular's Ivy class-binding instructions for an element with ANY such
// binding own the ENTIRE computed class list and rewrite it from their own
// tracked state on every change-detection pass — which runs synchronously,
// via zone.js, immediately after the very event handler that called
// `_setTransition` returns. A class toggled by reaching straight into
// `classList` outside that tracked set is therefore wiped out the instant
// CD next reconciles the host's classes, before any observer (a real user,
// a screen reader, or this harness) could ever see it. Verified by polling
// the real Angular app's rendered class list every 5ms through a keyboard-
// driven value change (`_setTransition(true)` definitely runs — the value
// itself changes) — the class never appears, not even transiently. This
// also matches angular-parity.spec.ts note 2's own hedge ("isn't load-
// bearing for the comparison") precisely because it is never load-bearing
// for ANY comparison: this port simply never renders it.

export type ThumbKey = 'start' | 'end';

export function createThumbStore(value: number): ThumbStore {
  return {value, isFocused: false, isActive: false, isHovered: false};
}

export function thumbOf(store: SliderStore, which: ThumbKey): ThumbStore {
  return which === 'start' ? store.start! : store.end;
}

/**
 * Guards mat-slider.tsx's controlled "prop -> store" sync tasks against the
 * stale-echo race `ThumbStore.lastEmittedValue`'s doc comment describes.
 * Trusts an incoming value if nothing has been emitted yet (the initial,
 * mount-time sync) or if it matches the most recent emission; rejects an
 * older, now-superseded echo.
 */
export function shouldAcceptExternalValue(thumb: ThumbStore, value: number): boolean {
  return thumb.lastEmittedValue === undefined || value === thumb.lastEmittedValue;
}

/**
 * `MatSlider._getThumb`'s self-referencing fallback: with only one visual
 * thumb (non-range — `_thumbs.first === _thumbs.last`), a thumb's own
 * "sibling" is itself. This is what makes the non-range half of
 * `_hideRipple`'s sibling check a no-op re-check of `self` rather than a
 * special case this port needs to branch on separately.
 */
export function siblingOf(store: SliderStore, which: ThumbKey): ThumbStore {
  if (!store.start) return store.end;
  return which === 'start' ? store.end : store.start;
}

/**
 * `mdc-slider__thumb--with-indicator`, derived from current ripple state
 * instead of stored (see this file's header comment). Equivalent to
 * upstream's stateful `_showValueIndicator`/`_hideValueIndicator` bookkeeping
 * for every snapshot a real user could observe: `_showRipple` sets it on self
 * (always) and on the sibling (range only) the instant a ripple shows, and
 * `_hideRipple` only ever clears it once NEITHER self nor (for range) the
 * sibling has any ripple left — i.e. "indicator visible" always exactly
 * tracks "self or (if range) sibling is showing a ripple" at any settled
 * instant. The one window where upstream's stateful version could
 * transiently diverge (a blur-then-focus hand-off between two range thumbs,
 * where `_hideRipple` briefly sees NEITHER thumb showing a ripple between the
 * old one's blur and the new one's focus) is synchronous and over before any
 * observer — including this harness, which only ever snapshots after a
 * settle — could see it: see SYNC.md "value-indicator is a pure derivation".
 */
export function thumbWithIndicator(store: SliderStore, which: ThumbKey, isRange: boolean): boolean {
  if (isShowingAnyRipple(thumbOf(store, which))) return true;
  return isRange && isShowingAnyRipple(siblingOf(store, which));
}

/** `MatSliderVisualThumb._onPointerMove`'s circular hit-test against the
 *  visual thumb's own bounding rect. */
export function isCursorOnSliderThumb(
  clientX: number,
  clientY: number,
  rect: {x: number; y: number; width: number; height: number},
): boolean {
  const radius = rect.width / 2;
  const centerX = rect.x + radius;
  const centerY = rect.y + radius;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  return dx * dx + dy * dy < radius * radius;
}

/** `MatSliderThumb._onFocus` + `MatSliderVisualThumb._onFocus`. */
export function handleThumbFocus(
  store: SliderStore,
  which: ThumbKey,
  noopAnimations: boolean,
  box: RippleBox,
): void {
  const thumb = thumbOf(store, which);
  hideRippleKind(thumb, 'hover');
  showRippleKind(thumb, 'focus', noopAnimations, box);
  thumb.isFocused = true;
  store.rangeTrackSource = which; // `_onFocus`'s own `_updateTrackUI(this)` call
  // `_slider._setTransition(false)` — no store write; see SliderStore's
  // trailing comment on why `_hasAnimation` has no field here.
}

/** `MatSliderThumb._onBlur` + `MatSliderVisualThumb._onBlur`. */
export function handleThumbBlur(
  store: SliderStore,
  which: ThumbKey,
  noopAnimations: boolean,
  box: RippleBox,
): void {
  const thumb = thumbOf(store, which);
  if (!thumb.isActive) hideRippleKind(thumb, 'focus');
  if (thumb.isHovered) showRippleKind(thumb, 'hover', noopAnimations, box);
  thumb.isFocused = false;
}

/** `MatSliderVisualThumb._onPointerMove` (the hover-ripple half; the
 *  `_isFocused` early-return guard is the caller's job since it needs no
 *  store write either way). */
export function handleThumbPointerMove(
  store: SliderStore,
  which: ThumbKey,
  isHovered: boolean,
  noopAnimations: boolean,
  box: RippleBox,
): void {
  const thumb = thumbOf(store, which);
  thumb.isHovered = isHovered;
  if (isHovered) {
    showRippleKind(thumb, 'hover', noopAnimations, box);
  } else {
    hideRippleKind(thumb, 'hover');
  }
}

/** `MatSliderVisualThumb._onMouseLeave`. */
export function handleThumbPointerLeave(store: SliderStore, which: ThumbKey): void {
  const thumb = thumbOf(store, which);
  thumb.isHovered = false;
  hideRippleKind(thumb, 'hover');
}

/**
 * `MatSliderThumb._onPointerDown` + `MatSliderVisualThumb._onDragStart` +
 * the deferred `_handleValueCorrection`/`_fixValue` (via a real
 * `setTimeout(…, 0)`, matching upstream's own comment on why it must be
 * deferred: "the value on pointerdown … is calculated in the split second
 * before the input(s) resize"). `onSettled` is ALWAYS called exactly once,
 * ~0ms later, with whatever the authoritative final value is — whether or
 * not the correction actually changed anything — because it is this port's
 * SINGLE emission point for the whole gesture's initial value (see
 * `ThumbStore.correctionPending`'s doc comment for why `handleThumbInput`'s
 * own native-`input`-triggered emission is suppressed for the window this
 * function opens).
 */
export function handleThumbPointerDown(
  store: SliderStore,
  which: ThumbKey,
  config: {min: number; max: number; step: number; disabled: boolean},
  hostEl: HTMLElement | undefined,
  inputEl: HTMLInputElement | undefined,
  noopAnimations: boolean,
  box: RippleBox,
  event: {button: number; clientX: number},
  onSettled: (value: number) => void,
): void {
  if (event.button !== 0 || config.disabled) return;
  if (hostEl) {
    store.cachedWidth = hostEl.offsetWidth;
    store.cachedLeft = hostEl.getBoundingClientRect().left;
  }
  const thumb = thumbOf(store, which);
  thumb.isActive = true;
  thumb.isFocused = true;
  thumb.correctionPending = true;
  showRippleKind(thumb, 'active', noopAnimations, box);

  const clientX = event.clientX;
  const cachedLeftAtDown = store.cachedLeft;
  const cachedWidthAtDown = store.cachedWidth;
  setTimeout(() => {
    thumb.correctionPending = false;
    if (!inputEl) return;
    const fixed = fixValueFromClientX(
      clientX,
      cachedLeftAtDown,
      cachedWidthAtDown,
      config.min,
      config.max,
      config.step,
      false,
    );
    const prev = Number(inputEl.value);
    // `_updateThumbUIByValue()` with no options -> `_setTransition(false)` —
    // no store write; see SliderStore's trailing comment.
    if (fixed !== prev) {
      inputEl.value = String(fixed);
      thumb.value = fixed;
    }
    thumb.lastEmittedValue = fixed; // see ThumbStore.lastEmittedValue's doc comment
    onSettled(fixed);
  }, 0);
}

/** `MatSliderThumb._onPointerUp` + `MatSliderVisualThumb._onDragEnd`. */
export function handleThumbPointerUp(store: SliderStore, which: ThumbKey): void {
  const thumb = thumbOf(store, which);
  if (!thumb.isActive) return;
  thumb.isActive = false;
  hideRippleKind(thumb, 'active');
  if (!thumb.isFocused) hideRippleKind(thumb, 'focus');
}

/**
 * `MatSliderThumb._onInput`. Upstream gates its own UI-sync call on
 * `this._slider.step || !this._isActive` (true whenever a step is defined —
 * always, in every scenario here — or the thumb isn't mid-drag), but that
 * gate only controls whether `_updateThumbUIByValue` (and, through it,
 * `_setTransition`, dropped entirely — see `SliderStore`'s trailing
 * comment) runs; it never gates `this.value` itself. This port's `value`
 * IS the single source of truth for the visual thumb/track-active position
 * (derived fresh every render in mat-slider.tsx — see slider-thumb-
 * state.ts's header comment), so there is nothing left for that gate to
 * usefully control here. Updates `value` unconditionally (matching
 * upstream's own immediate, possibly-uncorrected UI update — see
 * `ThumbStore.correctionPending`'s doc comment); the CALLER (mat-slider.
 * tsx's `onInput$`) decides whether to also emit externally, skipping it
 * while `correctionPending` so the pending correction's own `onSettled`
 * stays this gesture's sole emission.
 */
export function handleThumbInput(store: SliderStore, which: ThumbKey, newValue: number): void {
  thumbOf(store, which).value = newValue;
  store.rangeTrackSource = which; // `_onInput`'s `_updateTrackUI(this)` call chain
}
