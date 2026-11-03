import {$, useSignal, type QRL, type Signal} from '@qwik.dev/core';
import {useAnimationsDisabled} from '../../dialog/use-animations-disabled';
import type {HostProps} from '../host-props';
import {
  fadeOutAllNonPersistentRipples,
  fadeOutAllRipples,
  handleRippleEvent,
  launchRipple,
  rippleAnimationConfig,
} from './ripple-dom';
import type {RippleAnimationConfig, RippleConfig, RippleRef} from './ripple-ref';
import {useRippleGlobalOptions, type RippleGlobalOptions} from './ripple-global-options';

/**
 * Directive-hook form of upstream's `matRipple`/`[mat-ripple]`
 * (`src/material/core/ripple/ripple.ts`'s `MatRipple`) — see
 * `qwik-material/README.md` ("Composing directives") and `core/host-props.ts`
 * for the pattern this follows. Returns everything the real directive would
 * have contributed to the consumer's own host element; spread `hostProps`
 * onto whatever element should become the ripple container:
 *
 * ```tsx
 * const ripple = useMatRipple({centered, disabled, unbounded, radius, color});
 * return <div {...ripple.hostProps} class="example-ripple-container">Click me</div>;
 * ```
 *
 * `<MatRipple>` (`mat-ripple.tsx`) is a thin wrapper around this hook for the
 * common case of a ripple surface that doesn't need to be combined with
 * ANOTHER directive. Composing with a second directive needs
 * `mergeHostProps()`: `<MatButton {...mergeHostProps(trigger.hostProps, ripple.hostProps)}>`
 * — though in practice every built-in component (`MatButton`, `MatCheckbox`,
 * `MatTabGroup`, …) already renders its OWN internal ripple, so `useMatRipple()`
 * is for giving an ripple effect to an otherwise-plain element, exactly
 * upstream's own `ripple-overview` example (`matRipple` on a bare `<div>`).
 *
 * Unlike the *internal* per-component ripple loaders (`button/internal/
 * ripple-loader.ts` and friends), this hook has no lazy bootstrap/static-DOM
 * concern to replicate: upstream's `MatRipple` directive host IS the ripple
 * container from the very first render (`class="mat-ripple"`, no
 * placeholder span needed — `RippleRenderer.fadeInRipple` only ever creates
 * `.mat-ripple-element` children on demand, dynamically, same as it already
 * does for every ported internal consumer).
 *
 * **Why `launch$`/`fadeOutAll$`/`fadeOutAllNonPersistent$` are QRLs, not
 * plain functions** (unlike, say, a plain helper this module might export):
 * they're meant to be called later, from the CONSUMER's own `$()` event
 * handler (e.g. a button's `onClick$` triggering a ripple on a sibling
 * element) — a plain closure value captured into a DIFFERENT `$()`'s scope
 * does not survive SSR→resume (this project's documented pitfall; see
 * `core/SYNC.md`/this port's README). Wrapping them in `$()` here makes them
 * ordinary QRLs, which — like `useMatDialog().open$`/`close$` — DO survive
 * that trip, the same way any other cross-component imperative API in this
 * port is exposed.
 */
export interface UseMatRippleProps {
  /** Mirrors `[matRippleColor]`. Applied as each ripple element's own inline `background-color`. */
  color?: string;
  /** Mirrors `[matRippleUnbounded]`. Adds `.mat-ripple-unbounded` to the host. Default `false`. */
  unbounded?: boolean;
  /** Mirrors `[matRippleCentered]`. Default `false`. */
  centered?: boolean;
  /** Mirrors `[matRippleRadius]`. `0` (the default) means "distance to the furthest corner". */
  radius?: number;
  /** Mirrors `[matRippleAnimation]`. Wins over `MAT_RIPPLE_GLOBAL_OPTIONS.animation` and over the
   *  animations-disabled override — matches upstream's exact spread precedence. */
  animation?: RippleAnimationConfig;
  /** Mirrors `[matRippleDisabled]`. Default `false`. Ripples can still be launched manually via
   *  `launch$` even when `true` (and even when `MAT_RIPPLE_GLOBAL_OPTIONS.disabled` is set) — matches
   *  upstream's identical doc comment on `MatRipple.disabled`. */
  disabled?: boolean;
  /**
   * Mirrors `[matRippleTrigger]`: the element that listens for the pointer events that launch a
   * ripple, when it should be a DIFFERENT element than the ripple container itself (the one
   * `hostProps` is spread onto). Pass a `Signal` and spread the hook's `triggerProps` (not
   * `hostProps`'s own handlers — there are none once `trigger` is set) onto that other element;
   * the signal doubles as that element's own `ref`, so no separate `ref` prop is needed there.
   * Omit for the default (upstream's own default too): the host is its own trigger, and
   * `hostProps` alone carries both the container classes AND the pointer handlers.
   */
  trigger?: Signal<Element | undefined>;
}

