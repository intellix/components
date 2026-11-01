import {$, useContext, useSignal, useTask$, type NoSerialize} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {
  createIdGenerator,
  wasRecentKeydown,
  consumeRecentKeydown,
  type FocusOrigin,
} from '@angular-community/qwik-cdk/a11y';
import type {HostProps} from '../core/host-props';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY,
  type MatTooltipDefaultOptions,
} from './mat-tooltip-tokens';
import type {TooltipPosition, TooltipTouchGestures} from './tooltip-position';
import {
  hideTooltip,
  repositionTooltip,
  showTooltip,
  type TooltipRuntimeSignals,
} from './tooltip-runtime';

/**
 * Directive-hook form of upstream's `[matTooltip]` (`src/material/tooltip/
 * tooltip.ts`'s `MatTooltip`) — see `qwik-material/README.md` ("Composing
 * directives") and `core/host-props.ts` for the pattern. Returns everything
 * the real directive would have contributed to the consumer's own host
 * element; spread `hostProps` onto whatever element should become the
 * trigger:
 *
 * ```tsx
 * const tip = useMatTooltip({message: 'Info about the action'});
 * return <MatButton appearance="elevated" {...tip.hostProps}>Action</MatButton>;
 * ```
 *
 * `<MatTooltip>` (`mat-tooltip.tsx`) is now a thin wrapper around this hook
 * for the common case of a tooltip trigger that doesn't need to be combined
 * with ANOTHER directive. Composing with a SECOND directive needs
 * `mergeHostProps()`: `<MatButton {...mergeHostProps(trigger.hostProps,
 * tip.hostProps)}>`.
 *
 * **Why this hook does NOT use `useOn()`/`useFocusOrigin()` internally**
 * (unlike every OTHER host-owning component in this port, e.g. `MatButton`):
 * `useOn()` attaches a listener to "the CURRENT component's own host
 * element" — fine for `MatButton`, which owns its host directly, but wrong
 * for a hook meant to be called from a THIRD-PARTY consumer and spread onto
 * a DIFFERENT host component (`<MatButton {...tip.hostProps}>`); which
 * element Qwik resolves as "the calling component's host" when that
 * component's own JSX root is ANOTHER component (not a plain tag) isn't
 * something this port verified conclusively enough to depend on silently.
 * Plain JSX handler props (`onPointerDown$`/`onFocusIn$`/`onFocusOut$`
 * below), by contrast, are unambiguous: Qwik threads them through exactly
 * like `class`/`onClick$`, regardless of how many component layers
 * intervene — the same contract `mergeHostProps()`/`HostProps` already
 * relies on. So the keyboard-vs-pointer focus-origin heuristic is
 * reproduced here directly (reusing the plain, non-`useOn()` pieces
 * `useFocusOrigin()` itself is built from — `wasRecentKeydown()`/
 * `consumeRecentKeydown()`, `@angular-community/qwik-cdk/a11y`) instead of
 * calling `useFocusOrigin()`. Kept deliberately identical to
 * `focus-origin.ts`'s own algorithm (pointerdown records mouse/touch,
 * focusin resolves keyboard via a real-recent-keydown flag else the
 * pointer modality else `'program'`, focusout clears) — the `:focus-
 * visible`-vs-real-keydown distinction that algorithm exists for is exactly
 * what this hook's own `message-change` scenario (ported from
 * `MatTooltip`'s original implementation) depends on. NOT reproduced here:
 * `focusVia()`'s pending-origin-attribute override — that's needed by
 * `MatAccordion`/`MatExpansionPanelHeader` forcing a `'program'` origin,
 * never by a tooltip trigger; add it if a future scenario needs it.
 */
