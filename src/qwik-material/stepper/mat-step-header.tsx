import {component$, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import type {StepperOrientation, StepState} from '@angular-community/qwik-cdk/stepper';
import {MatIcon} from '../icon/mat-icon';

/**
 * Internal per-step header item — `src/material/stepper/step-header.html` +
 * `step-header.ts` (`MatStepHeader`), rendered once per step by `MatStepper`
 * (NOT exported from the public API — same "internal item, data-driven
 * parent" split as `qwik-material/tabs`' `MatTabLabelItem`).
 *
 * Hardcodes `MatStepperIntl`'s default English strings ('Optional'/
 * 'Completed'/'Editable') — no i18n/Intl service exists anywhere in this
 * port yet (no other ported component has one either), so this is a scope
 * cut, not a stepper-specific one. `matStepperIcon` overrides are not
 * ported — not exercised by any angular-parity.spec.ts scenario.
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
      onClick$={() => props.onHeaderClick$(props.index)}
    >
      {/* `matripple` mirrors Angular's bare `matRipple` directive-selector
          attribute (static, no value) left on the rendered DOM — see
          `qwik-material/button-toggle/mat-button-toggle.tsx`'s identical
          comment. `[matRippleTrigger]`/`[matRippleDisabled]` are bracketed
          (consumed only, never echoed), and ripple interactivity itself is
          out of scope (design doc rule 6) — only the static container. */}
      <div
        {...({matripple: ''} as Record<string, string>)}
        class="mat-ripple mat-step-header-ripple mat-focus-indicator"
      />
      <div class={iconClasses}>
        <div class="mat-step-icon-content">
          {props.state === 'number' ? (
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
