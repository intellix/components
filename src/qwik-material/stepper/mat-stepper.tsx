import {
  $,
  component$,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
  type JSXOutput,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {focusVia, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  CDK_STEPPER_GLOBAL_OPTIONS,
  canMoveToIndex,
  computeCompleted,
  computeHasError,
  computeIndicatorType,
  computeNextStepFocusIndex,
  getAnimationDirection,
  isNavigable,
  shouldShowError,
  type LinearGateStep,
  type StepControl,
  type StepperNavKey,
  type StepperOptions,
  type StepperOrientation,
  type StepState,
} from '@angular-community/qwik-cdk/stepper';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatStepHeaderItem} from './mat-step-header';
import {MAT_STEPPER_ACTIONS} from './stepper-actions';

/**
 * Descriptor for one step — mirrors `CdkStep`/`MatStep`'s inputs
 * (`src/cdk/stepper/stepper.ts`, `src/material/stepper/stepper.ts`).
 * `MatStepper` takes an array of these rather than nested `<MatStep>`
 * children, for the identical reason `qwik-material/tabs`' `MatTabGroup`
 * takes a `tabs: MatTabDef[]` prop — see that component's doc comment. Same
 * "data-array API" shape, documented there as the migration-friendly,
 * SSR-correct choice for any component whose Angular original renders its
 * children TWICE into two different DOM subtrees (here: once as a header,
 * once as a body) via `@ContentChildren`.
 *
 * `content` is ALWAYS rendered, every step, regardless of selection — unlike
 * `MatTabDef.content`, which attaches/detaches lazily. Angular's own
 * stepper never detaches step content either (angular-parity.spec.ts note
 * 5: "Step content is never detached... only `[inert]` toggles" — there is
 * no `preserveContent`-style distinction for plain content), so there is
 * deliberately no lazy-attach gate here at all, and no `matStepContent`
 * equivalent (not exercised by any parity scenario; see SYNC.md).
 */
export interface MatStepDef {
  /** `CdkStep.label` — a plain string label (`_stringLabel()` branch). */
  label?: string;
  /** `<ng-template matStepLabel>` content (`MatStepLabel`/`_templateLabel()`
   *  branch) — takes priority over `label` when both are set, same as
   *  upstream's `step.stepLabel || step.label` binding. */
  labelTemplate?: JSXOutput;
  /** The step's body content (`ng-content`). Required — every step has one. */
  content: JSXOutput;
  /** `CdkStep.stepControl` — a duck-typed `AbstractControl` snapshot. See
   *  `step-control.ts` for a small convenience hook that produces one. */
  stepControl?: StepControl;
  /** `CdkStep.errorMessage`. */
  errorMessage?: string;
  /** `CdkStep['aria-label']`. */
  ariaLabel?: string;
  /** `CdkStep['aria-labelledby']` — ignored when `ariaLabel` is set. */
  ariaLabelledby?: string;
  /** `CdkStep.state` — a custom icon-state override. Rarely used; only
   *  consulted in the (also rarely used) `displayDefaultIndicatorType:
   *  false` branch. */
  state?: StepState;
  /** `CdkStep.editable`. Default true. */
  editable?: boolean;
  /** `CdkStep.optional`. Default false. */
  optional?: boolean;
  /** `CdkStep.completed` override. `undefined` means "use the computed
   *  value" (interacted + control validity). */
  completed?: boolean;
  /** `CdkStep.hasError` override. `undefined` means "use the computed
   *  value" (interacted + control invalidity). */
  hasError?: boolean;
  /** `MatStep.color` — falls back to the stepper's own `color`. */
  color?: 'primary' | 'accent' | 'warn';
}

