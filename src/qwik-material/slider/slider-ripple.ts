/**
 * Minimal, slider-specific port of `MatRipple.launch()` / `RippleRenderer.
 * fadeInRipple`/`fadeOutRipple` (`src/material/core/ripple/ripple*.ts`),
 * scoped to exactly what `MatSliderVisualThumb._showRipple`/`_hideRipple`
 * need: three independent, named ripple "slots" per thumb (hover/focus/
 * active), each a simple visible/exiting boolean machine with a real
 * `setTimeout`-driven exit after `exitDuration` ms.
 *
 * Deliberately NOT a general-purpose ripple renderer (no click-triggered
 * auto-ripples, no arbitrary coordinates) — slider never uses those; every
 * launch here is one of the three MANUAL calls `_showHoverRipple`/
 * `_showFocusRipple`/`_showActiveRipple` make, always `centered: true` with
 * a fixed `radius: 24`. Per the DOM-parity remediation design's rule 6
 * ("ripple element animation itself is out of scope; the static ripple
 * containers/attributes are not"), the goal is matching DOM presence/
 * classes/inline-style VALUES at any observed instant, not reproducing the
 * CSS transition visually.
 *
 * The rendered `<div class="mat-ripple-element …">`'s `left`/`top`/`height`/
 * `width` are NOT computed here — see mat-slider.tsx's `RIPPLE_ELEMENT_BOX`
 * doc comment for why they're constants (0/0/48/48), not a live
 * `getBoundingClientRect()` measurement.
 */

export type RippleKind = 'hover' | 'focus' | 'active';

export interface RippleSlot {
  /** Identity token so a late, superseded exit timer is a safe no-op. */
  token: number;
  /** The kind-specific class added alongside `mat-ripple-element`. */
  extraClass: string;
  /** `RippleState.FADING_OUT` — `hideRippleKind` already called, mid-exit. */
  exiting: boolean;
  enterDuration: number;
  exitDuration: number;
}

export interface RippleCapableThumb {
  hoverRipple?: RippleSlot;
  focusRipple?: RippleSlot;
  activeRipple?: RippleSlot;
}

/** `MatSliderVisualThumb._show{Hover,Focus,Active}Ripple`'s animation configs. */
const RIPPLE_SPEC: Record<RippleKind, {enter: number; exit: number; cls: string}> = {
  hover: {enter: 0, exit: 0, cls: 'mat-mdc-slider-hover-ripple'},
  focus: {enter: 0, exit: 0, cls: 'mat-mdc-slider-focus-ripple'},
  active: {enter: 225, exit: 400, cls: 'mat-mdc-slider-active-ripple'},
};

function slotKey(kind: RippleKind): 'hoverRipple' | 'focusRipple' | 'activeRipple' {
  return `${kind}Ripple` as const;
}

let tokenCounter = 0;

/** `MatSliderVisualThumb._isShowingRipple` for one specific kind. */
export function isRippleKindShown(thumb: RippleCapableThumb, kind: RippleKind): boolean {
  const slot = thumb[slotKey(kind)];
  return !!slot && !slot.exiting;
}

/** `MatSliderVisualThumb._isShowingAnyRipple`. */
export function isShowingAnyRipple(thumb: RippleCapableThumb): boolean {
  return (
    isRippleKindShown(thumb, 'hover') ||
    isRippleKindShown(thumb, 'focus') ||
    isRippleKindShown(thumb, 'active')
  );
}

/**
 * `_show{Hover,Focus,Active}Ripple` + `MatRipple.launch()`/`fadeInRipple`.
 * Idempotent — a no-op if this kind is already visible (mirrors the
 * `_isShowingRipple` guard every upstream `_show*Ripple` method has).
 * `noopAnimations` forces both durations to 0, matching `_showRipple`'s own
 * `this._slider._noopAnimations ? {enterDuration: 0, exitDuration: 0} : animation`.
 */
export function showRippleKind(
  thumb: RippleCapableThumb,
  kind: RippleKind,
  noopAnimations: boolean,
): void {
  if (isRippleKindShown(thumb, kind)) return;
  const spec = RIPPLE_SPEC[kind];
  thumb[slotKey(kind)] = {
    token: ++tokenCounter,
    extraClass: spec.cls,
    exiting: false,
    enterDuration: noopAnimations ? 0 : spec.enter,
    exitDuration: noopAnimations ? 0 : spec.exit,
  };
}

/**
 * `_hideRipple`'s `rippleRef?.fadeOut()` — scoped to one ripple-element's
 * lifecycle only (the cross-thumb value-indicator bookkeeping that method
 * also does is this port's responsibility elsewhere: see
 * `slider-thumb-state.ts`'s `thumbWithIndicator`, a pure derivation that
 * makes that bookkeeping unnecessary — see that file's doc comment). A 0ms
 * exit duration (hover/focus) removes the slot synchronously, matching
 * `RippleRenderer.fadeOutRipple`'s own `!animationConfig.exitDuration`
 * immediate-finish branch; a non-zero duration (active: 400ms) removes it
 * after that many REAL milliseconds, matching the actual CSS-transition-
 * driven removal timing closely enough for every timing-sensitive step in
 * `angular-parity.spec.ts` (which always waits well past 400ms before the
 * next comparison). The `token` guard discards a stale timer if the same
 * kind was hidden then shown again before the first timer fired.
 */
export function hideRippleKind(thumb: RippleCapableThumb, kind: RippleKind): void {
  const key = slotKey(kind);
  const slot = thumb[key];
  if (!slot || slot.exiting) return;
  const token = slot.token;
  slot.exiting = true;
  if (slot.exitDuration === 0) {
    thumb[key] = undefined;
    return;
  }
  setTimeout(() => {
    const current = thumb[key];
    if (current && current.token === token) {
      thumb[key] = undefined;
    }
  }, slot.exitDuration);
}
