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
}

export interface SliderStore {
  /** `MatSlider._cachedWidth`. 0 until the mount-time measurement runs. */
  cachedWidth: number;
  /** `MatSlider._cachedLeft`. */
  cachedLeft: number;
  /** `MatSlider._hasAnimation` → the sticky `mat-mdc-slider-with-animation` class. */
  hasAnimation: boolean;
  end: ThumbStore;
  /** Only present for a range slider. */
  start?: ThumbStore;
}

export type ThumbKey = 'start' | 'end';

export function createThumbStore(value: number): ThumbStore {
  return {value, isFocused: false, isActive: false, isHovered: false};
}

export function thumbOf(store: SliderStore, which: ThumbKey): ThumbStore {
  return which === 'start' ? store.start! : store.end;
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
): void {
  const thumb = thumbOf(store, which);
  hideRippleKind(thumb, 'hover');
  showRippleKind(thumb, 'focus', noopAnimations);
  thumb.isFocused = true;
  store.hasAnimation = false; // `_slider._setTransition(false)`
}

/** `MatSliderThumb._onBlur` + `MatSliderVisualThumb._onBlur`. */
export function handleThumbBlur(
  store: SliderStore,
  which: ThumbKey,
  noopAnimations: boolean,
): void {
  const thumb = thumbOf(store, which);
  if (!thumb.isActive) hideRippleKind(thumb, 'focus');
  if (thumb.isHovered) showRippleKind(thumb, 'hover', noopAnimations);
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
): void {
  const thumb = thumbOf(store, which);
  thumb.isHovered = isHovered;
  if (isHovered) {
    showRippleKind(thumb, 'hover', noopAnimations);
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
 * before the input(s) resize"). `onCorrected` is called only when the
 * correction actually changes the value (mirrors `_fixValue`'s own
 * `if (value === prevValue) { …; return; }` branch, which still re-syncs UI
 * but never emits `valueChange`).
 */
export function handleThumbPointerDown(
  store: SliderStore,
  which: ThumbKey,
  config: {min: number; max: number; step: number; disabled: boolean},
  hostEl: HTMLElement | undefined,
  inputEl: HTMLInputElement | undefined,
  noopAnimations: boolean,
  event: {button: number; clientX: number},
  onCorrected: (value: number) => void,
): void {
  if (event.button !== 0 || config.disabled) return;
  if (hostEl) {
    store.cachedWidth = hostEl.offsetWidth;
    store.cachedLeft = hostEl.getBoundingClientRect().left;
  }
  const thumb = thumbOf(store, which);
  thumb.isActive = true;
  thumb.isFocused = true;
  showRippleKind(thumb, 'active', noopAnimations);

  const clientX = event.clientX;
  const cachedLeftAtDown = store.cachedLeft;
  const cachedWidthAtDown = store.cachedWidth;
  setTimeout(() => {
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
    store.hasAnimation = false; // `_updateThumbUIByValue()` with no options
    if (fixed === prev) return;
    inputEl.value = String(fixed);
    thumbOf(store, which).value = fixed;
    onCorrected(fixed);
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
 * `MatSliderThumb._onInput`. `withAnimation` mirrors
 * `this._slider.step || !this._isActive` — true whenever a step is defined
 * (always, in every scenario here) or the thumb isn't mid-drag.
 */
export function handleThumbInput(
  store: SliderStore,
  which: ThumbKey,
  newValue: number,
  hasStep: boolean,
): void {
  const thumb = thumbOf(store, which);
  thumb.value = newValue;
  if (hasStep || !thumb.isActive) {
    store.hasAnimation = true;
  }
}
