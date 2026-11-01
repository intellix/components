import {
  $,
  component$,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  type JSXOutput,
  type QRL,
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
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
  /** `MatStepper.disableRipple`. Threaded to every step header's
   *  `[matRippleDisabled]` (`mat-step-header.tsx`). */
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

  // Plain derived arrays used by `renderHeader` below, for THIS render only
  // (never captured into a `$()` scope — see `trySelectIndex$`'s own doc
  // comment for why that QRL instead reads `props.steps` live).
  const editableFlags = steps.map(s => s.editable ?? true);
  const optionalFlags = steps.map(s => !!s.optional);
  const completedOverrides = steps.map(s => s.completed ?? null);
  const controlValids = steps.map(s => s.stepControl?.valid);

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

  /** `step.isNavigable()` for step `i`, for THIS render — reused by
   *  `ariaDisabledQuirk` below and `renderHeader`. */
  function computeNavigableForStep(i: number): boolean {
    const completed = computeCompleted({
      interacted: interactedStore[i],
      controlValid: controlValids[i],
      completedOverride: completedOverrides[i],
    });
    return isNavigable(completed, selectedIndex === i, linear);
  }

  // Replicates the `aria-disabled` two-`[attr.]`-binding Angular quirk —
  // see `mat-step-header.tsx`'s `ariaDisabled` prop doc comment for the
  // full explanation (confirmed live: a vertical, non-linear header that
  // transitions from unselected to selected gets `aria-disabled="true"`
  // STUCK on it, because `isNavigable()` never itself changes value in
  // that case, so the binding that would clear it never re-fires). Tracks
  // each binding's own last-fired value, exactly like Angular's per-
  // binding change memoization, and only updates `value[i]` when ONE of
  // them actually changes — binding2 (`isNavigable`) applied after
  // binding1 (`vertical && selected`) when both change in the same render,
  // matching their declaration order in `stepper.html`.
  const ariaDisabledQuirk = useStore<{
    b1: Array<'true' | null>;
    b2: Array<'true' | null>;
    value: Array<'true' | undefined>;
  }>(() => {
    const b1: Array<'true' | null> = [];
    const b2: Array<'true' | null> = [];
    const value: Array<'true' | undefined> = [];
    for (let i = 0; i < stepCount; i++) {
      const bind1 = vertical && selectedIndex === i ? 'true' : null;
      const bind2 = computeNavigableForStep(i) ? null : 'true';
      b1.push(bind1);
      b2.push(bind2);
      // Both bindings fire on the very first render (no previous value to
      // diff against) — binding2, declared later in the template, wins.
      value.push(bind2 ?? undefined);
    }
    return {b1, b2, value};
  });
  for (let i = 0; i < stepCount; i++) {
    const bind1 = vertical && selectedIndex === i ? 'true' : null;
    const bind2 = computeNavigableForStep(i) ? null : 'true';
    if (bind1 !== ariaDisabledQuirk.b1[i]) {
      ariaDisabledQuirk.b1[i] = bind1;
      ariaDisabledQuirk.value[i] = bind1 ?? undefined;
    }
    if (bind2 !== ariaDisabledQuirk.b2[i]) {
      ariaDisabledQuirk.b2[i] = bind2;
      ariaDisabledQuirk.value[i] = bind2 ?? undefined;
    }
  }

  // Roving-tabindex focus tracking (`CdkStepper._getFocusIndex()` /
  // `FocusKeyManager.activeItemIndex`). `null` until a keyboard/selection
  // interaction explicitly moves it, falling back to `selectedIndex` — same
  // convention as `qwik-material/tabs`' `focusIndex`.
  const focusIndexSig = useSignal<number | null>(null);

  // Mirrors `FocusKeyManager._origin` (`src/cdk/a11y/key-manager/
  // focus-key-manager.ts`): defaults to `'program'`, and becomes `'keyboard'`
  // PERMANENTLY — a one-way latch, never reset back — the first time
  // `CdkStepper._onKeydown`'s arrow/Home/End branch calls
  // `manager.setFocusOrigin('keyboard')`. `setActiveItem()` always calls
  // `.focus(this._origin)` on the newly-active header on EVERY successful
  // selection change (click, button, or Enter/Space alike) — a real,
  // explicit `FocusMonitor.focusVia()` call that overrides whatever origin
  // the underlying click/native-focus event would otherwise have been
  // classified as. Confirmed live: a plain, "cold" click with NO prior
  // keyboard interaction in the session gives the newly-selected header
  // `cdk-program-focused` (NOT `cdk-mouse-focused`, despite being a real
  // mouse click) — and once ANY arrow-key press has happened, EVERY later
  // successful click/button selection gives `cdk-keyboard-focused` instead,
  // forever, regardless of input device. This only applies to a
  // header that BECOMES selected (`trySelectIndex$`'s success path below);
  // a BLOCKED click (gating fails, `setActiveItem` never runs) still gets
  // its focus classes from the ordinary `useFocusOrigin()` pointerdown
  // heuristic — confirmed by angular-parity.spec.ts note 8 (`editable-false`).
  const keyboardOriginSig = useSignal<'program' | 'keyboard'>('program');

  const animDuration = animationsDisabled.value
    ? '0ms'
    : props.animationDuration != null
      ? normalizeDuration(props.animationDuration)
      : vertical
        ? '225ms'
        : '500ms';

  const isAnimating = useSignal(false);
  const animationsEnabledClass = useSignal(false);

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
        hostEl.classList.remove('mat-stepper-animating');
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
   *
   * Reads `props.steps`/`props.linear`/`props.selectedIndex` LIVE (property
   * access on the `props` store, at call time) rather than through the
   * `editableFlags`/`controlValids`/… snapshots computed for THIS render's
   * `renderHeader` calls — deliberately, so this QRL's gating decision is
   * always correct even when CALLED from a closure captured on an EARLIER
   * render. That matters here specifically: `MatStepperNext`/
   * `MatStepperPrevious` (see `stepper-buttons.tsx`) are leaf components
   * rendered inside a step's `content`, with no props of their own that
   * ever change — Qwik has no reason to re-render them when an ANCESTOR's
   * provided `MAT_STEPPER_ACTIONS` context value changes, so their
   * `useContext()` call can keep returning an `{next$, previous$}` pair
   * captured from an OLD render (confirmed live: a `matStepperNext` click
   * right after `stepControl` flips valid, before any OTHER re-render,
   * invoked a stale `next$` whose own closure's captured validity snapshot
   * was pre-fill). Since `props` itself is the SAME live store across
   * renders (reading a field on it is never stale), and `trySelectIndex$`
   * is itself just called (not re-executed) by `next$`/`previous$`, every
   * value this function touches must come from `props` (or a `useStore`/
   * `useSignal`) directly — never a plain local computed earlier in render.
   */
  const trySelectIndex$ = $((targetIndex: number) => {
    const liveSteps = props.steps;
    const count = liveSteps.length;
    if (targetIndex < 0 || targetIndex >= count) return;
    const current = clampIndex(props.selectedIndex, count);
    if (targetIndex === current) return;

    interactedStore[current] = true;

    const isLinear = props.linear ?? false;
    const gateSteps: LinearGateStep[] = liveSteps.map((s, i) => {
      const controlValid = s.stepControl?.valid;
      const completedOverride = s.completed ?? null;
      return {
        interacted: interactedStore[i],
        optional: !!s.optional,
        completedOverride,
        completed: computeCompleted({
          interacted: interactedStore[i],
          controlValid,
          completedOverride,
        }),
        controlValid,
        controlPending: s.stepControl?.pending,
      };
    });

    const canMove = canMoveToIndex({
      targetIndex,
      currentIndex: current,
      targetEditable: liveSteps[targetIndex]?.editable ?? true,
      steps: gateSteps,
      linear: isLinear,
    });
    if (!canMove) return;

    focusIndexSig.value = targetIndex;

    // Toggle the transient animating class SYNCHRONOUSLY, in the same tick
    // as the selection decision — mirrors upstream's `_isAnimating.set
    // (true)`, which fires in the same change-detection cycle as
    // `selectionChange`, not after an async round-trip through the
    // consumer's controlled prop. Setting it from a reactive task watching
    // `props.selectedIndex` instead (an earlier version of this code) raced
    // Playwright's settle-polling: the extra render hop (this call ->
    // `onSelectedIndexChange$` -> consumer state -> re-render -> task
    // fires) could land the class-add AFTER a poll had already found it
    // absent and resolved early — confirmed live.
    //
    // ALSO mutate the host's classList directly, synchronously, right
    // here — not just the `isAnimating` signal (which still drives the
    // class on every regular/SSR render). Even setting the signal
    // synchronously, Qwik's own re-render flush is scheduled (a
    // microtask/rAF hop), which isn't guaranteed to land before a test
    // harness's `page.waitForFunction` takes its FIRST poll right after
    // `.click()` resolves — confirmed live as an intermittent (not
    // deterministic) race. A direct `classList.add()` makes the class
    // appear in the exact same synchronous turn as the click/keydown
    // handler, with no scheduling gap at all.
    if (animDuration !== '0ms' && animDuration !== '0s') {
      isAnimating.value = true;
      if (isBrowser) hostRef.value?.classList.add('mat-stepper-animating');
    }

    if (isBrowser) {
      const hostEl = hostRef.value;
      const active = document.activeElement;
      if (hostEl && active && hostEl.contains(active)) {
        const headerEls = hostEl.querySelectorAll<HTMLElement>('.mat-step-header');
        const target = headerEls[targetIndex];
        // Mirrors `FocusKeyManager.setActiveItem()`'s `this.activeItem.focus
        // (this._origin)` — see `keyboardOriginSig`'s doc comment above.
        if (target) focusVia(target, keyboardOriginSig.value);
      }
    }

    props.onSelectedIndexChange$?.(targetIndex);
    props.onSelectionChange$?.({selectedIndex: targetIndex, previouslySelectedIndex: current});
  });

  useContextProvider(MAT_STEPPER_ACTIONS, {
    next$: $(() => {
      const count = props.steps.length;
      const current = clampIndex(props.selectedIndex, count);
      trySelectIndex$(Math.min(current + 1, count - 1));
    }),
    previous$: $(() => {
      const count = props.steps.length;
      const current = clampIndex(props.selectedIndex, count);
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

    // Mirrors `CdkStepper._onKeydown`'s `else` branch: `manager
    // ?.setFocusOrigin('keyboard').onKeydown(event)` runs for ANY key that
    // isn't an unmodified Enter/Space, unconditionally — latching
    // `keyboardOriginSig` to 'keyboard' even for a key the key manager
    // itself ends up doing nothing with (see that signal's doc comment).
    keyboardOriginSig.value = 'keyboard';

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

  // IMPORTANT: every value below that depends on "is step i selected" is
  // computed FRESH, inline, right where it's passed as a JSX prop — NOT
  // hoisted into a shared array (e.g. `steps.map(i => ({selected: ...}))`)
  // and read back through `someArray[i].selected`. Empirically bisected
  // (see `qwik-material/tabs/mat-tab-body.tsx`'s identical doc comment,
  // itself quoting the same finding): in a `component$` instantiated from a
  // parent's `.map()` with a `key` — exactly `MatStepHeaderItem` below — a
  // boolean computed via a comparison and stored in a local (here: an
  // array built ahead of render) and THEN fed into a prop fails to update
  // on the client after the FIRST client-side prop change, even though the
  // identical comparison inlined directly at the call site updates
  // correctly. Confirmed live: `aria-selected`/icon state froze on the
  // initial render's values after the first `Enter`/click selection change
  // until this was inlined.
  const renderHeader = (i: number): JSXOutput => {
    const s = steps[i];
    const interacted = interactedStore[i];
    const hasErrorOverride = s.hasError ?? null;
    const completed = computeCompleted({
      interacted,
      controlValid: controlValids[i],
      completedOverride: completedOverrides[i],
    });
    const hasError = computeHasError({
      interacted,
      controlInvalid: s.stepControl?.invalid,
      hasErrorOverride,
    });
    const showError = shouldShowError(globalOptions.showError, hasErrorOverride);
    const indicatorType = computeIndicatorType({
      selected: selectedIndex === i,
      completed,
      editable: editableFlags[i],
      showError,
      hasError,
      displayDefaultIndicatorType: globalOptions.displayDefaultIndicatorType,
      defaultState: s.state,
    });
    return (
      <MatStepHeaderItem
        key={`header-${i}`}
        orientation={orientation}
        index={i}
        count={stepCount}
        id={`${groupId.value}-label-${i}`}
        contentId={`${groupId.value}-content-${i}`}
        selected={selectedIndex === i}
        active={isNavigable(completed, selectedIndex === i, linear)}
        ariaDisabled={ariaDisabledQuirk.value[i]}
        tabIndex={i === (focusIndexSig.value ?? selectedIndex) ? 0 : -1}
        state={indicatorType}
        label={s.label}
        labelTemplate={s.labelTemplate}
        optional={optionalFlags[i]}
        errorMessage={s.errorMessage}
        color={s.color || props.color}
        ariaLabel={s.ariaLabel}
        ariaLabelledby={s.ariaLabelledby}
        disableRipple={props.disableRipple ?? false}
        onHeaderClick$={onHeaderClick$}
      />
    );
  };

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
