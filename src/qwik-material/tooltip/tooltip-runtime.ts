/**
 * Module-level orchestration for `MatTooltip` (`mat-tooltip.tsx`), ported
 * from `MatTooltip.show()` / `hide()` / `_createOverlay()` / `_detach()`
 * (`src/material/tooltip/tooltip.ts`).
 *
 * Deliberately NOT closures inside `mat-tooltip.tsx`'s `component$` body:
 * every function here takes its state as explicit arguments (signals +
 * plain config) rather than capturing component-local consts, mirroring
 * `qwik-material/snack-bar/mat-snack-bar.tsx`'s `attachSnackBar` — Qwik's
 * optimizer can't reliably capture a plain (non-`$()`) local closure across
 * a `$()` boundary (see that file's module-level-helpers comment, and
 * `qwik-cdk/overlay/overlay-host.tsx`'s doc comment for the same family of
 * issue). `MatTooltip` has FIVE call sites that need this logic
 * (mouseenter, touchstart, the keyboard-focus task, Escape, outside-click) —
 * routing them all through these free functions avoids duplicating it five
 * times, and is call-site-safe regardless of which `$()` scope calls it.
 */
import {noSerialize, type NoSerialize, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createFlexibleConnectedPositionStrategy,
  createRepositionScrollStrategy,
  type FlexibleConnectedPositionStrategy,
  type OverlayEntry,
  type OverlayRef,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import {TooltipPanel} from './tooltip-panel';
import {
  buildTooltipPositions,
  resolvePanelPosition,
  type TooltipPosition,
} from './tooltip-position';

/** Mirrors upstream `SCROLL_THROTTLE_MS`. */
const SCROLL_THROTTLE_MS = 20;

/** Reactive state shared between `MatTooltip` and the lazily-created `TooltipPanel`. */
export interface TooltipRuntimeSignals {
  message: Signal<string>;
  isVisible: Signal<boolean>;
  everShown: Signal<boolean>;
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  positionClass: Signal<TooltipPosition | null>;
  showTimer: Signal<ReturnType<typeof setTimeout> | undefined>;
  hideTimer: Signal<ReturnType<typeof setTimeout> | undefined>;
}

export interface TooltipShowConfig {
  message: string;
  disabled: boolean;
  position: TooltipPosition;
  positionAtOrigin: boolean;
  showDelay: number;
  tooltipClassList: readonly string[];
  animationsDisabled: boolean;
  isLtr: boolean;
}

export interface TooltipHideConfig {
  hideDelay: number;
  animationsDisabled: boolean;
}

function makeIdGen(ctx: QwikCdkInternals) {
  return {
    getId(prefix: string): string {
      return `${prefix}${ctx.idCounter.value++}`;
    },
  };
}

function makeRegistry(ctx: QwikCdkInternals): OverlayRegistry {
  return {
    entries: ctx.entries,
    push: e => {
      ctx.overlayContainerCreated.value = true;
      ctx.entries.value = [...ctx.entries.value, e];
    },
    remove: id => {
      ctx.entries.value = ctx.entries.value.filter(x => x.id !== id);
    },
    get: id => ctx.entries.value.find((x: OverlayEntry) => x.id === id),
  };
}

/**
 * Polls (via `setTimeout` — NOT `requestAnimationFrame`, which
 * `scripts/lint-no-ssr-leaks.mjs` flags outside a `useVisibleTask$`) until
 * the overlay's host/pane DOM refs exist (`OverlayRef._onAttached` has run,
 * which also means its position strategy's `attach()` + first `apply()`
 * already happened — see `qwik-cdk/overlay/overlay-ref.ts`), then runs `fn`.
 * Needed because `OverlayHost`'s own `useVisibleTask$` (which calls
 * `_onAttached`) and this tooltip's creation code run in different Qwik
 * render passes with no guaranteed ordering between sibling visible tasks.
 */
function whenAttached(overlayRef: OverlayRef, fn: () => void, triesLeft = 30): void {
  if (!isBrowser) return;
  if (overlayRef.hasAttached()) {
    fn();
    return;
  }
  if (triesLeft <= 0) return;
  setTimeout(() => whenAttached(overlayRef, fn, triesLeft - 1), 4);
}

/**
 * Adds/removes `mat-mdc-tooltip-panel-{above,below,left,right}` based on the
 * strategy's last computed position. Verbatim-equivalent of
 * `MatTooltip._updateCurrentPositionClass`, split into the pure
 * `resolvePanelPosition` (tooltip-position.ts) plus this side-effecting
 * class add/remove.
 */
function syncPositionClass(
  overlayRef: OverlayRef,
  strategy: FlexibleConnectedPositionStrategy,
  positionClass: Signal<TooltipPosition | null>,
  isRtl: boolean,
): void {
  const change = strategy.getPositionChanges().value;
  if (!change) return;
  const next = resolvePanelPosition(change.connectionPair, isRtl);
  if (next === positionClass.value) return;
  if (positionClass.value) {
    overlayRef.removePanelClass(`mat-mdc-tooltip-panel-${positionClass.value}`);
  }
  overlayRef.addPanelClass(`mat-mdc-tooltip-panel-${next}`);
  positionClass.value = next;
}

function clearTimer(signal: Signal<ReturnType<typeof setTimeout> | undefined>): void {
  if (signal.value != null) {
    clearTimeout(signal.value);
    signal.value = undefined;
  }
}

/**
 * Fully removes the overlay: dispatcher cleanup + `detach()` + signal reset.
 * Called both from `hideTooltip`'s immediate-cancel branch (which has
 * `ctx`) and — via the no-`ctx` `finalizeHidden` below — from
 * `TooltipPanel` once its hide animation actually completes.
 */
function teardown(
  ctx: QwikCdkInternals,
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>,
): void {
  const ref = overlayRef.value;
  if (!ref) return;
  const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  keyboardDispatcher.remove(ref);
  outsideClickDispatcher.remove(ref);
  ref.detach();
  overlayRef.value = undefined;
}

/**
 * `TooltipPanel`-facing teardown: it doesn't carry `QwikCdkInternals`
 * (dispatcher removal there is a cheap optimization, not a correctness
 * requirement — `eventPredicate`/`isVisible` already gate stale dispatcher
 * entries into no-ops, see tooltip-position.ts's doc comments), so it just
 * detaches the overlay and clears the shared `overlayRef` signal — the
 * piece that's load-bearing for `showTooltip`'s "something is already
 * open" guard above.
 */
export function finalizeHidden(overlayRef: Signal<NoSerialize<OverlayRef> | undefined>): void {
  const ref = overlayRef.value;
  if (!ref) return;
  ref.detach();
  overlayRef.value = undefined;
}

/**
 * Mirrors `MatTooltip.show(delay, origin)` + `_createOverlay()`.
 *
 * Simplification vs. upstream (documented in SYNC.md): upstream reuses the
 * SAME `OverlayRef`/pane across repeated shows of the same trigger (as long
 * as `positionAtOrigin` isn't forcing a fresh one) so that `cdk-overlay-N`'s
 * id persists. This port always creates a fresh overlay once nothing is
 * currently open/opening — the parity harness normalizes every `id`
 * attribute's digits away, so a new id each time is DOM-invisible, and the
 * simplification sidesteps qwik-cdk's `OverlayRef` not supporting
 * re-attaching a previously detached ref (see `overlay-ref.ts`).
 */
export function showTooltip(
  ctx: QwikCdkInternals,
  signals: TooltipRuntimeSignals,
  config: TooltipShowConfig,
  trigger: HTMLElement,
  originPoint: {x: number; y: number} | undefined,
): void {
  if (!isBrowser) return;
  if (config.disabled || !config.message) return;

  if (signals.overlayRef.value) {
    // Something is already open or opening for this trigger.
    if (signals.isVisible.value) {
      clearTimer(signals.hideTimer);
    }
    return;
  }

  clearTimer(signals.showTimer);
  clearTimer(signals.hideTimer);

  const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  const idGen = makeIdGen(ctx);
  const registry = makeRegistry(ctx);
  const overlay = createOverlayService(registry, idGen);

  const origin = config.positionAtOrigin && originPoint ? originPoint : trigger;
  const strategy = createFlexibleConnectedPositionStrategy(origin)
    .withTransformOriginOn('.mat-mdc-tooltip')
    .withFlexibleDimensions(false)
    .withViewportMargin(8)
    .withPopoverLocation('global');
  strategy.withPositions(buildTooltipPositions(config.position, config.isLtr));

  signals.message.value = config.message;
  signals.isVisible.value = false;
  // Fresh pane, no classes applied yet — reset regardless of how the
  // previous overlay (if any) went away, otherwise `syncPositionClass`'s
  // "already applied" check below could skip re-adding a class the NEW
  // pane doesn't actually have yet (e.g. two consecutive 'below' shows).
  signals.positionClass.value = null;

  const overlayRef = overlay.create(
    TooltipPanel,
    {
      message: signals.message,
      tooltipClassList: config.tooltipClassList,
      isVisible: signals.isVisible,
      everShown: signals.everShown,
      triggerElement: trigger,
      mouseLeaveHideDelay: 0,
      animationsDisabled: config.animationsDisabled,
      overlayRef: signals.overlayRef,
    },
    {
      direction: config.isLtr ? 'ltr' : 'rtl',
      positionStrategy: strategy,
      panelClass: 'mat-mdc-tooltip-panel',
      scrollStrategy: createRepositionScrollStrategy({scrollThrottle: SCROLL_THROTTLE_MS}),
      disableAnimations: config.animationsDisabled,
      eventPredicate: (event: Event) => {
        if (event.type === 'keydown') {
          const e = event as KeyboardEvent;
          return (
            signals.isVisible.value &&
            e.key === 'Escape' &&
            !(e.shiftKey || e.ctrlKey || e.altKey || e.metaKey)
          );
        }
        return true;
      },
    },
  );

  signals.overlayRef.value = noSerialize(overlayRef);

  keyboardDispatcher.add(overlayRef, {
    onKeydown(e) {
      e.preventDefault();
      e.stopPropagation();
      hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: config.animationsDisabled});
    },
  });

  outsideClickDispatcher.add(overlayRef, {
    onOutsideClick() {
      hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: config.animationsDisabled});
    },
  });

  whenAttached(overlayRef, () => {
    syncPositionClass(overlayRef, strategy, signals.positionClass, !config.isLtr);
  });

  signals.showTimer.value = setTimeout(() => {
    signals.showTimer.value = undefined;
    signals.isVisible.value = true;
    signals.everShown.value = true;
  }, config.showDelay);
}

