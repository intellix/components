import {$, component$, useContext, useSignal, type QRL} from '@qwik.dev/core';
import {
  MAT_FORM_FIELD_CONNECTED_ORIGIN,
  MAT_FORM_FIELD_CONTROL_STATE,
  type MatFormFieldControlProps,
} from '../core/mat-form-field-control';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import {
  formatTimeForDisplay,
  handleTimepickerBlur,
  handleTimepickerInput,
  handleTimepickerInputKeydown,
  openTimepickerPanel,
} from './timepicker-runtime';
import type {MatTimepickerHandle} from './use-mat-timepicker';
import {useMatFormSubmitted} from '../core/mat-form';

type NativeInputElement = HTMLInputElement;

/**
 * Props for `<MatTimepickerInput>`. Mirrors upstream `MatTimepickerInput`
 * (`src/material/timepicker/timepicker-input.ts`) merged with `matInput`'s own control contract
 * — upstream applies BOTH directives to the same `<input matInput [matTimepicker]="picker">`
 * element; this port renders one component doing both jobs (see `timepicker/SYNC.md`'s
 * "architecture" section for why there's no separate `<MatInput>` wrapping involved).
 *
 * Extends {@link MatFormFieldControlProps} so `<MatFormField control={<MatTimepickerInput .../>}>`
 * can introspect this exact props shape at ITS OWN SSR render time (see
 * `core/mat-form-field-control.ts`). `controlType` is intentionally omitted — like `MatInput`,
 * it relies on `MatFormField`'s own `'mat-input'` fallback (upstream: the SAME `_uid`/`mat-input-N`
 * id and `mat-mdc-form-field-type-mat-input` class the plain `matInput` directive produces,
 * since `MatTimepickerInput` itself has no id/host-class concept of its own).
 *
 * `min`/`max`/`value` are NOT props here — they live on the shared `picker` handle
 * (`useMatTimepicker()`) instead. See that hook's module doc comment for the full "cross-sibling
 * render-order" rationale this avoids (`<MatTimepickerToggle>` needs the SAME disabled state,
 * and the two components are unrelated siblings from Qwik's point of view).
 *
 * `disabled` IS still a prop here (unlike `min`/`max`) — PASS THE SAME VALUE given to
 * `useMatTimepicker({disabled})`. This duplication is required, not optional: `MatFormField`
 * determines its own `disabled`/`mat-form-field-disabled` class and focus-overlay suppression by
 * reading this prop directly off the `<MatTimepickerInput>` JSX descriptor WITHOUT rendering it
 * (`readControlProps` — see `core/mat-form-field-control.ts`), which can only see a value the
 * consumer wrote as a literal, top-level prop — never `picker.disabled.value` read reactively
 * from inside this component's own render. The actual rendered `disabled` attribute/ARIA on the
 * `<input>` still comes from `picker.disabled.value` (the live source of truth, matching
 * `MatTimepickerToggle`'s own read) — this prop exists ONLY for `MatFormField`'s static read.
 *
 * `formBound` should be passed as literal `true` on every usage whose Angular counterpart
 * actually binds `[(ngModel)]`/`[formControl]`/`formControlName` — which, in this port, is every
 * PRE-EXISTING `MatTimepickerInput` call site (every `/qwik-parity/mat-timepicker/*` scenario
 * binds one of these). Angular's `NgControlStatus` directive (`[class.ng-untouched]`/
 * `[class.ng-pristine]`/`[class.ng-valid]`, read off `this._control.ngControl` by
 * `MatFormField`/matched here) activates ONLY when one of those three attribute selectors is
 * actually written in the template — confirmed live with BOTH shapes: present (giving these
 * classes) on every scenario that binds one, and genuinely ABSENT on `material.angular.dev`'s
 * own `timepicker-overview` docs example (`<input matInput [matTimepicker]="picker">`, no
 * ngModel/formControl at all). `formBound` (default `false`, matching `MatInput`'s own
 * convention) gates these three classes accordingly — omit it for a genuinely unbound usage like
 * that one.
 *
 * `value` is ALSO still a prop (a plain truthiness marker, not the real `Date` — which stays on
 * `picker.value`) — PASS `formatTimeForDisplay(picker.value.value) || undefined` (the exported
 * helper from `timepicker-runtime.ts`). Needed for the SAME static-read reason: `MatFormField`
 * computes its OWN first-render `empty`/`shouldLabelFloat` (hence the floating label's
 * `mdc-floating-label--float-above` class and the `mat-form-field-hide-placeholder` class) from
 * `!controlProps?.value` BEFORE this component ever runs — a write to the
 * `MAT_FORM_FIELD_CONTROL_STATE` store from inside THIS component's own render (the technique
 * `MatSelect` uses) is confirmed, by the SAME "SSR is single-pass" mechanism documented in
 * `core/mat-form-field-control.ts`, to run too late to affect `MatFormField`'s OWN
 * already-computed JSX for a preset, non-empty value (`preset-value`/`disabled` scenarios).
 *
 * `touched`/`dirty`/`invalid` are intentionally NOT props here (unlike `MatInput`'s own, which
 * mirror them for the SAME static-read purpose) — this component always reads the LIVE values
 * off `picker.touched`/`picker.dirty`/`picker.parseError`/`.minError`/`.maxError` instead,
 * because those are tracked INTERNALLY (mirrors the implicit `NgControl`'s own touched/dirty/
 * valid bookkeeping — see `timepicker-runtime.ts`'s `closeTimepickerPanel`/`assignUserSelection`/
 * `updateValidation`). The consumer still needs to pass the SAME signals as top-level
 * `<MatFormField touched={picker.touched.value} dirty={picker.dirty.value} invalid={...}>` props
 * for the FORM FIELD's own classes to stay live after mount (same static-vs-live split every
 * other control in this port already has).
 *
 * ```tsx
 * const picker = useMatTimepicker<Date>({value: value.value, onValueChange$: v => (value.value = v)});
 * const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;
 *
 * <MatFormField
 *   label={<MatLabel>Pick a time</MatLabel>}
 *   touched={picker.touched.value}
 *   dirty={picker.dirty.value}
 *   invalid={invalid}
 *   control={
 *     <MatTimepickerInput
 *       picker={picker}
 *       formBound
 *       value={formatTimeForDisplay(value.value) || undefined}
 *     />
 *   }
 *   iconSuffix={<MatTimepickerToggle picker={picker} />}
 * />
 * ```
 */
