import {$, component$, useSignal, type JSXOutput, type QRL} from '@qwik.dev/core';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {StepperOrientation, StepState} from '@angular-community/qwik-cdk/stepper';
import {MatIcon} from '../icon/mat-icon';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {cloneJsxForReuse} from '../core/jsx-reuse';

/**
 * Internal per-step header item — `src/material/stepper/step-header.html` +
 * `step-header.ts` (`MatStepHeader`), rendered once per step by `MatStepper`
 * (NOT exported from the public API — same "internal item, data-driven
 * parent" split as `qwik-material/tabs`' `MatTabLabelItem`).
 *
 * Hardcodes `MatStepperIntl`'s default English strings ('Optional'/
 * 'Completed'/'Editable') — no i18n/Intl service exists anywhere in this
 * port yet (no other ported component has one either), so this is a scope
 * cut, not a stepper-specific one. `matStepperIcon` overrides (static
 * content only, no context — see `iconOverride` below and `mat-
 * stepper.tsx`'s `stepperIcon` doc comment) are ported.
 */
export interface MatStepHeaderItemProps {
  orientation: StepperOrientation;
  /** 0-based index of this step. */
  index: number;
  /** Total step count (`aria-setsize`, horizontal only). */
  count: number;
  id: string;
  contentId: string;
  selected: boolean;
  /** `step.isNavigable()` — drives the label's `mat-step-label-active`
   *  class (upstream's `active` input, a normal `@Input()` not subject to
   *  `ariaDisabled`'s own quirk below). */
  active: boolean;
  /**
   * The literal `aria-disabled` attribute value (`'true'` or `undefined`),
   * computed by `MatStepper` — NOT simply `!active`. Upstream's template
   * has TWO `[attr.aria-disabled]` bindings on this element (`stepper.html`):
   * an earlier `orientation === 'vertical' && step.isSelected() ? 'true' :
   * null` and the later, "real" `step.isNavigable() ? null : true`. Angular
   * memoizes EACH binding against its OWN previous value and only touches
   * the DOM when THAT specific expression changes — so whichever binding's
   * value changed most recently "wins", not simply whichever is declared
   * last. For a vertical, non-linear stepper (`isNavigable()` is always
   * `true`, so the second binding's value never changes after the first
   * render), this means a header that transitions from unselected to
   * selected gets `aria-disabled="true"` STUCK on it (the first binding
   * firing, the second one skipped because unchanged) until it's
   * deselected again — confirmed live; see `mat-stepper.tsx`'s
   * `ariaDisabledQuirk` store for the full replication. */
  ariaDisabled?: 'true';
  tabIndex: number;
  state: StepState;
  label?: string;
  labelTemplate?: JSXOutput;
  optional: boolean;
  errorMessage?: string;
  color?: 'primary' | 'accent' | 'warn';
  ariaLabel?: string;
  ariaLabelledby?: string;
  /** Mirrors `MatStepper.disableRipple`, threaded down from `mat-stepper.tsx`
   *  — upstream `step-header.html`'s `[matRippleDisabled]="disableRipple"`
   *  reads the OWNING STEPPER's input, not a per-step one. */
  disableRipple?: boolean;
  /** `MatStepper.stepperIcon?.[state]` — the override content for THIS
   *  step's resolved icon state, already resolved by `mat-stepper.tsx`'s
   *  `renderHeader` (a plain lookup, `props.stepperIcon?.[indicatorType]`).
   *  `undefined` means no override for this state — render the default
   *  icon markup. When present, REPLACES `.mat-step-icon-content`'s entire
   *  default content (the number span / done-or-edit hidden label +
   *  `<MatIcon>`) — mirrors `step-header.html`'s `@if (iconOverrides &&
   *  iconOverrides[state])` branch. Cloned via `cloneJsxForReuse` at the
   *  embedding site below since the SAME override object can be shared by
   *  more than one step header within a single render (one override per
   *  STATE, not per step). */
  iconOverride?: JSXOutput;
  /** Mirrors `step.select()` — always attempts a real selection change;
   *  whether it succeeds is the stepper's own linear/editable gating. */
  onHeaderClick$: QRL<(index: number) => void>;
}

/** Mirrors `MatStepHeader._getDefaultTextForState`. */
export function defaultTextForState(state: StepState, index: number): string {
  if (state === 'number') return `${index + 1}`;
  if (state === 'edit') return 'create';
  if (state === 'error') return 'warning';
  return state;
}