export interface MatRippleHook {
  /** Spread onto the ripple container. Always carries `.mat-ripple`
   *  (+ `.mat-ripple-unbounded`) and a `ref` the hook needs internally; also carries the pointer
   *  handlers UNLESS a separate `trigger` was supplied (see `triggerProps`). */
  hostProps: HostProps;
  /** Only set when `trigger` was supplied: the pointer handlers to spread onto that OTHER
   *  element (which also becomes that element's own `ref` — see `UseMatRippleProps.trigger`).
   *  `undefined` when no separate trigger was requested (the handlers already live on
   *  `hostProps` in that case, so spreading `undefined` is always safe either way). */
  triggerProps?: HostProps;
  /**
   * Mirrors `MatRipple.launch()`'s two overloads:
   * `ripple.launch$(x, y, config?)` (viewport-relative coordinates) or
   * `ripple.launch$(config)` (uses the container's center). Always launches, even when disabled
   * — matches upstream.
   */
  launch$: QRL<(configOrX: number | RippleConfig, y?: number, config?: RippleConfig) => RippleRef>;
  /** Mirrors `MatRipple.fadeOutAll()`. */
  fadeOutAll$: QRL<() => void>;
  /** Mirrors `MatRipple.fadeOutAllNonPersistent()`. */
  fadeOutAllNonPersistent$: QRL<() => void>;
}

/**
 * Upstream's `MatRipple.rippleConfig` getter, folding in `MAT_RIPPLE_GLOBAL_OPTIONS` and the
 * animations-disabled override in upstream's exact spread order (see `ripple-dom.ts`'s
 * `handleRippleEvent` doc comment for the same chain, reused here via `rippleAnimationConfig()`).
 * A plain function (not a hook) — called fresh, every time, from inside the pointer-event
 * handler's and `launch$`'s own `$()` bodies, reading `props`/`globalOptions` LIVE at call time
 * (the same "read captured plain data fresh inside the closure body" pattern `use-mat-tooltip.ts`'s
 * `resolveConfig(props, defaults)` already establishes — both `props` and `globalOptions` are
 * plain, serializable objects, safe to close over directly).
 */
function resolveRippleConfig(
  props: UseMatRippleProps,
  globalOptions: RippleGlobalOptions,
  animationsDisabled: boolean,
): RippleConfig {
  return {
    centered: props.centered ?? false,
    radius: props.radius ?? 0,
    color: props.color,
    animation: {
      ...globalOptions.animation,
      ...rippleAnimationConfig(animationsDisabled, props.animation),
    },
    terminateOnPointerUp: globalOptions.terminateOnPointerUp,
  };
}

/** Upstream's `MatRipple.rippleDisabled` getter: `this.disabled || !!this._globalOptions.disabled`. */
function resolveRippleDisabled(
  props: UseMatRippleProps,
  globalOptions: RippleGlobalOptions,
): boolean {
  return !!props.disabled || !!globalOptions.disabled;
}

export function useMatRipple(props: UseMatRippleProps = {}): MatRippleHook {
  const globalOptions = useRippleGlobalOptions();
  const animationsDisabled = useAnimationsDisabled();
  const hostRef = useSignal<Element>();

  // ALL SIX pointer events share this ONE `$()` reference — required, not
  // just tidy; see `ripple-renderer.ts`'s module doc comment for why two
  // separate QRLs can't reliably order a single click's mousedown/mouseup
  // pair on a cold chunk.
  const handlePointerEvent$ = $((event: MouseEvent | TouchEvent) => {
    const container = hostRef.value;
    handleRippleEvent(event, container, {
      rippleDisabled: resolveRippleDisabled(props, globalOptions),
      rippleConfig: resolveRippleConfig(props, globalOptions, animationsDisabled.value),
    });
  });

  const launch$ = $(
    (configOrX: number | RippleConfig, y: number = 0, config?: RippleConfig): RippleRef => {
      const container = hostRef.value;
      if (!container) {
        throw new Error('useMatRipple(): launch$ called before the host element has mounted.');
      }
      const resolved = resolveRippleConfig(props, globalOptions, animationsDisabled.value);
      if (typeof configOrX === 'number') {
        return launchRipple(container, configOrX, y, {...resolved, ...config});
      }
      return launchRipple(container, 0, 0, {...resolved, ...configOrX});
    },
  );

  const fadeOutAll$ = $(() => {
    if (hostRef.value) fadeOutAllRipples(hostRef.value);
  });

  const fadeOutAllNonPersistent$ = $(() => {
    if (hostRef.value) fadeOutAllNonPersistentRipples(hostRef.value);
  });

  const pointerHandlers: HostProps = {
    onMouseDown$: handlePointerEvent$,
    onTouchStart$: handlePointerEvent$,
    onMouseUp$: handlePointerEvent$,
    onMouseLeave$: handlePointerEvent$,
    onTouchEnd$: handlePointerEvent$,
    onTouchCancel$: handlePointerEvent$,
  };

  const hostProps: HostProps = {
    ref: hostRef,
    class: ['mat-ripple', !!props.unbounded && 'mat-ripple-unbounded'],
    ...(props.trigger ? {} : pointerHandlers),
  };

  const triggerProps: HostProps | undefined = props.trigger
    ? {ref: props.trigger, ...pointerHandlers}
    : undefined;

  return {hostProps, triggerProps, launch$, fadeOutAll$, fadeOutAllNonPersistent$};
}