/** Mirrors `MatTooltip.hide(delay)` + `TooltipComponent.hide(delay)`. */
export function hideTooltip(
  ctx: QwikCdkInternals,
  signals: TooltipRuntimeSignals,
  config: TooltipHideConfig,
): void {
  if (!isBrowser) return;
  if (!signals.overlayRef.value) return;

  clearTimer(signals.showTimer);

  if (!signals.isVisible.value) {
    // Never finished showing (still in the showDelay window, or already
    // mid-hide) — mirrors upstream's `_cancelPendingAnimations()` +
    // immediate `_detach()` branch (no animation ever ran, nothing to wait
    // out).
    clearTimer(signals.hideTimer);
    teardown(ctx, signals.overlayRef);
    return;
  }

  clearTimer(signals.hideTimer);
  signals.hideTimer.value = setTimeout(() => {
    signals.hideTimer.value = undefined;
    signals.isVisible.value = false;
    // TooltipPanel's own task (tooltip-panel.tsx) finishes the teardown
    // (`overlayRef.detach()`) once the real hide animation completes, or
    // immediately if `config.animationsDisabled`. qwik-cdk's `detach()`
    // only removes the registry entry + dispatcher wiring (see `teardown`
    // above) — it doesn't itself unregister the dispatchers, so do that
    // here once we know the panel has (or will) detach.
    if (signals.overlayRef.value) {
      const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
      keyboardDispatcher.remove(signals.overlayRef.value);
      outsideClickDispatcher.remove(signals.overlayRef.value);
    }
  }, config.hideDelay);
}

/** Recomputes + re-applies the position strategy for an already-open tooltip. */
export function repositionTooltip(signals: TooltipRuntimeSignals): void {
  if (!isBrowser) return;
  signals.overlayRef.value?.updatePosition();
}