export interface MatStepperProps {
  steps: MatStepDef[];
  /** `CdkStepper.orientation`. Default 'horizontal'. */
  orientation?: StepperOrientation;
  /** `CdkStepper.linear`. Default false. */
  linear?: boolean;
  /** The index of the selected step. Consumer owns the state (controlled
   *  component, same pattern as `MatTabGroup.selectedIndex`). Default 0. */
  selectedIndex?: number;
  /** Two-way-binding half of `[(selectedIndex)]`. */
  onSelectedIndexChange$?: QRL<(index: number) => void>;
  /** Mirrors `CdkStepper.selectionChange`. */
  onSelectionChange$?: QRL<
    (event: {selectedIndex: number; previouslySelectedIndex: number}) => void
  >;
  /** Mirrors `MatStepper.animationDone`. */
  onAnimationDone$?: QRL<() => void>;
  /** `MatStepper.labelPosition`. Only applies when horizontal. Default 'end'. */
  labelPosition?: 'bottom' | 'end';
  /** `MatStepper.headerPosition`. Only applies when horizontal. Default 'top'. */
  headerPosition?: 'top' | 'bottom';
  /** `MatStepper.disableRipple`. Accepted for API completeness; has no DOM
   *  effect since ripple interactivity itself is out of scope (design doc
   *  rule 6 — only the static ripple container is ported). */
  disableRipple?: boolean;
  /** M2-only theme color for every step, overridable per-step. Default 'primary'. */
  color?: 'primary' | 'accent' | 'warn';
  /** `MatStepper.animationDuration` (string|number, normalized to ms). */
  animationDuration?: string | number;
  'aria-label'?: string;
  class?: string | ReadonlyArray<string>;
  /** Plain CSS text, same as a native `style` attribute (e.g. `"width: 480px"`). */
  style?: string;
  id?: string;
}

const GLOBAL_OPTIONS_DEFAULTS: StepperOptions = {};

function clampIndex(index: number | undefined, length: number): number {
  if (length <= 0) return 0;
  return Math.min(length - 1, Math.max(index ?? 0, 0));
}

function normalizeDuration(value: string | number): string {
  const str = `${value}`;
  return /^\d+$/.test(str) ? `${value}ms` : str;
}

/**
 * Qwik port of `MatStepper` + `MatStep` + `MatStepHeader` + `CdkStepper` +
 * `CdkStep` combined into one component — upstream splits these into
 * separate `@Component`/base classes, but nothing in the public API or DOM
 * contract requires that split here (same reasoning as `MatTabGroup`
 * folding in `MatTabHeader`/`MatPaginatedTabHeader`).
 */