export const MatStepHeaderItem = component$<MatStepHeaderItemProps>(props => {
  // Mirrors `MatStepHeader`'s `FocusMonitor.monitor(this._elementRef, true)`.
  const focusOrigin = useFocusOrigin();
  const animationsDisabled = useAnimationsDisabled();
  const hostRef = useSignal<HTMLElement>();
  const rippleContainerRef = useSignal<HTMLElement>();

  // Upstream `step-header.html`: `[matRippleTrigger]="_getHostElement()"` —
  // the step header's own host `<mat-step-header>` (hostRef below). ONE
  // shared `$()` reference wired to all six pointer events — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  const rippleEvent$ = $((event: MouseEvent | TouchEvent) => {
    handleRippleEvent(event, rippleContainerRef.value, {
      rippleDisabled: !!props.disableRipple,
      rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
    });
  });

  const horizontal = props.orientation === 'horizontal';
  const hasOptionalLabel = props.optional && props.state !== 'error';
  const hasErrorLabel = props.state === 'error';
  const hasEmptyLabel = !props.labelTemplate && !props.label && !hasOptionalLabel && !hasErrorLabel;

  const classes = [
    'mat-step-header',
    horizontal ? 'mat-horizontal-stepper-header' : 'mat-vertical-stepper-header',
    `mat-${props.color || 'primary'}`,
    hasEmptyLabel && 'mat-step-header-empty-label',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
  ].filter(Boolean) as string[];

  const labelClasses = [
    'mat-step-label',
    props.active && 'mat-step-label-active',
    props.selected && 'mat-step-label-selected',
    hasErrorLabel && 'mat-step-label-error',
  ].filter(Boolean) as string[];

  const iconClasses = [
    'mat-step-icon',
    `mat-step-icon-state-${props.state}`,
    props.selected && 'mat-step-icon-selected',
  ].filter(Boolean) as string[];

  return (
    <mat-step-header
      ref={hostRef}
      class={classes}
      role={horizontal ? 'tab' : 'button'}
      tabIndex={props.tabIndex}
      id={props.id}
      aria-posinset={horizontal ? props.index + 1 : undefined}
      aria-setsize={horizontal ? props.count : undefined}
      aria-selected={horizontal ? (props.selected ? 'true' : 'false') : undefined}
      aria-current={!horizontal && props.selected ? 'step' : undefined}
      aria-expanded={!horizontal ? (props.selected ? 'true' : 'false') : undefined}
      aria-controls={props.contentId}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={!props.ariaLabel && props.ariaLabelledby ? props.ariaLabelledby : undefined}
      aria-disabled={props.ariaDisabled}
      // v2: explicit $() (rather than relying on the optimizer's implicit
      // inline-arrow transform) — on a custom intrinsic aliased to
      // `QwikIntrinsicElements['div']` (see intrinsic-elements.d.ts), an
      // un-$()-wrapped zero-arg arrow infers as `() => Promise<void>`
      // with no contextual target and fails strict assignability against
      // `QRLEventHandlerMulti<PointerEvent, HTMLDivElement>`'s QRL brand;
      // wrapping it lets `$()` pick up the prop's expected signature as
      // its contextual type instead. Real `<div>` elements don't need this
      // (their JSX typing resolves the inline-arrow form directly).
      onClick$={$(() => props.onHeaderClick$(props.index))}
      onMouseDown$={rippleEvent$}
      onMouseUp$={rippleEvent$}
      onMouseLeave$={rippleEvent$}
      onTouchStart$={rippleEvent$}
      onTouchEnd$={rippleEvent$}
      onTouchCancel$={rippleEvent$}
    >
      {/* `matripple` mirrors Angular's bare `matRipple` directive-selector
          attribute (static, no value) left on the rendered DOM — see
          `qwik-material/button-toggle/mat-button-toggle.tsx`'s identical
          comment. Real `.mat-ripple-element` spans launch here on
          `mousedown`/`touchstart` of the host `<mat-step-header>` above
          (`core/ripple/ripple-dom.ts`) — see stepper/SYNC.md. */}
      <div
        ref={rippleContainerRef}
        {...({matripple: ''} as Record<string, string>)}
        class="mat-ripple mat-step-header-ripple mat-focus-indicator"
      />
      <div class={iconClasses}>
        <div class="mat-step-icon-content">
          {props.iconOverride !== undefined ? (
            cloneJsxForReuse(props.iconOverride)
          ) : props.state === 'number' ? (
            <span aria-hidden="true">{defaultTextForState(props.state, props.index)}</span>
          ) : (
            <>
              {props.state === 'done' && <span class="cdk-visually-hidden">Completed</span>}
              {props.state === 'edit' && <span class="cdk-visually-hidden">Editable</span>}
              <MatIcon aria-hidden="true">{defaultTextForState(props.state, props.index)}</MatIcon>
            </>
          )}
        </div>
      </div>
      <div class={labelClasses}>
        {props.labelTemplate !== undefined ? (
          <div class="mat-step-text-label">{props.labelTemplate}</div>
        ) : props.label != null ? (
          <div class="mat-step-text-label">{props.label}</div>
        ) : null}
        {hasOptionalLabel && <div class="mat-step-optional">Optional</div>}
        {hasErrorLabel && <div class="mat-step-sub-label-error">{props.errorMessage}</div>}
      </div>
    </mat-step-header>
  );
});
