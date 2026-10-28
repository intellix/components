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
 * `width` ARE a live measurement — see `computeRippleBox`'s doc comment for
 * why a hardcoded constant isn't good enough here, unlike most of this
 * port's other geometry.
 */

export type RippleKind = 'hover' | 'focus' | 'active';

export interface RippleBox {
  left: string;
  top: string;
  height: string;
  width: string;
}

/**
 * `MatRipple.launch()`'s `centered: true` with the fixed `radius: 24`
 * `MatSliderVisualThumb.ngAfterViewInit` sets, applied to `fadeInRipple`'s
 * formula (`offsetX/Y - radius`, where `centered` makes `offsetX/Y` the
 * container's own center: `containerRect.width/height / 2`). The container
 * (`.mat-ripple` inside `.mat-mdc-slider-visual-thumb`) is 48x48 by CSS
 * (`.mdc-slider__thumb { height: 48px; width: 48px; }` plus `.mat-mdc-
 * slider-visual-thumb .mat-ripple { height: 100%; width: 100%; }`, both
 * byte-for-byte synced from upstream), so this should always resolve to
 * exactly `left: 0px; top: 0px;` — and did, until a live comparison on the
 * `range` scenario caught upstream rendering `left: -7.6e-06px` for one
 * thumb's focus ripple: ordinary sub-pixel layout rounding (this thumb's
 * own `translateX` is a non-integer, e.g. 94.14px), which makes the
 * CONTAINER's real `getBoundingClientRect().width` resolve to something
 * like `47.99998...` rather than an exact `48`, not a logic bug. A
 * hardcoded `48` can never reproduce that kind of noise, so this takes the
 * container's measured width/height instead — not because the SHAPE is
 * ever expected to meaningfully differ from the 48x48 CSS size, but because
 * matching the ARITHMETIC (measure, don't assume) is what actually
 * reproduces it when the browser's own rounding kicks in. The caller
 * (mat-slider.tsx) measures via a ref — this function itself takes plain
 * numbers, not an `Element`, so it stays DOM-free and testable.
 */
export function computeRippleBox(containerWidth: number, containerHeight: number): RippleBox {
  const radius = 24;
  return {
    left: `${containerWidth / 2 - radius}px`,
    top: `${containerHeight / 2 - radius}px`,
    height: `${radius * 2}px`,
    width: `${radius * 2}px`,
  };
}

export interface RippleSlot {
  /** Identity token so a late, superseded exit timer is a safe no-op. */
  token: number;
  /** The kind-specific class added alongside `mat-ripple-element`. */
  extraClass: string;
  /** `RippleState.FADING_OUT` — `hideRippleKind` already called, mid-exit. */
  exiting: boolean;
  enterDuration: number;
  exitDuration: number;
  /** `Date.now()` when shown — see `hideRippleKind`'s doc comment for why
   *  removal timing needs this, not just `exitDuration`. */
  createdAt: number;
  /** Measured once at show time via `computeRippleBox`. */
  box: RippleBox;
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
  box: RippleBox,
): void {
  if (isRippleKindShown(thumb, kind)) return;
  const spec = RIPPLE_SPEC[kind];
  const createdAt = Date.now();
  thumb[slotKey(kind)] = {
    token: ++tokenCounter,
    extraClass: spec.cls,
    exiting: false,
    enterDuration: noopAnimations ? 0 : spec.enter,
    exitDuration: noopAnimations ? 0 : spec.exit,
    createdAt,
    box,
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
 * immediate-finish branch.
 *
 * The active ripple (225ms enter / 400ms exit) is more involved — confirmed
 * live against the real rendered Angular app (a 300px `basic` slider,
 * tab-focus then a plain click): `fadeOut()` runs essentially immediately
 * after creation (pointerdown's active ripple, faded on the very next
 * pointerup), well before its 225ms enter transition would finish on its
 * own. A real browser does NOT retarget that already-running transform
 * transition just because `transition-duration` changes (its target value,
 * `scale3d(1,1,1)`, is unchanged) — it keeps running on its ORIGINAL 225ms
 * schedule and fires `transitionend` around 225ms after creation, and
 * upstream's handler reacts to ANY `transitionend` on the element
 * regardless of which property fired it: by then `state` is already
 * `FADING_OUT`, so it destroys the ripple right then — before the fresh
 * 400ms exit opacity transition `fadeOut()` just started would ever
 * complete on its own. Measured removal: ~225-250ms after the click, not
 * ~400ms after pointerup.
 *
 * This port does not reproduce that ~225ms figure, though: this harness's
 * `expectMaterialParity` runs each step on the Angular page FIRST, then
 * (sequentially, not in parallel) on the Qwik page, each with its OWN
 * fixed `waitForTimeout`, then compares. That gives the Angular page's own
 * click/drag extra real wall-clock time to settle before the comparison —
 * everything the QWIK step itself takes (navigating to the element,
 * dispatching the gesture, ITS OWN wait) elapses first — while the Qwik
 * page only gets its own short wait. A delay anywhere near the
 * ~225-400ms range that upstream's real timing occupies is therefore NOT
 * safely within the Qwik side's actual comparison-time budget (observed
 * empirically: ~120-180ms, depending on the step), even though it IS within
 * Angular's. Since no scenario here ever checks for the active ripple's
 * PRESENCE — only, eventually, its absence — and ripple ANIMATION timing is
 * explicitly out of scope for this port's DOM-parity goal (design doc rule
 * 6), this is resolved by removing it promptly once `exiting` begins if the
 * enter phase hasn't settled yet, rather than modeling the interrupted-
 * transition delay precisely.
 *
 * The `token` guard discards a stale timer if the same kind was hidden then
 * shown again before the first timer fired.
 */
export function hideRippleKind(thumb: RippleCapableThumb, kind: RippleKind): void {
  const key = slotKey(kind);
  const slot = thumb[key];
  if (!slot || slot.exiting) return;
  const token = slot.token;
  slot.exiting = true;

  const elapsedSinceCreate = Date.now() - slot.createdAt;
  const delay = elapsedSinceCreate < slot.enterDuration ? 0 : slot.exitDuration;

  if (delay <= 0) {
    thumb[key] = undefined;
    return;
  }
  setTimeout(() => {
    const current = thumb[key];
    if (current && current.token === token) {
      thumb[key] = undefined;
    }
  }, delay);
}
