/**
 * MatStepper scenario port from src/material/stepper/stepper.spec.ts +
 * src/cdk/stepper/stepper.spec.ts.
 *
 * Upstream is almost entirely TestBed component-rendering + fakeAsync
 * timer-flushing (the ~200ms `mat-stepper-animations-enabled` delay,
 * CSS-transition-driven `animationDone`) and `@ContentChildren`/
 * `FocusKeyManager` interaction — this package's vitest can't reliably
 * render/interact with real DOM (`createDOM()` hangs; see
 * `qwik-material/expansion`'s own scenario-port comment for the same
 * finding, itself quoting button-toggle's). Restructured:
 *
 *   - Live sanity tests: typeof + context ids + prop shapes.
 *   - describe.skip DOM-rendered: structure, selection, keyboard nav,
 *     linear/editable gating, focus-origin classes — deferred to the
 *     Playwright specs below (verified via a real browser instead of
 *     vitest). The CDK-level pure logic these would otherwise exercise is
 *     unit-tested directly in `qwik-cdk/stepper/step-logic.spec.ts` and
 *     `stepper-keyboard.spec.ts` instead — no DOM needed for those.
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-stepper/angular-parity.spec.ts
 * (the authoritative Angular-vs-Qwik DOM diffing gate).
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_STEPPER_ACTIONS,
  MatStepper,
  MatStepperNext,
  MatStepperPrevious,
  useRequiredControl,
  type MatStepDef,
  type MatStepperProps,
} from './public-api';

describe('qwik-material/stepper surface — sanity', () => {
  it('every component is exported and function-shaped', () => {
    expect(typeof MatStepper).toBe('function');
    expect(typeof MatStepperNext).toBe('function');
    expect(typeof MatStepperPrevious).toBe('function');
    expect(typeof useRequiredControl).toBe('function');
  });

  it('MAT_STEPPER_ACTIONS carries the expected context id', () => {
    expect(MAT_STEPPER_ACTIONS.id).toBe('qwik-material/stepper-actions');
  });

  it('MatStepDef accepts the full surface', () => {
    const def: MatStepDef = {
      label: 'Step one',
      content: 'content',
      stepControl: {valid: true, invalid: false, pending: false},
      errorMessage: 'Required',
      ariaLabel: 'Step one',
      state: 'number',
      editable: true,
      optional: false,
      completed: false,
      hasError: false,
      color: 'primary',
    };
    expect(def.label).toBe('Step one');
  });

  it('MatStepperProps accepts the full surface, including the two-way-binding QRLs', () => {
    const props: MatStepperProps = {
      steps: [],
      orientation: 'vertical',
      linear: true,
      selectedIndex: 1,
      onSelectedIndexChange$: undefined,
      onSelectionChange$: undefined,
      onAnimationDone$: undefined,
      labelPosition: 'bottom',
      headerPosition: 'bottom',
      disableRipple: true,
      color: 'accent',
      animationDuration: '300ms',
      'aria-label': 'Checkout',
      class: 'my-stepper',
      id: 'checkout',
    };
    expect(props.orientation).toBe('vertical');
  });
});

describe.skip('MatStepper DOM-rendered scenarios — verified via Playwright', () => {
  it('Horizontal: header-container(role=tablist) + per-step header(role=tab) + content-container; one body per step, always attached, only [inert] toggles', () => {});
  it('Vertical: one .mat-step per step (header(role=button) + content-container with region), same always-attached/[inert] content contract', () => {});
  it('Clicking a header always attempts a real selection change; whether it succeeds is the linear/editable gate, independent of the clicked header gaining focus classes', () => {});
  it('ArrowLeft/ArrowRight move focus only (roving tabindex) in both orientations; ArrowUp/ArrowDown only in vertical; wraps on arrow keys, not Home/End', () => {});
  it('Enter/Space select the focused header only when it differs from the selected one', () => {});
  it('matStepperNext/matStepperPrevious reach the owning stepper via context and apply the same gating as a header click', () => {});
  it('A linear stepper blocks forward navigation past an incomplete required stepControl; marks the step interacted either way', () => {});
  it('editable:false blocks backward navigation into that step via header click or matStepperPrevious, but the clicked header still gains its own focus classes', () => {});
  it('Indicator icon state: number (selected/incomplete) -> edit (completed+editable) -> done (completed+not editable) -> error (showError+hasError+not selected)', () => {});
  it('mat-stepper-animations-enabled is added to every stepper ~200ms after mount; mat-stepper-animating toggles for the transition duration on every selection change', () => {});
});
