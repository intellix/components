/**
 * Pure logic mirroring `CdkStep`/`CdkStepper`'s computed getters and gating
 * methods (`src/cdk/stepper/stepper.ts`). Framed as plain functions over
 * plain data (no class, no signals) so every rule is independently
 * unit-testable without rendering anything — `qwik-material/stepper`'s
 * `MatStepper` supplies the live values (props, an internal `interacted`
 * store, `StepControl` snapshots) on every render/interaction.
 */
import {STEP_STATE, type StepContentPositionState, type StepState} from './step-types';

// ─────────────────────────────────────────────────────────────────────────
// completed / hasError (CdkStep's `completed`/`hasError` getters)
// ─────────────────────────────────────────────────────────────────────────

export interface ComputeCompletedParams {
  /** Whether the user has attempted to move away from this step. */
  interacted: boolean;
  /** `stepControl.valid`, or `undefined` when the step has no control —
   *  mirrors upstream's `!this.stepControl || this.stepControl.valid`. */
  controlValid?: boolean;
  /** Consumer-set `completed` override (CdkStep's `_completedOverride`
   *  signal). `null`/`undefined` means "no override, use the computed
   *  value". */
  completedOverride?: boolean | null;
}

/** Mirrors `CdkStep.completed` getter. */
export function computeCompleted(params: ComputeCompletedParams): boolean {
  const {interacted, controlValid, completedOverride} = params;
  if (completedOverride != null) return completedOverride;
  return interacted && (controlValid === undefined || controlValid);
}

export interface ComputeHasErrorParams {
  interacted: boolean;
  /** `stepControl.invalid`, or `undefined` when the step has no control. */
  controlInvalid?: boolean;
  /** Consumer-set `hasError` override (CdkStep's `_customError` signal). */
  hasErrorOverride?: boolean | null;
}

/** Mirrors `CdkStep.hasError` getter / `_getDefaultError()`. */
export function computeHasError(params: ComputeHasErrorParams): boolean {
  const {interacted, controlInvalid, hasErrorOverride} = params;
  if (hasErrorOverride != null) return hasErrorOverride;
  return interacted && !!controlInvalid;
}

/**
 * Mirrors `CdkStep._showError()`: the global option wins when set; otherwise
 * error display is opted into per-step via the `hasError` override.
 */
export function shouldShowError(
  globalShowError: boolean | undefined,
  hasErrorOverride: boolean | null | undefined,
): boolean {
  return globalShowError ?? hasErrorOverride != null;
}

// ─────────────────────────────────────────────────────────────────────────
// isNavigable / indicatorType (CdkStep's computed signals)
// ─────────────────────────────────────────────────────────────────────────

/** Mirrors `CdkStep.isNavigable` computed. */
export function isNavigable(completed: boolean, selected: boolean, linear: boolean): boolean {
  return completed || selected || !linear;
}

export interface IndicatorTypeParams {
  selected: boolean;
  completed: boolean;
  editable: boolean;
  showError: boolean;
  hasError: boolean;
  /** `StepperOptions.displayDefaultIndicatorType`. Default true. */
  displayDefaultIndicatorType?: boolean;
  /** The step's own custom `state` input, used as a fallback in the
   *  non-default-indicator-type branch. Default 'number'. */
  defaultState?: StepState;
}

/** Mirrors `CdkStep.indicatorType` computed. */
export function computeIndicatorType(params: IndicatorTypeParams): StepState {
  const displayDefault = params.displayDefaultIndicatorType ?? true;
  const defaultState = params.defaultState ?? STEP_STATE.NUMBER;

  if (params.showError && params.hasError && !params.selected) {
    return STEP_STATE.ERROR;
  }

  if (displayDefault) {
    if (!params.completed || params.selected) {
      return STEP_STATE.NUMBER;
    }
    return params.editable ? STEP_STATE.EDIT : STEP_STATE.DONE;
  }

  if (params.completed && !params.selected) {
    return STEP_STATE.DONE;
  } else if (params.completed && params.selected) {
    return defaultState;
  }
  return params.editable && params.selected ? STEP_STATE.EDIT : defaultState;
}

// ─────────────────────────────────────────────────────────────────────────
// animation direction (CdkStepper._getAnimationDirection)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Mirrors `CdkStepper._getAnimationDirection()`. `rtl` defaults to `false` —
 * this port is LTR-only, same documented scope cut as every other
 * qwik-material keyboard/layout helper (see tabs'
 * `tab-group-keyboard.ts`/expansion's `accordion-keyboard.ts`); kept as a
 * parameter rather than hardcoded so the rule itself stays documented and
 * testable.
 */
export function getAnimationDirection(
  index: number,
  selectedIndex: number,
  rtl = false,
): StepContentPositionState {
  const position = index - selectedIndex;
  if (position < 0) {
    return rtl ? 'next' : 'previous';
  } else if (position > 0) {
    return rtl ? 'previous' : 'next';
  }
  return 'current';
}

// ─────────────────────────────────────────────────────────────────────────
// linear gating (CdkStepper._anyControlsInvalidOrPending + the selectedIndex
// setter's forward/backward check)
// ─────────────────────────────────────────────────────────────────────────

export interface LinearGateStep {
  /** Whether the user has attempted to move away from this step. */
  interacted: boolean;
  optional: boolean;
  /** Consumer-set `completed` override — `null`/`undefined` means none. */
  completedOverride?: boolean | null;
  /** Precomputed `computeCompleted()` result — only consulted when the step
   *  has no `stepControl` (`controlValid === undefined`). */
  completed: boolean;
  /** `stepControl.valid`, or `undefined` when the step has no control. */
  controlValid?: boolean;
  /** `stepControl.pending`. */
  controlPending?: boolean;
}

/** Mirrors the per-step predicate inside `_anyControlsInvalidOrPending`. */
export function isStepIncompleteForLinearGate(step: LinearGateStep): boolean {
  const hasControl = step.controlValid !== undefined;
  const isIncomplete = hasControl
    ? !step.controlValid || !!step.controlPending || !step.interacted
    : !step.completed;
  return isIncomplete && !step.optional && step.completedOverride == null;
}

/** Mirrors `CdkStepper._anyControlsInvalidOrPending()`. */
export function anyControlsInvalidOrPending(
  steps: readonly LinearGateStep[],
  linear: boolean,
  targetIndex: number,
): boolean {
  if (!linear || targetIndex < 0) return false;
  return steps.slice(0, targetIndex).some(isStepIncompleteForLinearGate);
}

export interface CanMoveToIndexParams {
  targetIndex: number;
  currentIndex: number;
  /** Whether the TARGET step is editable — only consulted for a backward
   *  move (mirrors `steps[index].editable` in the setter's forward/backward
   *  check). */
  targetEditable: boolean;
  steps: readonly LinearGateStep[];
  linear: boolean;
}

/**
 * Mirrors the gating half of `CdkStepper`'s `selectedIndex` setter: `!this
 * ._anyControlsInvalidOrPending(index) && (index >= this.selectedIndex ||
 * this.steps.toArray()[index].editable)`. Does NOT include the setter's
 * outer `index !== this.selectedIndex` / `_markAsInteracted()` steps — those
 * are call-site concerns (see `qwik-material/stepper/mat-stepper.tsx`'s
 * `trySelectIndex$`), since marking interacted is a side effect that always
 * happens even when this gate then returns `false`.
 */
export function canMoveToIndex(params: CanMoveToIndexParams): boolean {
  if (anyControlsInvalidOrPending(params.steps, params.linear, params.targetIndex)) {
    return false;
  }
  return params.targetIndex >= params.currentIndex || params.targetEditable;
}
