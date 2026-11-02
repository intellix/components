import {describe, expect, it} from 'vitest';
import {
  anyControlsInvalidOrPending,
  canMoveToIndex,
  computeCompleted,
  computeHasError,
  computeIndicatorType,
  getAnimationDirection,
  isNavigable,
  isStepIncompleteForLinearGate,
  shouldShowError,
  type LinearGateStep,
} from './step-logic';

describe('computeCompleted', () => {
  it('returns the override when set, regardless of interacted/control', () => {
    expect(computeCompleted({interacted: false, completedOverride: true})).toBe(true);
    expect(
      computeCompleted({interacted: true, controlValid: false, completedOverride: false}),
    ).toBe(false);
  });

  it('without a control, mirrors `interacted` alone', () => {
    expect(computeCompleted({interacted: false})).toBe(false);
    expect(computeCompleted({interacted: true})).toBe(true);
  });

  it('with a control, requires interacted AND valid', () => {
    expect(computeCompleted({interacted: true, controlValid: true})).toBe(true);
    expect(computeCompleted({interacted: true, controlValid: false})).toBe(false);
    expect(computeCompleted({interacted: false, controlValid: true})).toBe(false);
  });
});

describe('computeHasError', () => {
  it('returns the override when set', () => {
    expect(computeHasError({interacted: false, hasErrorOverride: true})).toBe(true);
    expect(computeHasError({interacted: true, controlInvalid: true, hasErrorOverride: false})).toBe(
      false,
    );
  });

  it('without a control, is always false (undefined controlInvalid)', () => {
    expect(computeHasError({interacted: true})).toBe(false);
  });

  it('with a control, requires interacted AND invalid', () => {
    expect(computeHasError({interacted: true, controlInvalid: true})).toBe(true);
    expect(computeHasError({interacted: false, controlInvalid: true})).toBe(false);
    expect(computeHasError({interacted: true, controlInvalid: false})).toBe(false);
  });
});

describe('shouldShowError', () => {
  it('global option wins when set', () => {
    expect(shouldShowError(true, null)).toBe(true);
    expect(shouldShowError(false, true)).toBe(false);
  });

  it('falls back to whether a per-step override is set at all', () => {
    expect(shouldShowError(undefined, null)).toBe(false);
    expect(shouldShowError(undefined, undefined)).toBe(false);
    expect(shouldShowError(undefined, true)).toBe(true);
    expect(shouldShowError(undefined, false)).toBe(true);
  });
});

describe('isNavigable', () => {
  it('completed or selected steps are always navigable', () => {
    expect(isNavigable(true, false, true)).toBe(true);
    expect(isNavigable(false, true, true)).toBe(true);
  });

  it('a non-linear stepper makes every step navigable', () => {
    expect(isNavigable(false, false, false)).toBe(true);
  });

  it('a linear stepper blocks an incomplete, unselected step', () => {
    expect(isNavigable(false, false, true)).toBe(false);
  });
});

describe('computeIndicatorType', () => {
  it('error wins over everything else when shown and unselected', () => {
    expect(
      computeIndicatorType({
        selected: false,
        completed: true,
        editable: true,
        showError: true,
        hasError: true,
      }),
    ).toBe('error');
  });

  it('error never shows while selected', () => {
    expect(
      computeIndicatorType({
        selected: true,
        completed: false,
        editable: true,
        showError: true,
        hasError: true,
      }),
    ).toBe('number');
  });

  it('default indicator type: selected or incomplete is always "number"', () => {
    expect(
      computeIndicatorType({
        selected: true,
        completed: true,
        editable: false,
        showError: false,
        hasError: false,
      }),
    ).toBe('number');
    expect(
      computeIndicatorType({
        selected: false,
        completed: false,
        editable: false,
        showError: false,
        hasError: false,
      }),
    ).toBe('number');
  });

  it('default indicator type: completed+unselected is "edit" when editable, else "done"', () => {
    expect(
      computeIndicatorType({
        selected: false,
        completed: true,
        editable: true,
        showError: false,
        hasError: false,
      }),
    ).toBe('edit');
    expect(
      computeIndicatorType({
        selected: false,
        completed: true,
        editable: false,
        showError: false,
        hasError: false,
      }),
    ).toBe('done');
  });

  it('non-default indicator type branch falls back to the custom state', () => {
    expect(
      computeIndicatorType({
        selected: true,
        completed: true,
        editable: true,
        showError: false,
        hasError: false,
        displayDefaultIndicatorType: false,
        defaultState: 'custom',
      }),
    ).toBe('custom');
    expect(
      computeIndicatorType({
        selected: false,
        completed: true,
        editable: true,
        showError: false,
        hasError: false,
        displayDefaultIndicatorType: false,
      }),
    ).toBe('done');
    expect(
      computeIndicatorType({
        selected: true,
        completed: false,
        editable: true,
        showError: false,
        hasError: false,
        displayDefaultIndicatorType: false,
        defaultState: 'custom',
      }),
    ).toBe('edit');
  });
});