export interface UseMatTooltipProps {
  /** The message to show in the tooltip. Mirrors `[matTooltip]`. Falsy/whitespace-only hides. */
  message?: string | number | null;
  /** Mirrors `[matTooltipPosition]`. Default `'below'` (or the provider's `matTooltipDefaults.position`). */
  position?: TooltipPosition;
  /** Mirrors `[matTooltipPositionAtOrigin]`. */
  positionAtOrigin?: boolean;
  /** Mirrors `[matTooltipDisabled]`. Hides immediately when toggled true. */
  disabled?: boolean;
  /** Mirrors `[matTooltipShowDelay]`, in ms. */
  showDelay?: number;
  /** Mirrors `[matTooltipHideDelay]`, in ms. */
  hideDelay?: number;
  /** Mirrors `[matTooltipTouchGestures]`. See `mat-tooltip.tsx`'s prop doc for the same caveat. */
  touchGestures?: TooltipTouchGestures;
  /** Mirrors `[matTooltipClass]`. Supports the same shapes as Angular's `ngClass` (minus `Set`). */
  tooltipClass?: string | readonly string[] | Readonly<Record<string, boolean>>;
}

export interface MatTooltipHook {
  /** Spread onto the tooltip trigger's host element. */
  hostProps: HostProps;
}

/** Mirrors `set message()`'s `String(value).trim()` coercion. */
function normalizeMessage(value: UseMatTooltipProps['message']): string {
  return value == null ? '' : String(value).trim();
}

interface ResolvedTooltipConfig {
  message: string;
  disabled: boolean;
  position: TooltipPosition;
  positionAtOrigin: boolean;
  showDelay: number;
  hideDelay: number;
  touchGestures: TooltipTouchGestures;
  touchendHideDelay: number;
  touchLongPressShowDelay: number;
  tooltipClassList: string[];
  detectHoverCapability: boolean | (() => boolean) | undefined;
}

/** See `mat-tooltip.tsx`'s identical helper doc comment. */
function resolveTooltipClass(value: UseMatTooltipProps['tooltipClass']): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  if (Array.isArray(value)) return (value as string[]).filter(Boolean);
  return Object.keys(value).filter(key => !!(value as Record<string, boolean>)[key]);
}

/** Merges `props` with the provider's `MAT_TOOLTIP_DEFAULT_OPTIONS` and upstream's hardcoded defaults. */
function resolveConfig(
  props: UseMatTooltipProps,
  defaults: MatTooltipDefaultOptions,
): ResolvedTooltipConfig {
  return {
    message: normalizeMessage(props.message),
    disabled: props.disabled ?? false,
    position: props.position ?? defaults.position ?? 'below',
    positionAtOrigin: props.positionAtOrigin ?? defaults.positionAtOrigin ?? false,
    showDelay:
      props.showDelay ?? defaults.showDelay ?? MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY.showDelay,
    hideDelay:
      props.hideDelay ?? defaults.hideDelay ?? MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY.hideDelay,
    touchGestures:
      props.touchGestures ??
      defaults.touchGestures ??
      MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY.touchGestures,
    touchendHideDelay:
      defaults.touchendHideDelay ?? MAT_TOOLTIP_DEFAULT_OPTIONS_FACTORY.touchendHideDelay,
    touchLongPressShowDelay: defaults.touchLongPressShowDelay ?? 500,
    tooltipClassList: resolveTooltipClass(props.tooltipClass ?? defaults.tooltipClass),
    detectHoverCapability: defaults.detectHoverCapability,
  };
}

/** See `mat-tooltip.tsx`'s identical helper doc comment. */
function isTouchPlatform(cfg: ResolvedTooltipConfig): boolean {
  if (typeof cfg.detectHoverCapability === 'function') {
    return !cfg.detectHoverCapability();
  }
  if (!isBrowser) return false;
  if (!cfg.detectHoverCapability) return false;
  return typeof matchMedia === 'function' && matchMedia('(any-hover: none)').matches;
}

/** Shared monotonic id generator for the `aria-describedby` reference — see `mat-tooltip.tsx`'s identical note. */
const describedByIdGen = createIdGenerator();

