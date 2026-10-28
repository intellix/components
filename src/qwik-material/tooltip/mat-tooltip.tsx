import {
  $,
  component$,
  Slot,
  useContext,
  useOn,
  useSignal,
  useTask$,
  type NoSerialize,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {createIdGenerator, useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
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
 * Props for `<MatTooltip>`. Mirrors upstream's `[matTooltip]` directive
 * (`src/material/tooltip/tooltip.ts`'s `MatTooltip`).
 *
 * Polymorphic host via the `as` prop — same pattern as `MatBadge`/
 * `MatListItem` (design spec rule 4: "Where Angular puts a directive on a
 * consumer element … the Qwik component renders that element itself via a
 * polymorphic `as` prop — no extra wrapper elements"). `matTooltip` is
 * exactly that kind of directive: it attaches to the CONSUMER's own host
 * element, never introducing a wrapper. `<MatTooltip as="button" message="…">
 * Action</MatTooltip>` therefore renders a single `<button>` carrying both
 * the tooltip's own host bindings (`mat-mdc-tooltip-trigger` etc.) and
 * whatever native attributes were passed through — no `<MatTooltip>`
 * element of its own ever appears in the DOM. See tooltip/SYNC.md for the
 * alternative (`useMatTooltip()` hook returning spreadable props) this port
 * considered and why `as` was chosen.
 */
export interface MatTooltipProps {
  /** Which host tag to render. Default `'span'`. Every parity scenario uses `'button'`. */
  as?: 'button' | 'a' | 'div' | 'span';
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
  /**
   * Mirrors `[matTooltipTouchGestures]`. Accepted for API parity; see
   * `isTouchPlatform` below / SYNC.md — this port doesn't ported upstream's
   * `Platform.IOS`/`Platform.ANDROID` touch detection, so on every
   * automated-testing / desktop-browser context (this port's whole test
   * matrix) touch gestures never activate regardless of this prop, same as
   * upstream confirms live (see angular-parity.spec.ts's header note).
   */
  touchGestures?: TooltipTouchGestures;
  /** Mirrors `[matTooltipClass]`. Supports the same shapes as Angular's `ngClass` (minus `Set`). */
  tooltipClass?: string | readonly string[] | Readonly<Record<string, boolean>>;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  id?: string;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  tabIndex?: number;
  /** When `as='a'`, sets the href. Ignored for other tags. */
  href?: string;
  /** Native `<button>` type. Ignored for other tags. */
  type?: 'button' | 'submit' | 'reset';
  onClick$?: QRL<(event: MouseEvent) => void>;
  /**
   * Forwarded onto whichever host tag `as` renders — same rationale as
   * `MatListItem`'s `onClick$` doc comment: upstream lets the consumer
   * attach arbitrary extra listeners directly on their own templated
   * element (e.g. `<button [matTooltip]="…" (keydown.m)="…">`), which a
   * Qwik `component$` that renders the host itself has no other way to
   * accept.
   */
  onKeyDown$?: QRL<(event: KeyboardEvent) => void>;
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

/** Mirrors `set message()`'s `String(value).trim()` coercion. */
function normalizeMessage(value: MatTooltipProps['message']): string {
  return value == null ? '' : String(value).trim();
}

/**
 * Resolves `[matTooltipClass]`'s accepted shapes (string / string[] /
 * `Record<string, boolean>`) into a flat class list. Upstream also accepts
 * a `Set<string>`; omitted here since no prop can carry a `Set` through
 * JSX/serialization boundaries cleanly, and no scenario needs it.
 */
function resolveTooltipClass(value: MatTooltipProps['tooltipClass']): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
  if (Array.isArray(value)) return (value as string[]).filter(Boolean);
  return Object.keys(value).filter(key => !!(value as Record<string, boolean>)[key]);
}

/** Merges `props` with the provider's `MAT_TOOLTIP_DEFAULT_OPTIONS` and upstream's hardcoded defaults. */
function resolveConfig(
  props: MatTooltipProps,
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

/**
 * Approximates upstream `MatTooltip._isTouchPlatform()`. Upstream defaults
 * to UA-sniffing via the CDK `Platform` service (`Platform.IOS` /
 * `Platform.ANDROID`), which this port hasn't ported; the practical default
 * here is "assume non-touch" unless `detectHoverCapability` opts into the
 * `any-hover` media-query check (or a custom function). Every automated
 * test context this port runs under is non-touch, matching upstream's own
 * confirmed-live behaviour for `touchGestures` (see `angular-parity.spec.ts`).
 */
function isTouchPlatform(cfg: ResolvedTooltipConfig): boolean {
  if (typeof cfg.detectHoverCapability === 'function') {
    return !cfg.detectHoverCapability();
  }
  if (!isBrowser) return false;
  if (!cfg.detectHoverCapability) return false;
  return typeof matchMedia === 'function' && matchMedia('(any-hover: none)').matches;
}

/**
 * Shared monotonic id generator for the `aria-describedby` reference,
 * mirroring upstream's root-provided `AriaDescriber`/`_IdGenerator`
 * singleton — same simplified approach `MatBadge` already uses (see
 * badge/mat-badge.tsx + tooltip/SYNC.md): a real hidden "describedby
 * message" DOM node (upstream's `AriaDescriber`) is not created, only the
 * `aria-describedby="cdk-describedby-message-N"` reference token, which is
 * all the parity harness's normalization (`material-parity.ts`) compares
 * (`cdk-describedby-host` is ignored outright).
 */
const describedByIdGen = createIdGenerator();

export const MatTooltip = component$<MatTooltipProps>(props => {
  const as = props.as ?? 'span';
  const ctx = useContext(QWIK_CDK);
  const defaults = useContext(MAT_TOOLTIP_DEFAULT_OPTIONS, {});
  const animationsDisabled = useAnimationsDisabled();
  const focusOrigin = useFocusOrigin();

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
  // NEVER `event.currentTarget`: Qwik's QRL handlers resolve lazily (a
  // dynamic `import()`, even for an already-loaded chunk — see the design
  // doc's pitfalls list), so by the time this callback body actually runs,
  // the native event has already finished dispatching and the DOM has reset
  // `currentTarget` to `null` (confirmed live: reading it here produced a
  // `null` origin fed straight into `FlexibleConnectedPositionStrategy`,
  // crashing on the very first `apply()`). `target` has no such dispatch-
  // scoped lifetime, which is also why `useFocusOrigin()`
  // (qwik-cdk/a11y/focus-origin/focus-origin.ts) already reads `target`.
  useOn(
    'mouseenter',
    $((event: Event) => {
      if (!isBrowser) return;
      const liveCfg = resolveConfig(props, defaults);
      if (isTouchPlatform(liveCfg)) return;
      const trigger = event.target as HTMLElement;
      const me = event as MouseEvent;
      const origin =
        typeof me.clientX === 'number' && typeof me.clientY === 'number'
          ? {x: me.clientX, y: me.clientY}
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
    }),
  );

  useOn(
    'mouseleave',
    $((event: Event) => {
      if (!isBrowser) return;
      const liveCfg = resolveConfig(props, defaults);
      if (isTouchPlatform(liveCfg)) return;
      const relatedTarget = (event as MouseEvent).relatedTarget as Node | null;
      const overlayEl = signals.overlayRef.value?.overlayElement;
      if (relatedTarget && overlayEl?.contains(relatedTarget)) return;
      hideTooltip(ctx, signals, {
        hideDelay: liveCfg.hideDelay,
        animationsDisabled: animationsDisabled.value,
      });
    }),
  );

  useOn(
    'wheel',
    $((event: Event) => {
      if (!isBrowser || !signals.isVisible.value) return;
      const liveCfg = resolveConfig(props, defaults);
      if (isTouchPlatform(liveCfg)) return;
      const we = event as WheelEvent;
      const trigger = event.target as HTMLElement;
      const elementUnderPointer = document.elementFromPoint(we.clientX, we.clientY);
      if (elementUnderPointer !== trigger && !trigger.contains(elementUnderPointer)) {
        hideTooltip(ctx, signals, {
          hideDelay: liveCfg.hideDelay,
          animationsDisabled: animationsDisabled.value,
        });
      }
    }),
  );

  useOn(
    'touchstart',
    $((event: Event) => {
      if (!isBrowser) return;
      const liveCfg = resolveConfig(props, defaults);
      if (!isTouchPlatform(liveCfg) || liveCfg.touchGestures === 'off') return;
      const te = event as TouchEvent;
      const touch = te.targetTouches?.[0];
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
    }),
  );

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
  useOn('touchend', handleTouchEnd$);
  useOn('touchcancel', handleTouchEnd$);

  // Focus classes mirror upstream's `FocusMonitor.setClasses` — a real
  // signal (not a side effect) so it survives Qwik's `class` prop replacing
  // the whole attribute on every render, same rationale as
  // `useFocusOrigin()`'s own doc comment.
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
    ...(Array.isArray(props.class) ? props.class : props.class ? [props.class] : []),
  ].filter(Boolean) as string[];

  // Mirrors upstream `_syncAriaDescription`: described only when there's a
  // message AND the trigger isn't disabled (see tooltip/SYNC.md for why
  // this port computes it directly from current props instead of
  // replicating upstream's setter-order race — same end result for every
  // parity scenario, confirmed live).
  const describedBy =
    cfg.message && !cfg.disabled ? describedByIdGen.getId('cdk-describedby-message-') : undefined;

  const sharedAttrs = {
    ref: hostRef,
    id: props.id,
    class: classes,
    style: props.style,
    role: props.role,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': describedBy,
    'cdk-describedby-host': describedBy ? 'qwik-tooltip' : undefined,
    tabIndex: props.tabIndex,
  };

  if (as === 'a') {
    return (
      <a {...sharedAttrs} href={props.href} onClick$={props.onClick$} onKeyDown$={props.onKeyDown$}>
        <Slot />
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button
        {...sharedAttrs}
        type={props.type}
        onClick$={props.onClick$}
        onKeyDown$={props.onKeyDown$}
      >
        <Slot />
      </button>
    );
  }

  if (as === 'div') {
    return (
      <div {...sharedAttrs} onClick$={props.onClick$} onKeyDown$={props.onKeyDown$}>
        <Slot />
      </div>
    );
  }

  return (
    <span {...sharedAttrs} onClick$={props.onClick$} onKeyDown$={props.onKeyDown$}>
      <Slot />
    </span>
  );
});
