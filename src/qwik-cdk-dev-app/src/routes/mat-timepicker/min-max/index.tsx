import {$, component$, useSignal} from '@qwik.dev/core';
import {MatError, MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerMinMax — a bare FormControl (no
// Validators), matTimepickerMin/Max bound to 9:00 AM/5:00 PM, three conditional <mat-error>s for
// matTimepickerParse/Min/Max. touched/dirty come from `picker` itself (see
// use-mat-timepicker.ts's doc comment): the implicit control upstream's bare `FormControl`
// creates has the SAME touched/dirty semantics as every other scenario's `[(ngModel)]` — no
// separate `useMatFormControl()` needed.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    min: time(9, 0),
    max: time(17, 0),
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;
  const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Pick a time</MatLabel>}
          touched={picker.touched.value}
          dirty={picker.dirty.value}
          invalid={invalid}
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
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