export function useMatTooltip(props: UseMatTooltipProps): MatTooltipHook {
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_TOOLTIP_DEFAULT_OPTIONS, {});
  const animationsDisabled = useAnimationsDisabled();

  const cfg = resolveConfig(props, defaults);

  const hostRef = useSignal<HTMLElement>();
  const signals: TooltipRuntimeSignals = {
    message: useSignal(cfg.message),
    isVisible: useSignal(false),
    everShown: useSignal(false),
    overlayRef: useSignal<NoSerialize<OverlayRef>>(),
    positionClass: useSignal<TooltipPosition | null>(null),
    showTimer: useSignal<ReturnType<typeof setTimeout>>(),
    hideTimer: useSignal<ReturnType<typeof setTimeout>>(),
  };
  const touchTimer = useSignal<ReturnType<typeof setTimeout>>();
  const focusOrigin = useSignal<FocusOrigin>(null);
  const lastPointerModality = useSignal<'mouse' | 'touch' | null>(null);

  // Keep the (possibly already-open) panel's message in sync, and mirror
  // upstream's `set message()`: an emptied message hides immediately,
  // otherwise the overlay repositions once the new text has painted
  // (upstream: `afterNextRender`).
  useTask$(({track}) => {
    const next = track(() => normalizeMessage(props.message));
    signals.message.value = next;
    if (!isBrowser) return;
    if (!next) {
      hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
    } else if (signals.overlayRef.value) {
      setTimeout(() => repositionTooltip(signals), 0);
    }
  });

  // Mirrors upstream `set disabled()`: hides immediately once disabled.
  useTask$(({track}) => {
    const disabled = track(() => props.disabled ?? false);
    if (!isBrowser || !disabled) return;
    hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
  });

  // Mirrors upstream's `FocusMonitor` subscription in `ngAfterViewInit`:
  // keyboard-origin focus shows; losing focus entirely hides. Mouse/touch/
  // program origins do neither (hover already shows on `mouseenter`; a
  // programmatic `.focus()` must not open the tooltip).
  useTask$(({track}) => {
    const origin = track(() => focusOrigin.value);
    if (!isBrowser) return;
    if (origin === null) {
      hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
    } else if (origin === 'keyboard' && hostRef.value) {
      const liveCfg = resolveConfig(props, defaults);
      showTooltip(
        ctx,
        signals,
        {
          ...liveCfg,
          animationsDisabled: animationsDisabled.value,
          isLtr: ctx.direction.value !== 'rtl',
        },
        hostRef.value,
        undefined,
      );
    }
  });

  // Every handler below resolves the trigger element via `event.target`,
  // NEVER `event.currentTarget` — see `mat-tooltip.tsx`'s identical note
  // (Qwik's QRL handlers resolve lazily, so by the time this callback body
  // runs the DOM has already reset `currentTarget` to `null`).
  const handleMouseEnter$ = $((event: MouseEvent) => {
    if (!isBrowser) return;
    const liveCfg = resolveConfig(props, defaults);
    if (isTouchPlatform(liveCfg)) return;
    const trigger = event.target as HTMLElement;
    const origin =
      typeof event.clientX === 'number' && typeof event.clientY === 'number'
        ? {x: event.clientX, y: event.clientY}
        : undefined;
    showTooltip(
      ctx,
      signals,
      {
        ...liveCfg,
        animationsDisabled: animationsDisabled.value,
        isLtr: ctx.direction.value !== 'rtl',
      },
      trigger,
      origin,
    );
  });

  const handleMouseLeave$ = $((event: MouseEvent) => {
    if (!isBrowser) return;
    const liveCfg = resolveConfig(props, defaults);
    if (isTouchPlatform(liveCfg)) return;
    const relatedTarget = event.relatedTarget as Node | null;
    const overlayEl = signals.overlayRef.value?.overlayElement;
    if (relatedTarget && overlayEl?.contains(relatedTarget)) return;
    hideTooltip(ctx, signals, {
      hideDelay: liveCfg.hideDelay,
      animationsDisabled: animationsDisabled.value,
    });
  });

  const handleWheel$ = $((event: WheelEvent) => {
    if (!isBrowser || !signals.isVisible.value) return;
    const liveCfg = resolveConfig(props, defaults);
    if (isTouchPlatform(liveCfg)) return;
    const trigger = event.target as HTMLElement;
    const elementUnderPointer = document.elementFromPoint(event.clientX, event.clientY);
    if (elementUnderPointer !== trigger && !trigger.contains(elementUnderPointer)) {
      hideTooltip(ctx, signals, {
        hideDelay: liveCfg.hideDelay,
        animationsDisabled: animationsDisabled.value,
      });
    }
  });

  const handleTouchStart$ = $((event: TouchEvent) => {
    if (!isBrowser) return;
    const liveCfg = resolveConfig(props, defaults);
    if (!isTouchPlatform(liveCfg) || liveCfg.touchGestures === 'off') return;
    const touch = event.targetTouches?.[0];
    const origin = touch ? {x: touch.clientX, y: touch.clientY} : undefined;
    const trigger = event.target as HTMLElement;
    if (touchTimer.value != null) clearTimeout(touchTimer.value);
    touchTimer.value = setTimeout(() => {
      touchTimer.value = undefined;
      showTooltip(
        ctx,
        signals,
        {
          ...liveCfg,
          animationsDisabled: animationsDisabled.value,
          isLtr: ctx.direction.value !== 'rtl',
        },
        trigger,
        origin,
      );
    }, liveCfg.touchLongPressShowDelay);
  });

  const handleTouchEnd$ = $(() => {
    if (!isBrowser) return;
    if (touchTimer.value != null) {
      clearTimeout(touchTimer.value);
      touchTimer.value = undefined;
    }
    const liveCfg = resolveConfig(props, defaults);
    if (!isTouchPlatform(liveCfg) || liveCfg.touchGestures === 'off') return;
    hideTooltip(ctx, signals, {
      hideDelay: liveCfg.touchendHideDelay,
      animationsDisabled: animationsDisabled.value,
    });
  });

  // See this hook's own doc comment for why these three are plain JSX
  // handler props instead of `useFocusOrigin()` — algorithm kept identical
  // to `qwik-cdk/a11y/focus-origin/focus-origin.ts`'s.
  const handlePointerDown$ = $((event: PointerEvent) => {
    lastPointerModality.value = event.pointerType === 'touch' ? 'touch' : 'mouse';
    consumeRecentKeydown();
  });

  const handleFocusIn$ = $(() => {
    focusOrigin.value = wasRecentKeydown() ? 'keyboard' : lastPointerModality.value || 'program';
    lastPointerModality.value = null;
  });

  const handleFocusOut$ = $(() => {
    focusOrigin.value = null;
  });

  // Focus classes mirror upstream's `FocusMonitor.setClasses`.
  const focusClasses = [
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
  ].filter(Boolean) as string[];

  const classes = [
    'mat-mdc-tooltip-trigger',
    cfg.disabled && 'mat-mdc-tooltip-disabled',
    ...focusClasses,
  ].filter(Boolean) as string[];

  // Mirrors upstream `_syncAriaDescription`: described only when there's a
  // message AND the trigger isn't disabled — see `mat-tooltip.tsx`'s
  // identical note for why this is computed directly instead of
  // replicating upstream's setter-order race.
  const describedBy =
    cfg.message && !cfg.disabled ? describedByIdGen.getId('cdk-describedby-message-') : undefined;

  const hostProps: HostProps = {
    ref: hostRef,
    class: classes,
    'aria-describedby': describedBy,
    'cdk-describedby-host': describedBy ? 'qwik-tooltip' : undefined,
    onMouseEnter$: handleMouseEnter$,
    onMouseLeave$: handleMouseLeave$,
    onWheel$: handleWheel$,
    onTouchStart$: handleTouchStart$,
    onTouchEnd$: handleTouchEnd$,
    onTouchCancel$: handleTouchEnd$,
    onPointerDown$: handlePointerDown$,
    onFocusIn$: handleFocusIn$,
    onFocusOut$: handleFocusOut$,
  };

  return {hostProps};
}
