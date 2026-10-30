import {$, component$, Slot, useContext, useSignal, useTask$, type QRL} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatInternalFormField} from '../core/mat-internal-form-field';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {MAT_CHECKBOX_CONFIG, MAT_CHECKBOX_CONFIG_DEFAULTS} from './checkbox-config';

/** Payload passed to `onChange$` — mirrors upstream's `MatCheckboxChange.checked`. */
export interface MatCheckboxChangeEvent {
  checked: boolean;
}

/**
 * Props for <MatCheckbox>. Rendered as upstream's `checkbox.html` template
 * (mdc-checkbox structure) inside a shared `<MatInternalFormField>`. See
 * docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
 * and checkbox/SYNC.md for the full DOM/behavior contract.
 */
export interface MatCheckboxProps {
  /** Whether the checkbox is checked. Controlled-with-internal-fallback — see SYNC.md. */
  checked?: boolean;
  /**
   * Whether the checkbox is indeterminate ("mixed" mode). Clicking/Space always
   * clears it to false first (matching upstream's `clickAction !== 'check'` path).
   */
  indeterminate?: boolean;
  /** Whether the checkbox is disabled. */
  disabled?: boolean;
  /** Whether a disabled checkbox should remain interactive (focusable, clickable-but-inert). */
  disabledInteractive?: boolean;
  /** Whether the checkbox is required (reflected as the `required` attribute only — no forms validation). */
  required?: boolean;
  /** Position of the label relative to the checkbox. Default 'after'. */
  labelPosition?: 'before' | 'after';
  /** Name forwarded to the native input. */
  name?: string;
  /** Value forwarded to the native input's `value` attribute. */
  value?: string;
  /** Theme color. Supported in M2 themes only — matches upstream's note. Default 'accent'. */
  color?: string;
  /** Whether the checkbox has a ripple. Mirrors upstream's `disableRipple` — OR'd with `disabled`
   *  into the ripple's `matRippleDisabled`. */
  disableRipple?: boolean;
  /** Unique id. Auto-generated (`mat-mdc-checkbox-N`) when omitted. */
  id?: string;
  /** Tabindex for the (enabled) checkbox. Default 0. */
  tabIndex?: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-owns'?: string;
  /** Fires whenever `checked` changes as a result of user interaction. */
  onChange$?: QRL<(event: MatCheckboxChangeEvent) => void>;
  /** Fires whenever `indeterminate` is cleared as a result of user interaction. */
  onIndeterminateChange$?: QRL<(indeterminate: boolean) => void>;
  class?: string | ReadonlyArray<string>;
}

/**
 * Mirrors upstream's `TransitionCheckState` — the states `_transitionCheckState`
 * animates between. `'init'` is the state before any transition has ever been
 * computed for this instance (upstream: `ngAfterViewInit`'s `_syncIndeterminate`
 * call never itself calls `_transitionCheckState`, so a checkbox that starts
 * checked/indeterminate via props is STILL `Init` the first time the user
 * interacts with it — see angular-parity.spec.ts's header comment "Init-state
 * quirk").
 */
type CheckState = 'init' | 'unchecked' | 'checked' | 'indeterminate';

/** Mirrors upstream's `_animationClasses`. */
const ANIMATION_CLASSES = {
  uncheckedToChecked: 'mdc-checkbox--anim-unchecked-checked',
  uncheckedToIndeterminate: 'mdc-checkbox--anim-unchecked-indeterminate',
  checkedToUnchecked: 'mdc-checkbox--anim-checked-unchecked',
  checkedToIndeterminate: 'mdc-checkbox--anim-checked-indeterminate',
  indeterminateToChecked: 'mdc-checkbox--anim-indeterminate-checked',
  indeterminateToUnchecked: 'mdc-checkbox--anim-indeterminate-unchecked',
} as const;

/**
 * Mirrors upstream's `_getAnimationClassForCheckStateTransition`. `wasChecked`
 * is only consulted for the `Init` → `Indeterminate` edge (not reachable via
 * this port's click handler, which never targets `'indeterminate'` — see
 * SYNC.md — but kept for fidelity/future reactive-indeterminate support).
 */
