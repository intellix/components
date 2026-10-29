import {
  $,
  component$,
  useContext,
  useOn,
  useSignal,
  useTask$,
  type JSXOutput,
  type NoSerialize,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {
  hideTooltip,
  showTooltip,
  type TooltipPosition,
  type TooltipRuntimeSignals,
} from '@angular-community/qwik-material/tooltip';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {FocusIndicator} from '../button/internal/focus-indicator';
import {TouchTarget} from '../button/internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from '../button/internal/ripple-loader';

/**
 * One `first`/`previous`/`next`/`last` nav button. Mirrors `paginator.html`'s
 * `<button matIconButton type="button" disabledInteractive [matTooltip]="..." ...>` — a SINGLE
 * element that is simultaneously an icon button (`MatIconButton`) AND a tooltip trigger
 * (`[matTooltip]`). Neither `qwik-material/button`'s `<MatIconButton>` nor
 * `qwik-material/tooltip`'s `<MatTooltip as="button">` can be composed to produce that (both are
 * host-rendering `component$`s with their own `<button>` root — nesting one inside the other
 * would add a wrapper element, failing DOM parity), so this component renders the combined markup
 * directly, reusing the same INTERNAL pieces `MatIconButton` itself is built from
 * (`button/internal/*` — ripple-loader, focus-indicator, touch-target) plus `qwik-material/
 * tooltip`'s exported runtime functions (`showTooltip`/`hideTooltip`) for the hover behavior,
 * rather than duplicating either from scratch.
 *
 * `disabledInteractive` is always true here (every paginator nav button carries the static
 * attribute unconditionally — see `src/dev-app/qwik-parity/paginator.ts`'s NAV BUTTONS section),
 * so this component hardcodes that contract rather than exposing it as a prop:
 * - the native `disabled` ATTRIBUTE is never rendered (`_getDisabledAttribute()` is always
 *   `null` when `disabledInteractive` is true);
 * - `aria-disabled="true"` renders exactly when `disabled` is true (`_getAriaDisabled()`);
 * - `tabindex="-1"` renders exactly when `disabled` is true, ABSENT otherwise — this is
 *   `paginator.html`'s OWN extra `[tabindex]="_xButtonsDisabled() ? -1 : null"` template binding
 *   layered on top of `MatButtonBase`'s host binding (which, for `disabledInteractive`, would
 *   otherwise leave the button focusable even while visually disabled); see that file's header
 *   for the full upstream binding-precedence story. A general-purpose icon button (`MatIconButton`
 *   itself) does NOT replicate this — it is specific to how `MatPaginator` consumes the button.
 *
 * `label` is used both as the native `aria-label` AND the tooltip message — mirrors upstream's
 * `[attr.aria-label]="_intl.xLabel"` + `[matTooltip]="_intl.xLabel"` both reading the SAME
 * `MatPaginatorIntl` string. `disabled` doubles as `[matTooltipDisabled]` (upstream binds both to
 * the identical `_previousButtonsDisabled()`/`_nextButtonsDisabled()` predicate).
 *
 * ## What this does NOT replicate from `qwik-material/tooltip`'s `MatTooltip` (deviations)
 *
 * No parity scenario ever hovers a nav button (every click helper in `angular-parity.spec.ts`
 * moves the mouse to `(0, 0)` immediately afterwards specifically to avoid ever finishing a step
 * mid-hover — see that file's header) or asserts the tooltip's own overlay — only its STATIC
 * trigger-side DOM (`mat-mdc-tooltip-trigger`/`mat-mdc-tooltip-disabled` classes,
 * `aria-describedby`) is ever compared. To keep this component focused, only real mouse
 * hover/leave is wired (via `useOn`, kept lazy per the design doc's rule 7 — no eager
 * `useVisibleTask$`); `MatTooltip`'s own touch-gesture/wheel-scroll-dismiss/keyboard-focus-show
 * handling is NOT duplicated here (accepted gap — see this package's SYNC.md). Escape-to-close
 * and outside-click-to-close still work for free, since `showTooltip` wires both internally
 * regardless of which caller invoked it.
 *
 * ## No `aria-describedby` at all (confirmed live — read before adding one back)
 *
 * Every paginator nav button sets BOTH `[attr.aria-label]="_intl.xLabel"` and
 * `[matTooltip]="_intl.xLabel"` to the SAME string (`label` here). Upstream's `AriaDescriber`
 * (`src/cdk/a11y/aria-describer/aria-describer.ts`'s `_canBeDescribed`) explicitly skips adding
 * ANY description — no hidden element, no `aria-describedby` — when the message exactly equals
 * the host's current `aria-label` ("we shouldn't set descriptions if they're exactly the same as
 * the `aria-label` of an element", the method's own comment), to avoid a screen reader announcing
 * the same text twice. Since that's true for every paginator nav button in every scenario by
 * construction, this component never renders `aria-describedby`/`cdk-describedby-host` at all —
 * confirmed live against the real Angular dev-app (not present on any nav button, in any
 * scenario). A future consumer of this component with a DIFFERENT `aria-label` than `label`
 * would need the full `_canBeDescribed` check ported; nothing here exercises that.
 */
export interface PaginatorNavButtonProps {
  /** e.g. `'mat-mdc-paginator-navigation-previous'`. */
  class: string;
  /** Used as both `aria-label` and the tooltip message — see the module doc comment. */
  label: string;
  /** Mirrors `_previousButtonsDisabled()`/`_nextButtonsDisabled()` — drives `aria-disabled`,
   *  `tabindex`, and `matTooltipDisabled` all at once. */
  disabled: boolean;
  onClick$: QRL<() => void>;
  /** The button's icon — a literal `<svg class="mat-mdc-paginator-icon">`. */
  icon: JSXOutput;
}

export const PaginatorNavButton = component$<PaginatorNavButtonProps>(props => {
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();
  const focusOrigin = useFocusOrigin();
  const hostRef = useSignal<HTMLElement>();

  const signals: TooltipRuntimeSignals = {
    message: useSignal(props.label),
    isVisible: useSignal(false),
    everShown: useSignal(false),
    overlayRef: useSignal<NoSerialize<OverlayRef>>(),
    positionClass: useSignal<TooltipPosition | null>(null),
    showTimer: useSignal<ReturnType<typeof setTimeout>>(),
    hideTimer: useSignal<ReturnType<typeof setTimeout>>(),
  };

  // Mirrors `MatTooltip`'s own hover wiring (mat-tooltip.tsx) — see the module doc comment for
  // what's deliberately not duplicated here. `event.target`, never `event.currentTarget` — a QRL
  // handler resolves lazily (at least one microtask, even for an already-cached chunk), by which
  // time the DOM has already reset `currentTarget` to `null` (same pitfall `MatTooltip` itself
  // documents).
  useOn(
    'mouseenter',
    $((event: Event) => {
      if (!isBrowser || props.disabled) return;
      const trigger = event.target as HTMLElement;
      const me = event as MouseEvent;
      showTooltip(
        ctx,
        signals,
        {
          message: props.label,
          disabled: props.disabled,
          position: 'above',
          positionAtOrigin: false,
          showDelay: 0,
          tooltipClassList: [],
          animationsDisabled: animationsDisabled.value,
          isLtr: ctx.direction.value !== 'rtl',
        },
        trigger,
        typeof me.clientX === 'number' ? {x: me.clientX, y: me.clientY} : undefined,
      );
    }),
  );

  useOn(
    'mouseleave',
    $((event: Event) => {
      if (!isBrowser) return;
      const relatedTarget = (event as MouseEvent).relatedTarget as Node | null;
      const overlayEl = signals.overlayRef.value?.overlayElement;
      if (relatedTarget && overlayEl?.contains(relatedTarget)) return;
      hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
    }),
  );

  // Mirrors `MatTooltip`'s `set disabled()` — hides immediately once the button (and therefore
  // its tooltip) becomes disabled.
  useTask$(({track}) => {
    const disabled = track(() => props.disabled);
    if (!isBrowser || !disabled) return;
    hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
  });

  const rippleInitialized = useRippleLoader();
  // `disabled` is deliberately OMITTED from this config (unlike `MatIconButton`'s own usage) —
  // see the `rippleDisabledAttr` doc comment below for why this component computes
  // `mat-ripple-loader-disabled` itself instead.
  const rippleAttrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple', centered: true});

  /**
   * Mirrors upstream `MatRippleLoader.setDisabled()`'s REAL two-branch behavior (`src/material/
   * core/private/ripple-loader.ts`) — NOT a naive "always reflect the current `disabled` prop"
   * attribute (which is what `rippleLoaderHostAttrs`' spread-based `disabled` config normally
   * produces, and which is exactly wrong here — see below): upstream only touches the
   * `mat-ripple-loader-disabled` ATTRIBUTE while the ripple has NEVER been instantiated; the
   * moment a qualifying interaction creates it (same event this component's own
   * `useRippleLoader()` / `rippleInitialized` watches for), every LATER `setDisabled()` call
   * mutates the ripple's own internal property only and never touches the attribute again — so
   * whatever the attribute was AT the instant of first interaction is what it stays, forever,
   * even if `disabled` keeps changing afterward.
   *
   * Confirmed live this is NOT a corner case for paginator specifically: `show-first-last`'s own
   * `click last` step clicks a button that BECOMES disabled by that very click — the native
   * ripple-triggering `mousedown` fires (instantiating the ripple) before Angular's own change
   * detection updates `_nextButtonsDisabled()`, so upstream's real DOM keeps NO
   * `mat-ripple-loader-disabled` attribute on that button afterward, while a SIBLING button that
   * simply becomes enabled by the same click (never interacted with directly) correctly has its
   * attribute REMOVED (upstream's "never instantiated" branch still runs for it). A plain
   * `rippleLoaderHostAttrs({disabled: props.disabled})` spread gets BOTH cases wrong — the
   * sibling case additionally hits the exact "spread value can't be removed after a client
   * re-render" hazard `rippleLoaderHostAttrs`'s own doc comment already documents (hence
   * `RIPPLE_UNINITIALIZED_ATTR` is rendered as its own literal attribute, never through the
   * spread, elsewhere in this project) — this is the same fix, applied to a SECOND attribute this
   * component is the first consumer to toggle dynamically after mount.
   */
  const rippleDisabledAttr = useSignal(props.disabled);
  useTask$(({track}) => {
    const everInitialized = track(() => rippleInitialized.value);
    const liveDisabled = track(() => props.disabled);
    if (everInitialized) return; // sticky from here on — see the doc comment above.
    rippleDisabledAttr.value = liveDisabled;
  });

  const classes = [
    'mat-mdc-button-base',
    'mdc-icon-button',
    'mat-mdc-icon-button',
    'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    // Always true for every paginator nav button — see the module doc comment.
    'mat-mdc-button-disabled-interactive',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    'mat-mdc-tooltip-trigger',
    props.disabled && 'mat-mdc-tooltip-disabled',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <button
      ref={hostRef}
      type="button"
      class={classes}
      aria-label={props.label}
      aria-disabled={props.disabled ? 'true' : undefined}
      tabIndex={props.disabled ? -1 : undefined}
      onClick$={props.onClick$}
      // Bare, static attributes `paginator.html` itself writes on every nav button
      // unconditionally (`disabledInteractive`, `matTooltipPosition="above"`) — Material's own
      // template emitting them, not a per-scenario choice, so they must be reproduced verbatim
      // (see this file's module doc comment and `qwik-material/select/mat-select.tsx`'s matching
      // `hidesingleselectionindicator` echo for the same category of fix).
      {...{disabledinteractive: '', mattooltipposition: 'above'}}
      {...rippleAttrs}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      mat-ripple-loader-disabled={rippleDisabledAttr.value ? '' : undefined}
    >
      <span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple" />
      {props.icon}
      <FocusIndicator />
      <TouchTarget />
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </button>
  );
});
