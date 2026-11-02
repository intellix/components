// Public API for @angular-community/qwik-material/core.
// Mirrors upstream's src/material/core/ location for the pieces shared
// across components (today: MatPseudoCheckbox). See
// docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.

export {
  MatPseudoCheckbox,
  type MatPseudoCheckboxProps,
  type MatPseudoCheckboxState,
} from './mat-pseudo-checkbox';

export {MatInternalFormField, type MatInternalFormFieldProps} from './mat-internal-form-field';

export {MatOption, type MatOptionProps} from './mat-option';
export {MatOptgroup, type MatOptgroupProps} from './mat-optgroup';

export {
  MAT_FORM_FIELD_CONTROL_STATE,
  MAT_FORM_FIELD_CONNECTED_ORIGIN,
  readControlProps,
  type MatFormFieldControlProps,
  type MatFormFieldControlState,
} from './mat-form-field-control';

export {
  useMatFormControl,
  matRequiredValidator,
  matEmailValidator,
  matValidationErrors,
  matControlValid,
  matControlInvalid,
  matControlHasError,
  matControlHasValidator,
  type MatFormControl,
  type MatFormControlOptions,
  type MatValidatorFn,
  type MatValidationErrors,
} from './mat-form-control';

// Date adapter abstraction (upstream `src/material/core/datetime/*`) — shared by
// `qwik-material/timepicker` today, intended for a future date picker too. See
// `datetime/date-adapter.ts`'s module doc comment.
export type {DateAdapter} from './datetime/date-adapter';
export {
  compareDateDefault,
  compareTimeDefault,
  sameDateDefault,
  sameTimeDefault,
  clampDateDefault,
  getValidDateOrNullDefault,
  deserializeDefault,
} from './datetime/date-adapter';
export {createNativeDateAdapter, DEFAULT_DATE_ADAPTER} from './datetime/native-date-adapter';
export {MAT_DATE_FORMATS, type MatDateFormats} from './datetime/date-formats';
export {MAT_NATIVE_DATE_FORMATS} from './datetime/native-date-formats';
export {MAT_DATE_ADAPTER, useDateAdapter, useDateFormats} from './datetime/use-date-adapter';
export {
  MAT_FORM,
  MatForm,
  MatFormSubmittedProvider,
  useMatFormSubmitted,
  type MatFormProps,
  type MatFormState,
  type MatFormSubmittedProviderProps,
} from './mat-form';

// Directive-hook composition infrastructure ("Composing directives" in
// README.md) — shared by every `use*` directive hook (`useMatMenuTrigger`,
// `useMatTooltip`, `useMatBadge`, `useMatStepperNext`/`useMatStepperPrevious`)
// and every host component that accepts their `HostProps`.
export {
  mergeHostProps,
  callHostHandler,
  extraHostAttrs,
  composeRef,
  type HostProps,
  type HostRef,
  type HostHandler,
} from './host-props';

// See jsx-reuse.ts's own doc comment: rebuilds a captured `JSXOutput` into fresh node objects
// before re-rendering it a second (or Nth) time in a new tree — a Qwik v2 regression workaround.
export {cloneJsxForReuse} from './jsx-reuse';