function animationClassFor(
  oldState: CheckState,
  newState: 'checked' | 'unchecked' | 'indeterminate',
  wasChecked: boolean,
  animationsDisabled: boolean,
): string {
  if (animationsDisabled) return '';
  switch (oldState) {
    case 'init':
      if (newState === 'checked') return ANIMATION_CLASSES.uncheckedToChecked;
      if (newState === 'indeterminate') {
        return wasChecked
          ? ANIMATION_CLASSES.checkedToIndeterminate
          : ANIMATION_CLASSES.uncheckedToIndeterminate;
      }
      return '';
    case 'unchecked':
      return newState === 'checked'
        ? ANIMATION_CLASSES.uncheckedToChecked
        : ANIMATION_CLASSES.uncheckedToIndeterminate;
    case 'checked':
      return newState === 'unchecked'
        ? ANIMATION_CLASSES.checkedToUnchecked
        : ANIMATION_CLASSES.checkedToIndeterminate;
    case 'indeterminate':
      return newState === 'checked'
        ? ANIMATION_CLASSES.indeterminateToChecked
        : ANIMATION_CLASSES.indeterminateToUnchecked;
    default:
      return '';
  }
}

export const MatCheckbox = component$<MatCheckboxProps>(props => {
  const config = useContext(MAT_CHECKBOX_CONFIG, MAT_CHECKBOX_CONFIG_DEFAULTS);
  const animationsDisabled = useAnimationsDisabled();

  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's constructor-time
  // `this.id = this._uniqueId = inject(_IdGenerator).getId('mat-mdc-checkbox-')`.
  const autoId = useSignal(() => idGen.getId('mat-mdc-checkbox-'));
  const id = props.id ?? autoId.value;
  const inputId = `${id}-input`;

  const color = props.color ?? config.color ?? 'accent';
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const disabled = props.disabled ?? false;
  const required = props.required ?? false;
  const labelPosition = props.labelPosition ?? 'after';
  const tabIndexProp = props.tabIndex ?? 0;

  // Hybrid controlled/uncontrolled `checked`/`indeterminate` — mirrors
  // upstream's @Input setters, which ALWAYS write into the same internal
  // field the click handler also mutates: a parent re-providing a value
  // after an external change is just "another writer" of that field, not a
  // fundamentally different code path. See SYNC.md.
  const checked = useSignal(props.checked ?? false);
  const indeterminate = useSignal(props.indeterminate ?? false);
  useTask$(({track}) => {
    const next = track(() => props.checked);
    if (next !== undefined) checked.value = next;
  });
  useTask$(({track}) => {
    const next = track(() => props.indeterminate);
    if (next !== undefined) indeterminate.value = next;
  });

  // Per-instance transition state (never read by JSX directly) — mirrors
  // upstream's private `_currentCheckState` field. Must be a real signal (not
  // a closure-local variable) so it persists across separate QRL invocations
  // of the click handler.
  const currentCheckState = useSignal<CheckState>('init');
  // The transient `mdc-checkbox--anim-<from>-<to>` class. Modeled as a signal
  // (not a direct `classList.add`/`remove` on a captured element) so that
  // Qwik's own `class` prop diffing — which replaces `className` wholesale on
  // every render, not an additive classList diff — can never wipe it out
  // early if an unrelated render happens to land during its ~1s lifetime (see
  // qwik-material/button-toggle/mat-button-toggle.tsx's class-array comment
  // for the same reasoning).
  const transitionClass = useSignal('');

  const inputRef = useSignal<Element>();
  const rippleContainerRef = useSignal<HTMLElement>();

  // Upstream `checkbox.html`: `<div mat-ripple [matRippleTrigger]="checkbox"
  // [matRippleDisabled]="disableRipple || disabled" [matRippleCentered]="true">`
  // — the trigger is the `.mdc-checkbox` div (the ref below), NOT the ripple
  // container div itself. Reads `props.disableRipple`/`props.disabled` live
  // (not the outer-scope `disabled` const) for the same staleness reason
  // `handleInputClick$` above already documents for this file. ONE shared
  // `$()` reference wired to all six pointer events below — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  const rippleEvent$ = $((event: MouseEvent | TouchEvent) => {
    handleRippleEvent(event, rippleContainerRef.value, {
      rippleDisabled: !!(props.disableRipple || props.disabled),
      rippleConfig: {centered: true, animation: rippleAnimationConfig(animationsDisabled.value)},
    });
  });

  // `checked`/`indeterminate` are DOM PROPERTIES with no HTML attribute
  // reflection upstream ever relies on (`checked`'s content attribute
  // reflects `defaultChecked`, not the live value; `indeterminate` has no
  // content attribute at all) — see SYNC.md "checked/indeterminate SSR
  // limitation". Two problems ruled out a plain `checked={checked.value}`
  // JSX prop on the <input> below: (1) Qwik's SSR serializer has no "known
  // DOM property, not an attribute" allowlist the way its CSR diffing does —
  // a `true`-valued prop renders as a literal, PERMANENTLY LINGERING boolean
  // attribute Angular's own DOM never has, breaking the structural parity
  // diff outright; (2) gating that prop on a build-time `isBrowser` ternary
  // to dodge (1) instead broke CSR reactivity itself — confirmed empirically,
  // a click-driven `checked.value` flip stopped reaching the real DOM
  // property at all once wrapped in that ternary (Qwik's prop-diffing
  // optimizer appears to special-case/short-circuit a conditional-on-a-
  // non-signal expression differently from a bare signal read). Setting the
  // property imperatively via a ref, from a `useTask$` that tracks the
  // signal, sidesteps both: the SSR pass's execution targets the server's
  // mock element (no effect on the serialized HTML — no attribute, ever),
  // and the task only *loads and reruns* when the tracked signal actually
  // changes (e.g. after a click) — exactly as lazy as the JSX-prop approach
  // was meant to be, with none of its bugs. Cost (same as before): a
  // checkbox that starts checked/indeterminate and is never interacted with
  // won't show the native `:indeterminate` CSS pseudo-class styling until
  // first interaction (`checked` is also rendered as a JSX prop below for
  // first paint) — a visual-only gap, explicitly out of
  // scope per the remediation design doc ("computed-style / visual parity
  // ... out of scope"). The `mdc-checkbox--selected`/`mat-mdc-checkbox-checked`
  // classes and `aria-checked="mixed"` attribute (the parts of this state any
  // real consumer's attribute-reading code, or angular-parity.spec.ts, can
  // observe) are correct from the very first paint regardless.
  useTask$(({track}) => {
    const value = track(() => checked.value);
    const el = inputRef.value as HTMLInputElement | undefined;
    if (el) el.checked = value;
  });
  useTask$(({track}) => {
    const value = track(() => indeterminate.value);
    const el = inputRef.value as HTMLInputElement | undefined;
    if (el) el.indeterminate = value;
  });

  // Mirrors upstream's `_handleInputClick`. Called directly (not as a QRL
  // event prop) from both the native input's click and the touch-target's
  // click, matching upstream's `_onInputClick`/`_onTouchTargetClick` both
  // delegating to the same method.
  //
  // `disabled`/`disabledInteractive`/`clickAction` are re-read LIVE from
  // `props`/`config` here rather than closing over the outer-scope consts
  // computed above — those consts are fine for the RENDER body (which always
  // re-executes fresh), but this closure can be invoked again by a later
  // click without an intervening re-render of this component (e.g. two
  // clicks resolved back-to-back before Qwik re-renders), which would leave
  // a stale value if captured once. Matches the project's established
  // button-toggle precedent (`mat-button-toggle.tsx`'s `onClick$` re-reads
  // `stateSignal.value` for the same reason) and the sibling slide-toggle
  // port's "stale capture" finding (a click handler that captured
  // `checked`/`disabled` as outer-scope consts never saw a second click's
  // toggle take effect). `checked`/`indeterminate`/`currentCheckState`/
  // `transitionClass` are already real signals read via `.value`, which is
  // inherently live — no fix needed there.
  const handleInputClick$ = $(() => {
    const liveDisabled = props.disabled ?? false;
    const liveDisabledInteractive =
      props.disabledInteractive ?? config.disabledInteractive ?? false;
    const liveClickAction = config.clickAction ?? 'check-indeterminate';
    if (!liveDisabled && liveClickAction !== 'noop') {
      if (indeterminate.value && liveClickAction !== 'check') {
        indeterminate.value = false;
        props.onIndeterminateChange$?.(false);
      }
      const newChecked = !checked.value;
      const newState = newChecked ? 'checked' : 'unchecked';
      const animClass = animationClassFor(
        currentCheckState.value,
        newState,
        checked.value,
        animationsDisabled.value,
      );
      currentCheckState.value = newState;
      checked.value = newChecked;
      if (animClass) {
        transitionClass.value = animClass;
        setTimeout(() => {
          transitionClass.value = '';
        }, 1000);
      }
      props.onChange$?.({checked: newChecked});
    } else if (
      (liveDisabled && liveDisabledInteractive) ||
      (!liveDisabled && liveClickAction === 'noop')
    ) {
      // "Disabled but interactive" (or `clickAction: 'noop'`): the browser
      // already toggled the native input's `.checked` (and possibly
      // `.indeterminate`) property before this handler ran, since the
      // native `disabled` attribute isn't applied in this branch. Reset it
      // back to match the unchanged model — mirrors upstream exactly.
      const inputEl = inputRef.value as HTMLInputElement | undefined;
      if (inputEl) {
        inputEl.checked = checked.value;
        inputEl.indeterminate = indeterminate.value;
      }
    }
  });

  const onTouchTargetClick$ = $(async () => {
    await handleInputClick$();
    if (!(props.disabled ?? false)) {
      (inputRef.value as HTMLInputElement | undefined)?.focus();
    }
  });

  // Mirrors upstream's `_preventBubblingFromLabel` — stops a click that
  // originated on the <label/> from bubbling past this element, so the
  // label's forwarded native click on the <input/> (browser default
  // `for`/`id` behavior) never double-fires anything listening further up
  // the tree. Attached to the SAME div `_MatInternalFormField` renders,
  // exactly as upstream's template does (a component selector and a plain
  // event binding on one element).
  const onFormFieldClick$ = $((event: Event) => {
    const target = event.target as Element | null;
    if (target?.closest?.('label.mdc-label')) {
      event.stopPropagation();
    }
  });

  const hostClasses = [
    'mat-mdc-checkbox',
    `mat-${color}`,
    animationsDisabled.value && '_mat-animation-noopable',
    disabled && 'mdc-checkbox--disabled',
    disabled && 'mat-mdc-checkbox-disabled',
    checked.value && 'mat-mdc-checkbox-checked',
    disabledInteractive && 'mat-mdc-checkbox-disabled-interactive',
    props.class,
  ].filter(Boolean) as string[];

  const inputClasses = [
    'mdc-checkbox__native-control',
    checked.value && 'mdc-checkbox--selected',
    transitionClass.value,
  ].filter(Boolean) as string[];

  const ariaExpanded = props['aria-expanded'];

  return (
    <mat-checkbox id={id} class={hostClasses}>
      <MatInternalFormField labelPosition={labelPosition} onClick$={onFormFieldClick$}>
        <div
          class="mdc-checkbox"
          onMouseDown$={rippleEvent$}
          onMouseUp$={rippleEvent$}
          onMouseLeave$={rippleEvent$}
          onTouchStart$={rippleEvent$}
          onTouchEnd$={rippleEvent$}
          onTouchCancel$={rippleEvent$}
        >
          {/* Render this element first so the input is on top (matches upstream's comment). */}
          <div
            class="mat-mdc-checkbox-touch-target"
            aria-hidden="true"
            onClick$={onTouchTargetClick$}
          />
          <input
            ref={inputRef}
            type="checkbox"
            class={inputClasses}
            aria-label={props['aria-label'] || undefined}
            aria-labelledby={props['aria-labelledby']}
            aria-describedby={props['aria-describedby']}
            aria-checked={indeterminate.value ? 'mixed' : undefined}
            aria-controls={props['aria-controls']}
            aria-disabled={disabled && disabledInteractive ? 'true' : undefined}
            aria-expanded={ariaExpanded === undefined ? undefined : ariaExpanded ? 'true' : 'false'}
            aria-owns={props['aria-owns']}
            name={props.name ?? undefined}
            value={props.value}
            // Rendered so a pre-checked checkbox paints checked before JS
            // runs. SSR leaves a `checked` attribute that never updates
            // afterwards; the parity harness compares the live property
            // (README: "Checkbox/radio inputs are compared on their live
            // `.checked` state"). The useTask$ above keeps the property in
            // sync; `indeterminate` has no attribute and stays task-only.
            checked={checked.value}
            disabled={(disabled && !disabledInteractive) || undefined}
            id={inputId}
            required={required || undefined}
            tabIndex={disabled && !disabledInteractive ? -1 : tabIndexProp}
            onClick$={handleInputClick$}
          />
          <div class="mdc-checkbox__ripple" aria-hidden="true" />
          <div class="mdc-checkbox__background" aria-hidden="true">
            <svg class="mdc-checkbox__checkmark" focusable="false" viewBox="0 0 24 24">
              <path
                class="mdc-checkbox__checkmark-path"
                fill="none"
                d="M1.73,12.91 8.1,19.28 22.79,4.59"
              />
            </svg>
            <div class="mdc-checkbox__mixedmark" />
          </div>
          {/* `mat-ripple` mirrors Angular's bare `mat-ripple` directive-selector
              attribute (static, no value) left on the rendered DOM by
              upstream's OWN template — Material's own templates' selector
              attributes are reproduced, unlike consumer-written ones (see
              README's "static-attribute input echo" note). Real `.mat-ripple-element`
              spans are launched on `mousedown`/`touchstart` of the `.mdc-checkbox`
              trigger div above (`core/ripple/ripple-dom.ts`) — see checkbox/SYNC.md. */}
          <div
            ref={rippleContainerRef}
            {...{'mat-ripple': ''}}
            aria-hidden="true"
            class="mat-ripple mat-mdc-checkbox-ripple mat-focus-indicator"
          />
        </div>
        <label class="mdc-label" for={inputId}>
          <Slot />
        </label>
      </MatInternalFormField>
    </mat-checkbox>
  );
});
