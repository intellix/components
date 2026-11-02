import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatError, MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';
import styles from './timepicker-validation-example.css?inline';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

/**
 * Port of material.angular.dev's `timepicker-validation` docs example
 * (src/components-examples/material/timepicker/timepicker-validation/) — `matTimepickerMin=
 * "12:30"`/`matTimepickerMax="17:30"` (time STRINGS at the template level) become real `Date`s
 * here (`time(12, 30)`/`time(17, 30)`) — this port's `min`/`max` hook options only accept a `D`
 * directly (see the overview's own "Input validation" section + `timepicker/SYNC.md` deviation
 * #4), unlike upstream's own string-accepting template input. Same `useMatTimepicker()`-only
 * (no separate `useMatFormControl()`) convention as `mat-timepicker/min-max`'s own mirror
 * scenario — see that route's doc comment.
 */
export default component$(() => {
  useStyles$(styles);
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    min: time(12, 30),
    max: time(17, 30),
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  const errors = picker.parseError.value
    ? {matTimepickerParse: true}
    : picker.minError.value
      ? {matTimepickerMin: true}
      : picker.maxError.value
        ? {matTimepickerMax: true}
        : null;

  return (
    <timepicker-validation-example>
      <MatFormField
        label={<MatLabel>Pick a time</MatLabel>}
        touched={picker.touched.value}
        dirty={picker.dirty.value}
        invalid={errors !== null}
        control={
          <MatTimepickerInput
            picker={picker}
            formBound
            value={formatTimeForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={<MatTimepickerToggle picker={picker} />}
        errors={[
          picker.parseError.value ? <MatError>Value isn't a valid time</MatError> : undefined,
          picker.minError.value ? <MatError>Value is too early</MatError> : undefined,
          picker.maxError.value ? <MatError>Value is too late</MatError> : undefined,
        ]}
      />

      <p>Enter a value before 12:30 PM or after 5:30 PM to see the errors</p>
      <p>Errors: {JSON.stringify(errors)}</p>
    </timepicker-validation-example>
  );
});
