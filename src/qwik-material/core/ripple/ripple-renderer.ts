import {RippleRef, RippleState, type RippleConfig} from './ripple-ref';

/**
 * Qwik port of `src/material/core/ripple/ripple-renderer.ts`'s
 * `RippleRenderer` class. Framework-free DOM manipulation, same as upstream
 * (Angular's own `RippleRenderer` is already plain DOM code wrapped in a
 * thin Angular-lifecycle shell) — the parts removed here are exactly the
 * Angular-lifecycle shell, not any of the actual ripple logic:
 *
 * - No `NgZone`/`runOutsideAngular` — Qwik has no zone to escape.
 * - No `Platform.isBrowser` guard — this class is only ever instantiated
 *   from inside a real pointer/touch event handler, which only fires in a
 *   browser; there is no server-side "construct but do nothing" case to
 *   guard against the way Angular's eagerly-constructed directive has.
 * - No `_CdkPrivateStyleLoader`/`_MatRippleStylesLoader` — this port's
 *   ripple CSS (`scss/core/ripple/ripple-structure.scss`) is unconditionally
 *   part of `core-prebuilt.css` already (see `core/SYNC.md`), not lazily
 *   injected per-app the way Angular's own style loader works.
 * - No `RippleEventManager`/document-level delegated `mousedown`/`touchstart`
 *   listener — Qwik's own `useOn()`/JSX event props already delegate through
 *   exactly one document-level listener per event type via qwikloader (see
 *   `ripple-dom.ts`'s module doc comment), so porting a second delegation
 *   layer on top would just duplicate work Qwik already does.
 * - No on-demand `trigger.addEventListener('mouseup'/…)` registration
 *   performed *from inside* `handleMouseDown`/`handleTouchStart` (upstream's
 *   `handleEvent` does this, "on-demand… to reduce the total number of
 *   event listeners"). A Qwik-specific race rules this out: `handleMouseDown`
 *   only runs once its own `$()` chunk has finished loading — a REAL async
 *   gap on a cold chunk — and a fast native mouseup can fire and vanish
 *   before that resolves, which would register the pointer-up listener too
 *   late to ever see it (confirmed live: every FIRST click on a fresh page
 *   left the ripple stuck in `VISIBLE` forever — `_isPointerDown` never got
 *   reset — since nothing else would ever call `handlePointerUp()` for that
 *   element again). Qwik's own event props don't have this problem FOR THE
 *   EVENT ITSELF (qwikloader's single document-level listener per event type
 *   is already eagerly installed, independent of any one handler's chunk),
 *   so `handlePointerUp()` below is instead called directly by every
 *   ripple-bearing component's own declarative `onMouseUp$`/`onMouseLeave$`/
 *   `onTouchEnd$`/`onTouchCancel$` props — see `ripple-dom.ts`'s
 *   `handleRippleEvent()`, which every caller wires to ALL SIX pointer
 *   events (down/up/leave/start/end/cancel) through the exact SAME `$()`
 *   reference. That last part matters for a second, more subtle reason
 *   beyond just "the event is seen at all": using one shared QRL for every
 *   related event (rather than one QRL per event type) means mousedown's
 *   and mouseup's own handler BODIES, even on a cold chunk, resolve the
 *   identical cached import promise and so run their callbacks in the same
 *   relative order the native events fired in (ordinary same-promise
 *   `.then()` FIFO semantics) — two SEPARATE QRLs have no such guarantee
 *   (a known project-wide hazard: Qwik QRL invocations can resume out of
 *   order while their chunks load, e.g. button-toggle's rapid-click
 *   findings — see the workflow notes this port follows).
 * - `RippleTarget`'s `rippleConfig`/`rippleDisabled` are passed as a plain
 *   argument to `handleMouseDown`/`handleTouchStart` rather than stored as a
 *   constructor-injected field: upstream's `_target` is the long-lived
 *   directive instance itself (reading `_target.rippleDisabled` later always
 *   sees the current value because the SAME object is consulted every time).
 *   This port's per-container `RippleRenderer` is a longer-lived cache-by-
 *   DOM-element (see `ripple-registry.ts`), but the *props* driving
 *   `rippleConfig`/`rippleDisabled` are themselves normal Qwik component
 *   props/signals read live inside a `$()` handler on every event — passing
 *   a freshly-built `RippleTarget` into each call keeps that liveness
 *   instead of freezing it into a stale snapshot taken once at construction.
 *
 * Everything else — `fadeInRipple`'s DOM/geometry/style math, the
 * `transitionend`/`transitioncancel` lifecycle, the fallback timer, fade-out
 * state transitions, screen-reader fake-event filtering, and the
 * on-demand pointer-up listener registration — is a 1:1 port.
 */

