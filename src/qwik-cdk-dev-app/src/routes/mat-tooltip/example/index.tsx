import {$, component$, useContext, useSignal, type NoSerialize} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {QwikMaterialProvider, useAnimationsDisabled} from '@angular-community/qwik-material/dialog';
import {
  showTooltip,
  hideTooltip,
  type TooltipRuntimeSignals,
  type TooltipPosition,
} from '@angular-community/qwik-material/tooltip';

/** Mirrors `qwik-material/tooltip/mat-tooltip.tsx`'s own module-scoped `describedByIdGen`. */
const describedByIdGen = createIdGenerator();

/**
 * Port of material.angular.dev's `tooltip-overview` docs example
 * (src/components-examples/material/tooltip/tooltip-overview/). The real template stacks
 * `matButton="elevated"` and `matTooltip="…"` on one native `<button>` — the same
 * two-directives-on-one-host composition `mat-menu/example` already documents (see that route's
 * header comment for the full rationale); this route owns the button and reproduces both
 * directives' real, verified-live DOM/behavior from already-exported building blocks:
 *   - `MatButton`'s "elevated"-appearance + lazy ripple-loader markup (`mdc-button--raised
 *     mat-mdc-raised-button`, the four static spans, the lazy `mat-ripple-loader-*` host attrs)
 *     is plain, static JSX copied verbatim; the ripple-loader's lazy-init toggle is reproduced
 *     with a local signal flipped from this button's own `onMouseEnter$` — this scenario's only
 *     interaction, and one of `MatRippleLoader`'s real bootstrap events (confirmed live: a fresh
 *     page's tooltip trigger starts with `mat-ripple-loader-uninitialized=""` and no ripple span;
 *     a real hover removes the attribute and adds the (then-empty) span).
 *   - The tooltip itself uses `showTooltip`/`hideTooltip` — the exact exported runtime functions
 *     `<MatTooltip>` calls internally (`qwik-material/tooltip/tooltip-runtime.ts`) — driven here
 *     from `onMouseEnter$`/`onMouseLeave$` directly instead of `<MatTooltip>`'s own internal
 *     `useOn('mouseenter', …)` wiring.
 *   - `aria-describedby` uses the same id-generator pattern `MatTooltip` uses internally
 *     (`createIdGenerator()`, prefix `cdk-describedby-message-`) — the harness normalizes the
 *     digits away regardless (see README.md).
 *
 * `matbutton`/`mattooltip` (both bare, static attributes in the real template — no `[prop]`
 * brackets) are consumer-selector-attribute echoes the harness already ignores/was extended to
 * ignore (`CONSUMER_SELECTOR_ATTRS`), same category as `matButton` everywhere else in this port.
 *
 * Scope: this route's own interaction (see specs/examples/angular-parity.spec.ts) only HOVERS to
 * show the tooltip — a pure pointer interaction never moves focus, so the composed button never
 * needs `useFocusOrigin()`-style tracking for this scenario (confirmed live: hovering never adds
 * a `cdk-*-focused` class to the real Angular trigger either).
 */
export default component$(() => {
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();

  const rippleInitialized = useSignal(false);
  const describedBy = useSignal(() => describedByIdGen.getId('cdk-describedby-message-'));

  const signals: TooltipRuntimeSignals = {
    message: useSignal('Info about the action'),
    isVisible: useSignal(false),
    everShown: useSignal(false),
    overlayRef: useSignal<NoSerialize<OverlayRef>>(),
    positionClass: useSignal<TooltipPosition | null>(null),
    showTimer: useSignal<ReturnType<typeof setTimeout>>(),
    hideTimer: useSignal<ReturnType<typeof setTimeout>>(),
  };

  const handleMouseEnter$ = $((event: MouseEvent) => {
    if (!isBrowser) return;
    rippleInitialized.value = true;
    const trigger = event.target as HTMLElement;
    showTooltip(
      ctx,
      signals,
      {
        message: 'Info about the action',
        disabled: false,
        position: 'below',
        positionAtOrigin: false,
        showDelay: 0,
        tooltipClassList: [],
        animationsDisabled: animationsDisabled.value,
        isLtr: ctx.direction.value !== 'rtl',
      },
      trigger,
      {x: event.clientX, y: event.clientY},
    );
  });

  const handleMouseLeave$ = $(() => {
    if (!isBrowser) return;
    hideTooltip(ctx, signals, {hideDelay: 0, animationsDisabled: animationsDisabled.value});
  });

  return (
    <QwikMaterialProvider>
      <div data-parity-root>
        <tooltip-overview-example>
          <button
            class="mdc-button mat-mdc-button-base mat-mdc-tooltip-trigger mdc-button--raised mat-mdc-raised-button mat-unthemed"
            mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
            mat-ripple-loader-class-name="mat-mdc-button-ripple"
            aria-label="Button that displays a tooltip when focused or hovered over"
            aria-describedby={describedBy.value}
            onMouseEnter$={handleMouseEnter$}
            onMouseLeave$={handleMouseLeave$}
          >
            <span class="mat-mdc-button-persistent-ripple mdc-button__ripple" />
            <span class="mdc-button__label">Action</span>
            <span class="mat-focus-indicator" />
            <span class="mat-mdc-button-touch-target" />
            {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
          </button>
        </tooltip-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