describe('getAnimationDirection', () => {
  it('is sign-based, not distance-based (LTR)', () => {
    expect(getAnimationDirection(0, 2)).toBe('previous');
    expect(getAnimationDirection(1, 2)).toBe('previous');
    expect(getAnimationDirection(2, 2)).toBe('current');
    expect(getAnimationDirection(3, 2)).toBe('next');
  });

  it('flips previous/next for rtl', () => {
    expect(getAnimationDirection(0, 1, true)).toBe('next');
    expect(getAnimationDirection(2, 1, true)).toBe('previous');
  });
});

describe('isStepIncompleteForLinearGate / anyControlsInvalidOrPending', () => {
  const step = (overrides: Partial<LinearGateStep> = {}): LinearGateStep => ({
    interacted: false,
    optional: false,
    completed: false,
    ...overrides,
  });

  it('a step with no control is incomplete unless `completed`', () => {
    expect(isStepIncompleteForLinearGate(step({completed: false}))).toBe(true);
    expect(isStepIncompleteForLinearGate(step({completed: true}))).toBe(false);
  });

  it('a step with a control ignores `completed` and checks the control + interacted', () => {
    expect(isStepIncompleteForLinearGate(step({controlValid: true, interacted: true}))).toBe(false);
    expect(isStepIncompleteForLinearGate(step({controlValid: false, interacted: true}))).toBe(true);
    expect(
      isStepIncompleteForLinearGate(
        step({controlValid: true, controlPending: true, interacted: true}),
      ),
    ).toBe(true);
    expect(isStepIncompleteForLinearGate(step({controlValid: true, interacted: false}))).toBe(true);
  });

  it('optional and completedOverride both suppress incompleteness', () => {
    expect(isStepIncompleteForLinearGate(step({completed: false, optional: true}))).toBe(false);
    expect(isStepIncompleteForLinearGate(step({completed: false, completedOverride: false}))).toBe(
      false,
    );
  });

  it('anyControlsInvalidOrPending is false outright when not linear', () => {
    expect(anyControlsInvalidOrPending([step({completed: false})], false, 1)).toBe(false);
  });

  it('anyControlsInvalidOrPending only looks at steps before targetIndex', () => {
    const steps = [step({completed: false}), step({completed: true})];
    expect(anyControlsInvalidOrPending(steps, true, 1)).toBe(true);
    expect(anyControlsInvalidOrPending(steps, true, 0)).toBe(false);
  });
});

describe('canMoveToIndex', () => {
  const okStep = {interacted: true, optional: false, completed: true};

  it('a forward move is always allowed when nothing is incomplete', () => {
    expect(
      canMoveToIndex({
        targetIndex: 1,
        currentIndex: 0,
        targetEditable: true,
        steps: [okStep],
        linear: false,
      }),
    ).toBe(true);
  });

  it('a backward move is blocked when the target step is not editable', () => {
    expect(
      canMoveToIndex({
        targetIndex: 0,
        currentIndex: 2,
        targetEditable: false,
        steps: [okStep, okStep],
        linear: false,
      }),
    ).toBe(false);
    expect(
      canMoveToIndex({
        targetIndex: 0,
        currentIndex: 2,
        targetEditable: true,
        steps: [okStep, okStep],
        linear: false,
      }),
    ).toBe(true);
  });

  it('a linear stepper blocks a forward move past an incomplete step', () => {
    const steps: LinearGateStep[] = [{interacted: false, optional: false, completed: false}];
    expect(
      canMoveToIndex({targetIndex: 1, currentIndex: 0, targetEditable: true, steps, linear: true}),
    ).toBe(false);
  });
});