export const MatStepper = component$<MatStepperProps>(props => {
  const idGen = useIdGenerator();
  const groupId = useSignal(() => idGen.getId('cdk-stepper-'));
  const animationsDisabled = useAnimationsDisabled();
  const globalOptions = useContext(CDK_STEPPER_GLOBAL_OPTIONS, GLOBAL_OPTIONS_DEFAULTS);

  const steps = props.steps;
  const stepCount = steps.length;
  const orientation: StepperOrientation = props.orientation ?? 'horizontal';
  const vertical = orientation === 'vertical';
  const linear = props.linear ?? false;
  const selectedIndex = clampIndex(props.selectedIndex, stepCount);
  const labelPosition = props.labelPosition ?? 'end';
  const headerPosition = props.headerPosition ?? 'top';

  const hostRef = useSignal<HTMLElement>();

  // Plain derived arrays — captured by `trySelectIndex$` below instead of
  // `steps` itself, so that QRL never has a live reference to any step's
  // `content`/`labelTemplate` `JSXOutput` in its captured scope (mirrors
  // `qwik-material/tabs/mat-tab-group.tsx`'s `disabledFlags`).
  const editableFlags = steps.map(s => s.editable ?? true);
  const optionalFlags = steps.map(s => !!s.optional);
  const completedOverrides = steps.map(s => s.completed ?? null);
  const controlValids = steps.map(s => s.stepControl?.valid);
  const controlPendings = steps.map(s => s.stepControl?.pending);

  // `interacted` is the one piece of genuinely internal, stepper-owned
  // mutable state (CdkStep's `_interacted` signal) — not controlled by the
  // consumer in any parity scenario. Mirrors `ngAfterViewInit`'s "mark
  // previous steps interacted" for an initial linear selectedIndex > 0.
  const interactedStore = useStore<boolean[]>(() => {
    const arr = new Array(stepCount).fill(false);
    if (linear && selectedIndex > 0) {
      for (let i = 0; i < selectedIndex; i++) arr[i] = true;
    }
    return arr;
  });

  // Roving-tabindex focus tracking (`CdkStepper._getFocusIndex()` /
  // `FocusKeyManager.activeItemIndex`). `null` until a keyboard/selection
  // interaction explicitly moves it, falling back to `selectedIndex` — same
  // convention as `qwik-material/tabs`' `focusIndex`.
  const focusIndexSig = useSignal<number | null>(null);

  const animDuration = animationsDisabled.value
    ? '0ms'
    : props.animationDuration != null
      ? normalizeDuration(props.animationDuration)
      : vertical
        ? '225ms'
        : '500ms';

  const isAnimating = useSignal(false);
  const animationsEnabledClass = useSignal(false);
  // Tracks the previously-seen (clamped) `selectedIndex` so the task below
  // can tell "the prop actually changed" from "this is the first run" —
  // both start equal, so the first (always-eager) task run is a no-op,
  // mirroring `selectedIndexChange` never firing at initial construction.
  const lastSelectedIndexForAnim = useSignal(selectedIndex);

  useTask$(({track}) => {
    const raw = track(() => props.selectedIndex);
    const clamped = clampIndex(raw, stepCount);
    if (clamped === lastSelectedIndexForAnim.value) return;
    lastSelectedIndexForAnim.value = clamped;
    if (animDuration !== '0ms' && animDuration !== '0s') {
      isAnimating.value = true;
    }
  });

  // `mat-stepper-animations-enabled` is added ~200ms after mount, once,
  // forever (when animations are enabled) — mirrors `ngAfterContentInit`'s
  // delayed `setTimeout`. Bundles the host's `transitionend` listener in the
  // same task (free, same exception) — mirrors `qwik-material/expansion/
  // mat-expansion-panel.tsx`'s identical, explicitly-sanctioned exception to
  // "no per-instance useVisibleTask$": there is no user interaction to
  // lazily hang either of these on, upstream flips/clears them
  // unconditionally after a delay/transition with zero clicks.
  useVisibleTask$(({cleanup}) => {
    if (!animationsDisabled.value) {
      const timer = setTimeout(() => {
        animationsEnabledClass.value = true;
      }, 200);
      cleanup(() => clearTimeout(timer));
    }

    const hostEl = hostRef.value;
    if (!hostEl) return;
    const onTransitionEnd = (event: TransitionEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isHorizontalActive =
        orientation === 'horizontal' &&
        event.propertyName === 'transform' &&
        target.classList.contains('mat-horizontal-stepper-content-current');
      const isVerticalActive =
        orientation === 'vertical' &&
        event.propertyName === 'grid-template-rows' &&
        target.classList.contains('mat-vertical-content-container-active');
      if (isHorizontalActive || isVerticalActive) {
        isAnimating.value = false;
        props.onAnimationDone$?.();
      }
    };
    hostEl.addEventListener('transitionend', onTransitionEnd);
    cleanup(() => hostEl.removeEventListener('transitionend', onTransitionEnd));
  });

  /**
   * Mirrors `CdkStepper`'s `selectedIndex` setter: mark the CURRENTLY
   * selected step interacted (but only if the target genuinely differs —
   * selecting the already-selected step is a complete no-op, not even
   * marking interacted), then gate the move. On success, move the roving
   * tabindex AND real DOM focus (if focus is currently inside the stepper —
   * `_containsFocus()`) to the new header, then notify the consumer.
   */
  const trySelectIndex$ = $((targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= stepCount) return;
    const current = clampIndex(props.selectedIndex, stepCount);
    if (targetIndex === current) return;

    interactedStore[current] = true;

    const gateSteps: LinearGateStep[] = editableFlags.map((_editable, i) => ({
      interacted: interactedStore[i],
      optional: optionalFlags[i],
      completedOverride: completedOverrides[i],
      completed: computeCompleted({
        interacted: interactedStore[i],
        controlValid: controlValids[i],
        completedOverride: completedOverrides[i],
      }),
      controlValid: controlValids[i],
      controlPending: controlPendings[i],
    }));

    const canMove = canMoveToIndex({
      targetIndex,
      currentIndex: current,
      targetEditable: editableFlags[targetIndex] ?? true,
      steps: gateSteps,
      linear,
    });
    if (!canMove) return;

    focusIndexSig.value = targetIndex;

    if (isBrowser) {
      const hostEl = hostRef.value;
      const active = document.activeElement;
      if (hostEl && active && hostEl.contains(active)) {
        const headerEls = hostEl.querySelectorAll<HTMLElement>('.mat-step-header');
        headerEls[targetIndex]?.focus();
      }
    }

    props.onSelectedIndexChange$?.(targetIndex);
    props.onSelectionChange$?.({selectedIndex: targetIndex, previouslySelectedIndex: current});
  });

  useContextProvider(MAT_STEPPER_ACTIONS, {
    next$: $(() => {
      const current = clampIndex(props.selectedIndex, stepCount);
      trySelectIndex$(Math.min(current + 1, stepCount - 1));
    }),
    previous$: $(() => {
      const current = clampIndex(props.selectedIndex, stepCount);
      trySelectIndex$(Math.max(current - 1, 0));
    }),
  });

  const onHeaderClick$ = $((index: number) => trySelectIndex$(index));

  /**
   * Mirrors `CdkStepper._onKeydown`, attached once at a shared ancestor
   * instead of per-header (bubbling) — but ONLY acts when the event
   * originated from within a `.mat-step-header`, so it stays behaviorally
   * equivalent to upstream's per-header `(keydown)` binding (a keydown from
   * a `matStepperNext` button inside step content never reaches it either).
   */
  const onKeyDown$ = $((event: KeyboardEvent) => {
    const origin = event.target as HTMLElement | null;
    if (!origin?.closest?.('.mat-step-header')) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;

    if (event.key === 'Enter' || event.key === ' ') {
      const fi = focusIndexSig.value;
      if (fi != null) {
        event.preventDefault();
        trySelectIndex$(fi);
      }
      return;
    }

    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }
    const current = focusIndexSig.value ?? selectedIndex;
    const next = computeNextStepFocusIndex(
      event.key as StepperNavKey,
      stepCount,
      current,
      vertical,
    );
    if (next === null) return;
    event.preventDefault();
    focusIndexSig.value = next;
    const headerEls = hostRef.value?.querySelectorAll<HTMLElement>('.mat-step-header');
    const target = headerEls?.[next];
    if (target) focusVia(target, 'keyboard');
  });

  // Per-step runtime values for THIS render only — never captured by a
  // `$()` scope above, so reading `.content`/`.labelTemplate` here is fine.
  const stepRuntime = steps.map((s, i) => {
    const interacted = interactedStore[i];
    const controlValid = controlValids[i];
    const controlInvalid = s.stepControl?.invalid;
    const completedOverride = completedOverrides[i];
    const hasErrorOverride = s.hasError ?? null;
    const completed = computeCompleted({interacted, controlValid, completedOverride});
    const hasError = computeHasError({interacted, controlInvalid, hasErrorOverride});
    const selected = selectedIndex === i;
    const showError = shouldShowError(globalOptions.showError, hasErrorOverride);
    const indicatorType = computeIndicatorType({
      selected,
      completed,
      editable: editableFlags[i],
      showError,
      hasError,
      displayDefaultIndicatorType: globalOptions.displayDefaultIndicatorType,
      defaultState: s.state,
    });
    return {
      selected,
      completed,
      indicatorType,
      navigable: isNavigable(completed, selected, linear),
    };
  });

  const renderHeader = (i: number): JSXOutput => (
    <MatStepHeaderItem
      key={`header-${i}`}
      orientation={orientation}
      index={i}
      count={stepCount}
      id={`${groupId.value}-label-${i}`}
      contentId={`${groupId.value}-content-${i}`}
      selected={stepRuntime[i].selected}
      active={stepRuntime[i].navigable}
      tabIndex={i === (focusIndexSig.value ?? selectedIndex) ? 0 : -1}
      state={stepRuntime[i].indicatorType}
      label={steps[i].label}
      labelTemplate={steps[i].labelTemplate}
      optional={optionalFlags[i]}
      errorMessage={steps[i].errorMessage}
      color={steps[i].color || props.color}
      ariaLabel={steps[i].ariaLabel}
      ariaLabelledby={steps[i].ariaLabelledby}
      onHeaderClick$={onHeaderClick$}
    />
  );

  const hostClasses = [
    vertical ? 'mat-stepper-vertical' : 'mat-stepper-horizontal',
    !vertical && labelPosition === 'end' && 'mat-stepper-label-position-end',
    !vertical && labelPosition === 'bottom' && 'mat-stepper-label-position-bottom',
    headerPosition === 'bottom' && 'mat-stepper-header-position-bottom',
    isAnimating.value && 'mat-stepper-animating',
    animationsEnabledClass.value && 'mat-stepper-animations-enabled',
    props.class,
  ].filter(Boolean) as string[];

  const hostStyle = [props.style, `--mat-stepper-animation-duration: ${animDuration}`]
    .filter(Boolean)
    .join('; ');

  let body: JSXOutput;
  if (vertical) {
    body = (
      <div class="mat-vertical-stepper-wrapper" onKeyDown$={onKeyDown$}>
        {steps.map((s, i) => {
          const isLast = i === stepCount - 1;
          return (
            <div key={`step-${i}`} class="mat-step">
              {renderHeader(i)}
              <div
                class={[
                  'mat-vertical-content-container',
                  !isLast && 'mat-stepper-vertical-line',
                  selectedIndex === i && 'mat-vertical-content-container-active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                inert={selectedIndex !== i || undefined}
                aria-label={props['aria-label'] || undefined}
              >
                <div
                  role="region"
                  class="mat-vertical-stepper-content"
                  id={`${groupId.value}-content-${i}`}
                  aria-labelledby={`${groupId.value}-label-${i}`}
                >
                  <div class="mat-vertical-content">{s.content}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  } else {
    const headerChildren: JSXOutput[] = [];
    for (let i = 0; i < stepCount; i++) {
      headerChildren.push(renderHeader(i));
      if (i < stepCount - 1) {
        headerChildren.push(<div key={`hline-${i}`} class="mat-stepper-horizontal-line" />);
      }
    }
    body = (
      <div class="mat-horizontal-stepper-wrapper">
        <div
          role="tablist"
          aria-orientation="horizontal"
          aria-label={props['aria-label'] || undefined}
          class="mat-horizontal-stepper-header-container"
          onKeyDown$={onKeyDown$}
        >
          {headerChildren}
        </div>
        <div class="mat-horizontal-content-container">
          {steps.map((s, i) => (
            <div
              key={`content-${i}`}
              role="tabpanel"
              id={`${groupId.value}-content-${i}`}
              aria-labelledby={`${groupId.value}-label-${i}`}
              class={[
                'mat-horizontal-stepper-content',
                `mat-horizontal-stepper-content-${getAnimationDirection(i, selectedIndex)}`,
              ].join(' ')}
              inert={selectedIndex !== i || undefined}
            >
              {s.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <mat-stepper ref={hostRef} id={props.id} class={hostClasses} style={hostStyle}>
      {body}
    </mat-stepper>
  );
});
