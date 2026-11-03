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
  useOptionalFormFieldControlState,
  useOptionalFormFieldConnectedOrigin,
  type MatFormFieldControlProps,
  type MatFormFieldControlState,
} from './mat-form-field-control';

export {
  MAT_ERROR_STATE_MATCHER,
  MAT_ERROR_STATE_MATCHER_DEFAULT,
  resolveErrorStateSync,
  type MatErrorStateMatcher,
  type MatErrorStateSnapshot,
} from './error-state-matcher';

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
// `qwik-material/timepicker` and `qwik-material/datepicker`. See `datetime/date-adapter.ts`'s
// module doc comment, and `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS /
// MAT_DATE_LOCALE / dateClass" section for the pluggable-adapter design.
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
export {
  createNativeDateAdapter,
  DEFAULT_DATE_ADAPTER,
  NativeDateAdapter,
} from './datetime/native-date-adapter';
export {MAT_DATE_FORMATS, type MatDateFormats} from './datetime/date-formats';
export {MAT_NATIVE_DATE_FORMATS} from './datetime/native-date-formats';
export {
  MAT_DATE_ADAPTER,
  MAT_DATE_ADAPTER_FACTORY,
  MAT_DATE_LOCALE,
  DEFAULT_DATE_ADAPTER_FACTORY,
  useDateAdapter,
  useDateAdapterFactory,
  useDateFormats,
  useDateLocale,
  resolveDateAdapter,
} from './datetime/use-date-adapter';
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

// Standalone `matRipple` directive (`src/material/core/ripple/ripple.ts`) — see
// `ripple/use-mat-ripple.ts`'s doc comment and `qwik-material/README.md`'s "Composing directives".
export {useMatRipple, type UseMatRippleProps, type MatRippleHook} from './ripple/use-mat-ripple';
export {MatRipple, type MatRippleProps} from './ripple/mat-ripple';
export {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  useRippleGlobalOptions,
  type RippleGlobalOptions,
} from './ripple/ripple-global-options';
export {launchRipple, fadeOutAllRipples, fadeOutAllNonPersistentRipples} from './ripple/ripple-dom';
export type {RippleConfig, RippleAnimationConfig, RippleRef} from './ripple/ripple-ref';
