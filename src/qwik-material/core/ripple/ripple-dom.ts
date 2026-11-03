import type {RippleAnimationConfig, RippleConfig} from './ripple-ref';
import {getRippleRenderer} from './ripple-registry';
import type {RippleTarget} from './ripple-renderer';
import type {RippleGlobalOptions} from './ripple-global-options';

/**
 * The Qwik-facing half of this port — called from inside a component's own
 * `$()` event handler.
 *
 * Upstream wires `MatRipple`'s trigger element through
 * `RippleEventManager` — a single, lazily-installed, document-level
 * capturing listener per event type that looks up which registered
 * elements the event's target falls under (`src/material/core/ripple/
 * ripple-event-manager.ts`). This port does NOT reproduce that class:
 * Qwik's own event-prop/`useOn()` mechanism (qwikloader) already installs
 * exactly one document-level listener per event type and dispatches by
 * reading each element's serialized `on:<event>` attribute — the same
 * "minimize listeners via delegation" goal `RippleEventManager` exists for,
 * already met by the framework these components render with. Porting a
 * second delegation layer on top would only duplicate that, not add
 * anything upstream's own design is trying to achieve.
 *
 * `handleRippleEvent()` below is the SOLE entry point every caller uses,
 * for `mousedown`/`touchstart` AND `mouseup`/`mouseleave`/`touchend`/
 * `touchcancel` alike, dispatching internally on `event.type`. Every caller
 * MUST wire the exact same `$()` reference to all six JSX event props
 * (`onMouseDown$`/`onMouseUp$`/`onMouseLeave$`/`onTouchStart$`/
 * `onTouchEnd$`/`onTouchCancel$`) rather than one `$()` per event type —
 * see `ripple-renderer.ts`'s module doc comment for why that's not just a
 * style preference: it's what makes `RippleRenderer.handleMouseDown`'s
 * `_isPointerDown = true` reliably run BEFORE `handlePointerUp()` reads it
 * for the pointer-down/pointer-up pair of a single click, even on a cold
 * (never-loaded-before) chunk.
 */

/**
 * `target.rippleDisabled` is checked by the renderer itself, so a null/undefined/disabled
 * container is simply a no-op call (mirrors every ripple-bearing component's own `[matRippleDisabled]`
 * check already happening *inside* `RippleRenderer`, not at each call site).
 *
 * `globalOptions` (optional, 4th arg) is `MAT_RIPPLE_GLOBAL_OPTIONS`'s resolved value — pass the
 * result of `useRippleGlobalOptions()` (captured during the caller's own render, same as
 * `useAnimationsDisabled()` is already captured) to fold app-wide ripple options into THIS call,
 * exactly matching upstream `MatRipple`'s `rippleConfig`/`rippleDisabled` getters:
 * `rippleDisabled = target.rippleDisabled || globalOptions.disabled`, and `animation` spreads in
 * upstream's own order — `{...globalOptions.animation, ...target.rippleConfig.animation}` — so a
 * caller's own `rippleAnimationConfig(animationsDisabled, overrides)` result (itself already
 * `{...disabledForcedZero, ...overrides}`) wins over the global default exactly like upstream's
 * `{...this._globalOptions.animation, ...(disabled ? zero : {}), ...this.animation}` chain.
 * `terminateOnPointerUp` is ONLY ever a global option upstream (no per-component input exists for
 * it), so it's taken from `globalOptions` outright. Every one of this port's existing internal
 * ripple call sites (button/checkbox/radio/chips/menu-item/mat-option/slide-toggle/tabs) passes
 * this; omitting it (the pre-2026-11-03 call shape) behaves exactly as before — fully backward
 * compatible.
 */
export function handleRippleEvent(
  event: MouseEvent | TouchEvent,
  container: Element | null | undefined,
  target: RippleTarget,
  globalOptions?: RippleGlobalOptions,
): void {
  if (!container) return;
  const renderer = getRippleRenderer(container);
  const effectiveTarget: RippleTarget = globalOptions
    ? {
        rippleDisabled: target.rippleDisabled || !!globalOptions.disabled,
        rippleConfig: {
          ...target.rippleConfig,
          animation: {...globalOptions.animation, ...target.rippleConfig.animation},
          terminateOnPointerUp:
            globalOptions.terminateOnPointerUp ?? target.rippleConfig.terminateOnPointerUp,
        },
      }
    : target;
  switch (event.type) {
    case 'mousedown':
      renderer.handleMouseDown(event as MouseEvent, effectiveTarget);
      break;
    case 'touchstart':
      renderer.handleTouchStart(event as TouchEvent, effectiveTarget);
      break;
    case 'mouseup':
    case 'mouseleave':
    case 'touchend':
    case 'touchcancel':
      renderer.handlePointerUp();
      break;
  }
}

/**
 * `MatRipple.launch(x, y, config)` equivalent for a component that needs to
 * trigger a ripple programmatically rather than from a real pointer event.
 * Exposed for completeness/parity (and any future consumer) — no CURRENT
 * qwik-material consumer needs it: the only upstream component that calls
 * `.launch()` manually is the slider's visual thumb
 * (`MatSliderVisualThumb._showRipple`), which this port already handles
 * with its own purpose-built, three-slot `slider-ripple.ts` state machine
 * (left untouched by this change — see that file's own doc comment).
 */
export function launchRipple(
  container: Element,
  x: number,
  y: number,
  config?: RippleConfig,
): ReturnType<ReturnType<typeof getRippleRenderer>['fadeInRipple']> {
  return getRippleRenderer(container).fadeInRipple(x, y, config);
}

/** `MatRipple.fadeOutAll()` equivalent. */
export function fadeOutAllRipples(container: Element): void {
  getRippleRenderer(container).fadeOutAll();
}

/** `MatRipple.fadeOutAllNonPersistent()` equivalent. */
export function fadeOutAllNonPersistentRipples(container: Element): void {
  getRippleRenderer(container).fadeOutAllNonPersistent();
}

/**
 * Folds `animationsDisabled` into a `RippleAnimationConfig` the same way
 * upstream's `MatRipple.rippleConfig` getter does: `{...overrides,
 * ...(animationsDisabled ? {enterDuration: 0, exitDuration: 0} : {})}` —
 * i.e. the noop override always wins over a caller-supplied duration,
 * matching upstream's spread order exactly (`...this.animation` is spread
 * BEFORE the animations-disabled override in `MatRipple`, and
 * `MatRippleLoader._createRipple` computes `enterDuration`/`exitDuration`
 * with the SAME "animations disabled wins" precedence). Returns `undefined`
 * when there's nothing to override, so `fadeInRipple`'s own
 * `{...defaultRippleAnimationConfig, ...config.animation}` fallback applies
 * untouched.
 */
export function rippleAnimationConfig(
  animationsDisabled: boolean,
  overrides?: RippleAnimationConfig,
): RippleAnimationConfig | undefined {
  if (animationsDisabled) {
    return {enterDuration: 0, exitDuration: 0};
  }
  return overrides;
}
