// Public API for @angular-community/qwik-material/form-field.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and form-field/SYNC.md.

export type {
  MatFormFieldConfig,
  MatFormFieldAppearance,
  MatFormFieldFloatLabelType,
  MatFormFieldSubscriptSizing,
  MatFormFieldColor,
} from './form-field-config';
export {MAT_FORM_FIELD_CONFIG} from './form-field-config';

export {MatFormField, type MatFormFieldProps} from './mat-form-field';
export {MatLabel, type MatLabelProps} from './mat-label';
export {MatHint, type MatHintProps} from './mat-hint';
export {MatError, type MatErrorProps} from './mat-error';
export {
  MatIconPrefix,
  MatTextPrefix,
  MatIconSuffix,
  MatTextSuffix,
  type MatAffixProps,
} from './mat-affix';

// Re-exported here for convenience — the form-control primitive lives in
// `core/` (shared with future select/datepicker/chips ports) but is the
// documented pairing for `<MatFormField>` + `<MatInput>` error-state usage.
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
} from '../core/mat-form-control';
export type {MatFormFieldControlProps} from '../core/mat-form-field-control';
