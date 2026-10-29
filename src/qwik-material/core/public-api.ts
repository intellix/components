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