/** Interfaces the defines ripple element transition event listeners. */
interface RippleEventListeners {
  onTransitionEnd: EventListener;
  onTransitionCancel: EventListener;
  fallbackTimer: ReturnType<typeof setTimeout> | null;
}

/**
 * Default ripple animation configuration for ripples without an explicit
 * animation config specified.
 */
export const defaultRippleAnimationConfig = {
  enterDuration: 225,
  exitDuration: 150,
};

/**
 * Timeout for ignoring mouse events. Mouse events will be temporary ignored after touch
 * events to avoid synthetic mouse events.
 */
const ignoreMouseEventsTimeout = 800;

/**
 * Qwik-native inline of upstream's `isFakeMousedownFromScreenReader`
 * (`src/cdk/a11y/fake-event-detection.ts`) — same convention
 * `qwik-cdk/a11y`'s own `input-modality-detector.ts` already follows for
 * this exact helper (see that package's SYNC.md: "Inlined
 * isFakeMousedownFromScreenReader and isFakeTouchstartFromScreenReader — no
 * CDK import").
 */
function isFakeMousedownFromScreenReader(event: MouseEvent): boolean {
  return event.buttons === 0 || event.detail === 0;
}

/** Qwik-native inline of upstream's `isFakeTouchstartFromScreenReader`. */
function isFakeTouchstartFromScreenReader(event: TouchEvent): boolean {
  const touch: Touch | undefined =
    (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
  return (
    !!touch &&
    touch.identifier === -1 &&
    (touch.radiusX == null || touch.radiusX === 1) &&
    (touch.radiusY == null || touch.radiusY === 1)
  );
}

/**
 * Interface that describes the target for launching ripples.
 * It defines the ripple configuration and disabled state for interaction ripples.
 * @docs-private
 */
export interface RippleTarget {
  /** Configuration for ripples that are launched on pointer down. */
  rippleConfig: RippleConfig;
  /** Whether ripples on pointer down should be disabled. */
  rippleDisabled: boolean;
}

/**
 * Helper that performs DOM manipulations for one ripple container element.
 * One instance is cached per container (`ripple-registry.ts`) — see this
 * file's module doc comment for how that replaces upstream's
 * one-instance-per-directive lifetime.
 */
export class RippleRenderer {
  /** Whether the pointer is currently down or not. */
  private _isPointerDown = false;

  /**
   * Map of currently active ripple references.
   * The ripple reference is mapped to its element event listeners.
   * The reason why `| null` is used is that event listeners are added only
   * when the condition is truthy (see the `_startFadeOutTransition` method).
   */
  private _activeRipples = new Map<RippleRef, RippleEventListeners | null>();

  /** Latest non-persistent ripple that was triggered. */
  private _mostRecentTransientRipple: RippleRef | null = null;

  /** Time in milliseconds when the last touchstart event happened. */
  private _lastTouchStartEvent = 0;

  /**
   * Cached dimensions of the ripple container. Set when the first
   * ripple is shown and cleared once no more ripples are visible.
   */
  private _containerRect: DOMRect | null = null;

  constructor(private _containerElement: HTMLElement) {}

  /**
   * Fades in a ripple at the given coordinates.
   * @param x Coordinate within the element, along the X axis at which to start the ripple.
   * @param y Coordinate within the element, along the Y axis at which to start the ripple.
   * @param config Extra ripple options.
   */
  fadeInRipple(x: number, y: number, config: RippleConfig = {}): RippleRef {
    const containerRect = (this._containerRect =
      this._containerRect || this._containerElement.getBoundingClientRect());
    const animationConfig = {...defaultRippleAnimationConfig, ...config.animation};

    if (config.centered) {
      x = containerRect.left + containerRect.width / 2;
      y = containerRect.top + containerRect.height / 2;
    }

    const radius = config.radius || distanceToFurthestCorner(x, y, containerRect);
    const offsetX = x - containerRect.left;
    const offsetY = y - containerRect.top;
    const enterDuration = animationConfig.enterDuration;

    // fadeInRipple only ever runs from a real pointer/touch event handler
    // (handleMouseDown/handleTouchStart, both invoked from a client-only
    // $() callback) or a direct launchRipple() call from one — never during
    // SSR render, which only produces JSX and never dispatches DOM events
    // or calls into this module.
    // ssr-leak-ok: see comment above
    const ripple = document.createElement('div');
    ripple.classList.add('mat-ripple-element');

    ripple.style.left = `${offsetX - radius}px`;
    ripple.style.top = `${offsetY - radius}px`;
    ripple.style.height = `${radius * 2}px`;
    ripple.style.width = `${radius * 2}px`;

    // If a custom color has been specified, set it as inline style. If no color is
    // set, the default color will be applied through the ripple theme styles.
    if (config.color != null) {
      ripple.style.backgroundColor = config.color;
    }

    ripple.style.transitionDuration = `${enterDuration}ms`;

    this._containerElement.appendChild(ripple);

    // By default the browser does not recalculate the styles of dynamically created
    // ripple elements. This is critical to ensure that the `scale` animates properly.
    // We enforce a style recalculation by calling `getComputedStyle` and *accessing* a property.
    // See: https://gist.github.com/paulirish/5d52fb081b3570c81e3a
    // ssr-leak-ok: same client-only call path as the `document.createElement` above.
    const computedStyles = window.getComputedStyle(ripple);
    const userTransitionProperty = computedStyles.transitionProperty;
    const userTransitionDuration = computedStyles.transitionDuration;

    // Note: We detect whether animation is forcibly disabled through CSS (e.g. through
    // `transition: none` or `display: none`). This is technically unexpected since animations are
    // controlled through the animation config, but this exists for backwards compatibility. This
    // logic does not need to be super accurate since it covers some edge cases which can be easily
    // avoided by users.
    const animationForciblyDisabledThroughCss =
      userTransitionProperty === 'none' ||
      // Note: The canonical unit for serialized CSS `<time>` properties is seconds. Additionally
      // some browsers expand the duration for every property (in our case `opacity` and `transform`).
      userTransitionDuration === '0s' ||
      userTransitionDuration === '0s, 0s' ||
      // If the container is 0x0, it's likely `display: none`.
      (containerRect.width === 0 && containerRect.height === 0);

    // Exposed reference to the ripple that will be returned.
    const rippleRef = new RippleRef(this, ripple, config, animationForciblyDisabledThroughCss);

    // Start the enter animation by setting the transform/scale to 100%. The animation will
    // execute as part of this statement because we forced a style recalculation before.
    // Note: We use a 3d transform here in order to avoid an issue in Safari where
    // the ripples aren't clipped when inside the shadow DOM (see #24028).
    ripple.style.transform = 'scale3d(1, 1, 1)';

    rippleRef.state = RippleState.FADING_IN;

    if (!config.persistent) {
      this._mostRecentTransientRipple = rippleRef;
    }

    let eventListeners: RippleEventListeners | null = null;

    // Do not register the `transition` event listener if fade-in and fade-out duration
    // are set to zero. The events won't fire anyway and we can save resources here.
    if (!animationForciblyDisabledThroughCss && (enterDuration || animationConfig.exitDuration)) {
      const onTransitionEnd = () => {
        // Clear the fallback timer since the transition fired correctly.
        if (eventListeners) {
          eventListeners.fallbackTimer = null;
        }
        clearTimeout(fallbackTimer);
        this._finishRippleTransition(rippleRef);
      };
      const onTransitionCancel = () => this._destroyRipple(rippleRef);

      // In some cases where there's a higher load on the browser, it can choose not to dispatch
      // neither `transitionend` nor `transitioncancel`. This timer serves as a fallback for
      // such cases so that the ripple doesn't become stuck. We add a 100ms buffer because timers
      // aren't precise.
      const fallbackTimer = setTimeout(onTransitionCancel, enterDuration + 100);

      ripple.addEventListener('transitionend', onTransitionEnd);
      // If the transition is cancelled (e.g. due to DOM removal), we destroy the ripple
      // directly as otherwise we would keep it part of the ripple container forever.
      ripple.addEventListener('transitioncancel', onTransitionCancel);
      eventListeners = {onTransitionEnd, onTransitionCancel, fallbackTimer};
    }

    // Add the ripple reference to the list of all active ripples.
    this._activeRipples.set(rippleRef, eventListeners);

    // In case there is no fade-in transition duration, we need to manually call the transition
    // end listener because `transitionend` doesn't fire if there is no transition.
    if (animationForciblyDisabledThroughCss || !enterDuration) {
      this._finishRippleTransition(rippleRef);
    }

    return rippleRef;
  }

  /** Fades out a ripple reference. */
  fadeOutRipple(rippleRef: RippleRef): void {
    // For ripples already fading out or hidden, this should be a noop.
    if (rippleRef.state === RippleState.FADING_OUT || rippleRef.state === RippleState.HIDDEN) {
      return;
    }

    const rippleEl = rippleRef.element;
    const animationConfig = {...defaultRippleAnimationConfig, ...rippleRef.config.animation};

    // This starts the fade-out transition and will fire the transition end listener that
    // removes the ripple element from the DOM.
    rippleEl.style.transitionDuration = `${animationConfig.exitDuration}ms`;
    rippleEl.style.opacity = '0';
    rippleRef.state = RippleState.FADING_OUT;

    // In case there is no fade-out transition duration, we need to manually call the
    // transition end listener because `transitionend` doesn't fire if there is no transition.
    if (rippleRef._animationForciblyDisabledThroughCss || !animationConfig.exitDuration) {
      this._finishRippleTransition(rippleRef);
    }
  }

  /** Fades out all currently active ripples. */
  fadeOutAll(): void {
    this._getActiveRipples().forEach(ripple => ripple.fadeOut());
  }

  /** Fades out all currently active non-persistent ripples. */
  fadeOutAllNonPersistent(): void {
    this._getActiveRipples().forEach(ripple => {
      if (!ripple.config.persistent) {
        ripple.fadeOut();
      }
    });
  }

  /**
   * Handles a `mousedown` on the trigger element — mirrors upstream's
   * `_onMousedown`. `target` is read fresh on every call (see this file's
   * module doc comment for why, unlike upstream, it's a parameter rather
   * than a stored field).
   */
  handleMouseDown(event: MouseEvent, target: RippleTarget): void {
    // Screen readers will fire fake mouse events for space/enter. Skip launching a
    // ripple in this case for consistency with the non-screen-reader experience.
    const isFakeMousedown = isFakeMousedownFromScreenReader(event);
    const isSyntheticEvent =
      this._lastTouchStartEvent &&
      Date.now() < this._lastTouchStartEvent + ignoreMouseEventsTimeout;

    if (!target.rippleDisabled && !isFakeMousedown && !isSyntheticEvent) {
      this._isPointerDown = true;
      this.fadeInRipple(event.clientX, event.clientY, target.rippleConfig);
    }
  }

  /** Handles a `touchstart` on the trigger element — mirrors upstream's `_onTouchStart`. */
  handleTouchStart(event: TouchEvent, target: RippleTarget): void {
    if (!target.rippleDisabled && !isFakeTouchstartFromScreenReader(event)) {
      // Some browsers fire mouse events after a `touchstart` event. Those synthetic mouse
      // events will launch a second ripple if we don't ignore mouse events for a specific
      // time after a touchstart event.
      this._lastTouchStartEvent = Date.now();
      this._isPointerDown = true;

      // Use `changedTouches` so we skip any touches where the user put
      // their finger down, but used another finger to tap the element again.
      const touches = event.changedTouches as TouchList | undefined;

      if (touches) {
        for (let i = 0; i < touches.length; i++) {
          this.fadeInRipple(touches[i].clientX, touches[i].clientY, target.rippleConfig);
        }
      }
    }
  }

  /**
   * Handles a `mouseup`/`mouseleave`/`touchend`/`touchcancel` on the
   * trigger element — mirrors upstream's `_onPointerUp`, called directly by
   * every caller's own declarative pointer-up event props rather than
   * through an on-demand-registered listener (see this file's module doc
   * comment for why).
   */
  handlePointerUp(): void {
    if (!this._isPointerDown) {
      return;
    }

    this._isPointerDown = false;

    // Fade-out all ripples that are visible and not persistent.
    this._getActiveRipples().forEach(ripple => {
      // By default, only ripples that are completely visible will fade out on pointer release.
      // If the `terminateOnPointerUp` option is set, ripples that still fade in will also fade out.
      const isVisible =
        ripple.state === RippleState.VISIBLE ||
        (ripple.config.terminateOnPointerUp && ripple.state === RippleState.FADING_IN);

      if (!ripple.config.persistent && isVisible) {
        ripple.fadeOut();
      }
    });
  }

  /** Method that will be called if the fade-in or fade-in transition completed. */
  private _finishRippleTransition(rippleRef: RippleRef): void {
    if (rippleRef.state === RippleState.FADING_IN) {
      this._startFadeOutTransition(rippleRef);
    } else if (rippleRef.state === RippleState.FADING_OUT) {
      this._destroyRipple(rippleRef);
    }
  }

  /**
   * Starts the fade-out transition of the given ripple if it's not persistent and the pointer
   * is not held down anymore.
   */
  private _startFadeOutTransition(rippleRef: RippleRef): void {
    const isMostRecentTransientRipple = rippleRef === this._mostRecentTransientRipple;
    const {persistent} = rippleRef.config;

    rippleRef.state = RippleState.VISIBLE;

    // When the timer runs out while the user has kept their pointer down, we want to
    // keep only the persistent ripples and the latest transient ripple. We do this,
    // because we don't want stacked transient ripples to appear after their enter
    // animation has finished.
    if (!persistent && (!isMostRecentTransientRipple || !this._isPointerDown)) {
      rippleRef.fadeOut();
    }
  }

  /** Destroys the given ripple by removing it from the DOM and updating its state. */
  private _destroyRipple(rippleRef: RippleRef): void {
    const eventListeners = this._activeRipples.get(rippleRef) ?? null;
    this._activeRipples.delete(rippleRef);

    // Clear out the cached bounding rect if we have no more ripples.
    if (!this._activeRipples.size) {
      this._containerRect = null;
    }

    // If the current ref is the most recent transient ripple, unset it
    // avoid memory leaks.
    if (rippleRef === this._mostRecentTransientRipple) {
      this._mostRecentTransientRipple = null;
    }

    rippleRef.state = RippleState.HIDDEN;
    if (eventListeners !== null) {
      rippleRef.element.removeEventListener('transitionend', eventListeners.onTransitionEnd);
      rippleRef.element.removeEventListener('transitioncancel', eventListeners.onTransitionCancel);
      if (eventListeners.fallbackTimer !== null) {
        clearTimeout(eventListeners.fallbackTimer);
      }
    }
    rippleRef.element.remove();
  }

  private _getActiveRipples(): RippleRef[] {
    return Array.from(this._activeRipples.keys());
  }
}

/**
 * Returns the distance from the point (x, y) to the furthest corner of a rectangle.
 */
function distanceToFurthestCorner(x: number, y: number, rect: DOMRect): number {
  const distX = Math.max(Math.abs(x - rect.left), Math.abs(x - rect.right));
  const distY = Math.max(Math.abs(y - rect.top), Math.abs(y - rect.bottom));
  return Math.sqrt(distX * distX + distY * distY);
}
