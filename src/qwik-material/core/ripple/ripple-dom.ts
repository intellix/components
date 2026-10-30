import type {RippleAnimationConfig, RippleConfig} from './ripple-ref';
import {getRippleRenderer} from './ripple-registry';
import type {RippleTarget} from './ripple-renderer';

/**
 * The Qwik-facing half of this port — called from inside a component's own
 * `onMouseDown$`/`onTouchStart$` (or a shared hook's `useOn('mousedown', …)`/
 * `useOn('touchstart', …)`) handler, i.e. from inside a `$()` QRL.
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
 * Each helper below takes the CONTAINER element (the one ripples get
 * appended into — upstream's `_containerElement`, i.e. the `.mat-ripple`
 * span/div) and an explicit TRIGGER element (upstream's
 * `matRippleTrigger`/`_triggerElement` — the element the mousedown/
 * touchstart listener conceptually belongs to, whether or not it's the same
 * element as the container). The trigger is a required parameter rather
 * than read off `event.currentTarget`: a native DOM event's `currentTarget`
 * is only valid for the duration of synchronous dispatch and is reset to
 * `null` immediately afterwards, but qwikloader resolves and invokes a
 * `$()` handler's chunk via a (micro)task-deferred `import()` — by the time
 * the handler body runs, synchronous dispatch has already finished. Qwik's
 * own event-handler signature accounts for this by passing the element as
 * a SECOND argument (`EventHandler<EV, EL> = (event: EV, element: EL) =>
 * any`, independent of `currentTarget`) to every `onX$`/`useOn()` handler —
 * see e.g. `qwik-material/tabs/mat-tab-label.tsx`'s `onClick$ = $((_event,
 * element) => …)` for the established convention this follows.
 */

/** `target.rippleDisabled` is checked by the renderer itself, so a null/undefined/disabled
 *  container is simply a no-op call (mirrors every ripple-bearing component's own `[matRippleDisabled]`
 *  check already happening *inside* `RippleRenderer`, not at each call site). */
export function rippleOnMouseDown(
  event: MouseEvent,
  trigger: Element,
  container: Element | null | undefined,
  target: RippleTarget,
): void {
  if (!container) return;
  getRippleRenderer(container).handleMouseDown(event, trigger as HTMLElement, target);
}

export function rippleOnTouchStart(
  event: TouchEvent,
  trigger: Element,
  container: Element | null | undefined,
  target: RippleTarget,
): void {
  if (!container) return;
  getRippleRenderer(container).handleTouchStart(event, trigger as HTMLElement, target);
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