export interface MatTimepickerInputProps<D = unknown> extends Omit<
  MatFormFieldControlProps,
  'touched' | 'dirty' | 'invalid'
> {
  /** The shared handle from `useMatTimepicker()`. Declared generic for documentation purposes —
   *  like `MatSelectProps<T>`, the `component$` itself is instantiated at the default `D =
   *  unknown` (a `component$` can't be generic per call site); passing a concrete
   *  `MatTimepickerHandle<Date>` here still type-checks structurally. */
  picker: MatTimepickerHandle<D>;
  /** Mirrors `[matTimepickerOpenOnClick]`. Default `true`. */
  openOnClick?: boolean;
  name?: string;
  class?: string | ReadonlyArray<string>;
  onInput$?: QRL<(event: Event, el: NativeInputElement) => void>;
  onFocus$?: QRL<(event: FocusEvent, el: NativeInputElement) => void>;
  onBlur$?: QRL<(event: FocusEvent, el: NativeInputElement) => void>;
}

export const MatTimepickerInput = component$<MatTimepickerInputProps>(props => {
  const picker = props.picker;
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();
  const openOnClick = props.openOnClick ?? true;
  const required = props.required ?? false;
  // Default `false` — see this file's own doc comment's "formBound MUST ALWAYS be passed as
  // literal `true`" note for every scenario THIS PORT established before 2026-10-31. That note
  // was written against this port's own `/qwik-parity/mat-timepicker/*` scenarios, which (like
  // every pre-existing `MatTimepickerInput` call site in this dev-app) always bind
  // `[(ngModel)]`/`[formControl]` upstream — hence always carrying Angular's `NgControlStatus`
  // classes. `material.angular.dev`'s own `timepicker-overview` docs example
  // (`<input matInput [matTimepicker]="picker">`, no ngModel/formControl at all) is the first
  // GENUINELY unbound usage this port renders — confirmed live, Angular's real `<input>` there
  // carries NONE of `ng-untouched`/`ng-pristine`/`ng-valid` (`NgControlStatus`'s selector is
  // `[formControlName],[ngModel],[formControl]`; none present, so it never activates). Gating
  // these three classes behind this flag (default `false`, matching `MatInput`'s own convention)
  // fixes that gap with zero effect on any existing scenario, which all pass `formBound`
  // explicitly already.
  const formBound = props.formBound ?? false;

  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);
  const isInFormField = formField !== undefined;
  // Stashed for `timepicker-runtime.ts`'s `openTimepickerPanel`/origin resolution — see
  // `useMatTimepicker()`'s doc comment on `_formFieldOrigin` for why a plain field assignment
  // here (not a signal write) is safe: it's only ever READ later, from inside an event handler,
  // never during another component's own render.
  picker._formFieldOrigin = useContext(MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined);
  picker._formFieldLabelId = formField?.labelId;

  // Always read LIVE off the shared handle — see this file's own doc comment for why
  // `touched`/`dirty`/`invalid` aren't props here at all (unlike `MatInput`'s own).
  const touched = picker.touched.value;
  const dirty = picker.dirty.value;
  const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;
  // Mirrors `AbstractControl.valid`/`.invalid` both reporting `false` while `DISABLED` —
  // confirmed live: a disabled timepicker's input never carries `ng-valid`/`ng-invalid`, only
  // `ng-pristine ng-untouched`.
  const showValidityClass = !picker.disabled.value;
  // Mirrors the DEFAULT `ErrorStateMatcher` (`control.invalid && control.touched`) — gates
  // `aria-invalid`, same formula `mat-input.tsx`'s own `errorState` uses.
  // Default ErrorStateMatcher: `invalid && (touched || form.submitted)` — see core/mat-form.tsx.
  const formSubmitted = useMatFormSubmitted();
  const errorState = invalid && (touched || formSubmitted);

  const id = formField ? formField.assignedId : props.id;
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];

  // SSR-correct initial display string, snapshotted once — mirrors `MatInput`'s own
  // `initialValue` pattern (see that component's doc comment for the full "value is a DOM
  // property, not an attribute" rationale this also relies on).
  const initialDisplay = useSignal(() => formatTimeForDisplay(picker.value.value));

  const handleFocus$ = $((event: FocusEvent) => {
    if (!picker.disabled.value && formField) {
      formField.focused = true;
      formField.shouldLabelFloat = true;
    }
    props.onFocus$?.(event, picker._inputRef.value as NativeInputElement);
  });

  const handleBlur$ = $((event: FocusEvent) => {
    handleTimepickerBlur(picker);
    const liveEmpty = !picker._inputRef.value?.value;
    if (formField) {
      formField.focused = false;
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = !liveEmpty;
    }
    props.onBlur$?.(event, picker._inputRef.value as NativeInputElement);
  });

  const handleInput$ = $((event: Event) => {
    handleTimepickerInput(event, picker);
    props.onInput$?.(event, picker._inputRef.value as NativeInputElement);
  });

  const handleKeyDown$ = $((event: KeyboardEvent) => {
    handleTimepickerInputKeydown(event, picker, ctx, animationsDisabled.value);
  });

  // Bound to the input itself (upstream binds to the form field's connected-overlay origin, so
  // the whole field is clickable) — see `use-mat-timepicker.ts`'s own doc comment / SYNC.md for
  // why this port narrows it to the `<input>` element: every parity scenario that opens via a
  // click targets the input directly, so the two are indistinguishable for this project's own
  // purposes.
  const handleClick$ = $(() => {
    if (picker.disabled.value || !openOnClick) return;
    openTimepickerPanel(picker, ctx, animationsDisabled.value);
  });

  const isOpen = picker.isOpen.value;
  const activeIndex = picker._activeIndex.value;
  const renderOptions = picker._renderOptions.value;
  const ariaActiveDescendant =
    isOpen && activeIndex >= 0 ? renderOptions[activeIndex]?.id : undefined;

  const classes = [
    'mat-timepicker-input',
    'mat-mdc-input-element',
    isInFormField && 'mat-mdc-form-field-input-control',
    isInFormField && 'mdc-text-field__input',
    'cdk-text-field-autofill-monitored',
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && showValidityClass && (invalid ? 'ng-invalid' : 'ng-valid'),
    props.class,
  ].filter(Boolean) as string[];

  return (
    <>
      <input
        ref={picker._inputRef}
        role="combobox"
        type="text"
        id={id}
        class={classes}
        disabled={picker.disabled.value || undefined}
        required={required || undefined}
        name={props.name || undefined}
        // Plain attribute spread (bypasses Qwik's boolean-mapped `readOnly` JSX prop) so the DOM
        // gets a literal STRING `readonly="true"`, matching `matInput`'s own `[attr.readonly]`
        // — see `mat-input.tsx`'s identical comment. Not exercised by any timepicker scenario.
        {...{readonly: props.readOnly ? 'true' : undefined}}
        aria-haspopup="listbox"
        aria-expanded={isOpen ? 'true' : 'false'}
        aria-controls={isOpen ? picker.panelId : undefined}
        aria-activedescendant={ariaActiveDescendant}
        aria-invalid={errorState ? 'true' : 'false'}
        aria-required={required ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        {...{'mat-timepicker-id': picker.panelId}}
        {...{value: initialDisplay.value || undefined}}
        onClick$={handleClick$}
        onFocus$={handleFocus$}
        onBlur$={handleBlur$}
        onInput$={handleInput$}
        onKeyDown$={handleKeyDown$}
      />
      <mat-timepicker {...{'mat-timepicker-panel-id': picker.panelId}} />
    </>
  );
});
